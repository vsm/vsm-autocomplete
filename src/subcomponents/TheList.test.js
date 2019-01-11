import TheList from './TheList.vue';
// Some extra, global variables are defined in 'test-setup.js'.


describe('sub/TheList', () => {

  // Prepare default values for the three required props, for our tests:

  const dictInfos = {
    D01:  { id: 'D01', name: 'Dict.1' },
    '00': { id: '00', name: 'Numbers' },
  };

  const items = [
    { id:'00:5e+0', dictID:'00',  str: '5',   descr: 'number',         type: 'N' },
    {                             str: 'it',  descr: 'referring term', type: 'R' },
    { id: 'idf-1', dictID: 'D01', str: 'abc', descr: 'Abc', type: 'F' },
    { id: 'idf-2', dictID: 'D01', str: 'cde', descr: 'Abc', type: 'G' },
    { id: 'id-1',  dictID: 'D01', str: 'abc', descr: 'Abc', type: 'S' },
    { id: 'id-2',  dictID: 'D01', str: 'cde', descr: 'Abc', type: 'T' },
  ];

  const maxStringLengths = {str: Number.MAX_VALUE, strAndDescr: Number.MAX_VALUE};


  const make = props => mount(TheList, {
    propsData: Object.assign(
      { items, maxStringLengths, dictInfos },
      props
    )
  });


  it('initializes, when getting only the required props', () => {
    var wrap = shallowMount(TheList, {
      propsData: {
        /// searchStr: '',
        items,
        maxStringLengths,
        /// queryOptions: {},
        dictInfos,
        /// hasItemLiteral: false,
        /// customItemLiteral: false,
        /// customItem: false,
        /// activeIndex: 0,
        /// vsmDictionary: {}
      }
    });
    wrap.vm.indexLastFixedItem.should.equal(3);
  });


  it('initializes, by default without a ListItemLiteral', () => {
    var wrap = make({ activeIndex: 2 });

    // There should be no item-literal.
    expect(wrap.find('.item-type-literal').element).to.equal(undefined);
  });

  it('can add a ListItemLiteral', () => {
    var wrap = make({ activeIndex: 2, hasItemLiteral: true });
    ///H(wrap);

    // In this test, an item-literal does exists.
    wrap.find('.item-type-literal').element.should.not.equal(undefined);
  });


  it('makes all list-items unselectable', () => {
    var wrap = make({ hasItemLiteral: true });
    var wraps = wrap.findAll('.item');

    wraps.wrappers.forEach(w => {
      w.attributes().unselectable.should.not.equal(undefined);
    });
  });


  it('passes `maxStringLengths` to all ListItems', () => {
    var wrap = make({  maxStringLengths: {str: 2} });
    var wraps = wrap.findAll('.item');

    wraps.wrappers.forEach(w => {
      (w.find('.item-part-str').text().length <= 2) .should.equal(true);
    });
  });


  it('passes `maxStringLengths` and `searchStr` to ListItemLiteral', () => {
    var wrap = make(
      { hasItemLiteral: true, maxStringLengths: {str: 4}, searchStr: '12345' });

    ///H(wrap.find('.item-type-literal').text());
    wrap.find('.item-type-literal').text().startsWith('123…')
      .should.equal(true);
  });


  it('passes all attributes that `customItem()` needs, to ListItem: ' +
     '`searchStr`, `item`, `dictInfo`, `vsmDictionary`, etc', () => {
    var spyData = {};

    var item4 = items[4];       // Use just one of the `items`.
    var customItem = data => {  // Link it to a `customItem()` that spies.
      spyData      = Object.assign({}, data);  // Deep-clone, as ListItem.vue..
      spyData.strs = Object.assign({}, data.strs);      // ..modifies it later.
      return data.strs;
    };
    var msLengths2 = Object.assign(maxStringLengths, { str: 4 });
    var vsmDict2 = { x: 'test' };

    var wrap = make(
      { items: [item4],
        dictInfos: dictInfos,
        maxStringLengths: msLengths2,
        queryOptions: { filter: { dictIDs: ['D01', 'D05'] } },
        customItem: customItem,
        searchStr: 'ab',
        vsmDictionary: vsmDict2 });

    wrap.findAll('.item').length.should.equal(1);  // Sanity test.
    spyData.should.deep.equal({
      item: item4,
      searchStr: 'ab',
      maxStringLengths: msLengths2,
      queryOptions: { filter: { dictIDs: ['D01', 'D05'] } },
      dictInfo: dictInfos[item4.dictID],
      vsmDictionary: vsmDict2,
      strs: {
        str:        item4.str,
        strTitle:   '',
        descr:      item4.descr,
        descrTitle: '',
        info:       item4.dictID,
        infoTitle:  item4.id + ' in ' + dictInfos[item4.dictID].name,
        extra:      ''
      }
    });
  });


  it('for a click / hover on a ListItem: ' +
     'emits a item-click/hover event, with the `index`', () => {
    var wrap = make({ activeIndex: 2 });
    var listItem = wrap.find('.item-state-active'); // Let's use the active item.
    listItem.trigger('click', { button: 0 });
    listItem.trigger('mousemove');  // Not 'hover'. 'Mousemove' on subcomp!
    wrap.emitted('item-click')[0][0].should.equal(2);
    wrap.emitted('item-hover')[0][0].should.equal(2);
  });


  it('does that too, for the itemLiteral', () => {
    var wrap = make({ activeIndex: 2, hasItemLiteral: true });
    var listItem = wrap.find('.item-type-literal'); // Now, use the item-literal.
    listItem.trigger('click', { button: 0 });
    listItem.trigger('mousemove');
    wrap.emitted('item-click')[0][0].should.equal(6);
    wrap.emitted('item-hover')[0][0].should.equal(6);
  });


  it('for a click on TheList itself, e.g. padding between some items: ' +
     'emits a item-click event, with the active `index`', () => {
    var wrap = make({ activeIndex: 2 });
    wrap.trigger('click', { button: 0 });
    wrap.emitted('item-click')[0][0].should.equal(2);
  });


  it('adds all CSS classes correctly to its ListItems', () => {
    // Note: we don't test internal state (like `indexLastFixedItem == 3`), as
    // it may change after refactoring.  We test the state's effect on the HTML.

    var wrap = make({ activeIndex: 4, hasItemLiteral: true });

    ///var wraps = wrap.findAll('.list > div');
    ///wraps.wrappers.forEach(w => w.classes().should.contain('item'));

    var wraps = wrap.findAll('.item'); // All items, plus item-literal, should..
    wraps.length.should.equal(items.length + 1);     // ..result in a list-item.

    wraps.at(0).classes().should.contain('item-pos-first');
    wraps.at(0).classes().should.contain('item-pos-first');
    wraps.at(0).classes().should.contain('item-type-number');

    wraps.at(1).classes().should.contain('item-type-ref');

    wraps.at(2).classes().should.contain('item-type-fixed');

    wraps.at(3).classes().should.contain('item-type-fixed');
    wraps.at(3).classes().should.contain('item-type-fixed-last');

    wraps.at(4).classes().should.contain('item-state-active');
    for (let i = 0; i < wraps.length; i++) {
      if (i != 4)  wraps.at(i).classes().should.not.include('item-state-active');
    }

    wraps.at(5).classes().should.contain('item-pos-last');

    wraps.at(6).classes().should.contain('item-type-literal');
  });


  it('also adds CSS classes correctly to an active ListItemLiteral', () => {
    var wrap = make({ activeIndex: 6, hasItemLiteral: true });

    wrap.find('.item-type-literal')
      .classes().should.contain('item-state-active');
  });


  it('passes a `customItemLiteral` attribute to a ListItemLiteral', () => {
    var wrap = make({
      items: [],             // } Only create one list-item: a ListItemLiteral.
      hasItemLiteral: true,  // }
      searchStr: '12345678',
      maxStringLengths: { str: 5 },
      customItemLiteral: data => {
        data.strs.str = '<sup>T</sup>est: ' + data.strs.str;
        return data.strs;
      }
    });

    wrap.find('.item').html()
      .should.contain('><sup>T</sup>est: 1234…</');
  });
});
