import { shallow, mount } from '@vue/test-utils';
import TheList from './TheList.vue';


describe('sub/TheList', () => {

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

  const maxStringLengths =
    { str: Number.POSITIVE_INFINITY, strAndDescr: Number.POSITIVE_INFINITY };


  const make = (props, deeply = false) => (deeply ? mount : shallow) (
    TheList,
    { propsData: Object.assign(
      { items, maxStringLengths, dictInfos },
      props
    ) }
  );

  const fire = function(elem, type, options) {
    elem.dispatchEvent( Object.assign(new CustomEvent(type), options) );
  };


  it('initializes', () => {
    var wrap = shallow(TheList, {
      propsData: {
        /// searchStr: '',
        items,
        maxStringLengths,
        dictInfos,
        /// hasItemLiteral: false,
        /// itemLiteralContent: false,
        /// activeIndex: 0,
        //  vsmDictionary: {}
      }
    });
    wrap.vm.indexLastFixedItem.should.equal(3);
  });

  it('initializes, and makes the viewmodel work', () => {
    var wrap = make({ activeIndex: 2 });
    wrap.vm.indexLastFixedItem.should.equal(3);
    wrap.vm.isActive(2).should.equal(true);
    wrap.vm.isActive(3).should.equal(false);
    (!!wrap.find('.item-type-literal').element)  // There should be..
      .should.equal(false);                      // ..no item-literal.
  });


  it('can add an itemLiteral', () => {
    var wrap = make(
      { activeIndex: 2, hasItemLiteral: true },
      true  // Arg 2 == `true` => makes subcomp.s too.
    );
    (!!wrap.find('.item-type-literal').element)  // Now, an item-literal..
      .should.equal(true);                       // ..exists.
  });


  it('for a click / hover on a ListItem: ' +
     'emits a item-click/hover event, with the `index`', () => {
    var wrap = make({ activeIndex: 2 }, true);
    var listItem = wrap.find('.item-state-active'); // Let's use the active item.
    fire(listItem.element, 'click', { button: 0 });
    fire(listItem.element, 'mousemove');  // Not 'hover'. 'Mousemove' on subcomp!
    wrap.emitted('item-click')[0][0].should.equal(2);
    wrap.emitted('item-hover')[0][0].should.equal(2);
  });


  it('does that too, for the itemLiteral', () => {
    var wrap = make({ activeIndex: 2, hasItemLiteral: true }, true);
    var listItem = wrap.find('.item-type-literal'); // Now, use the item-literal.
    fire(listItem.element, 'click', { button: 0 });
    fire(listItem.element, 'mousemove');
    wrap.emitted('item-click')[0][0].should.equal(6);
    wrap.emitted('item-hover')[0][0].should.equal(6);
  });


  it('adds all CSS classes correctly to its ListItems', () => {
    // 1: Get all items. 2: Get each one's 'wrapper''s attributes' class-string.
    var wraps = make({ activeIndex: 4, hasItemLiteral: true }, true)
      .findAll('.item');
    for (var i = 0, clss = []; i <= items.length; i++) {
      clss.push(wraps.at(i) .attributes().class);
    }

    clss.forEach(s => s.should.contain('item '));

    clss[0].should.contain('item-pos-first');
    clss[0].should.contain('item-type-number');

    clss[1].should.contain('item-type-ref');

    clss[2].should.contain('item-type-fixed');

    clss[3].should.contain('item-type-fixed');
    clss[3].should.contain('item-type-fixed-last');

    clss[4].should.contain('item-state-active');

    clss[5].should.contain('item-pos-last');

    clss[6].should.contain('item-type-literal');
  });

});
