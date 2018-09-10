import ListItem from './ListItem.vue';
// Some extra, global variables are defined in 'test-setup.js'.


describe('sub/ListItem', () => {
  const dictInfo  = { id: 'D01', name: 'Dict.1'  };
  const dictInfoN = { id: '00',  name: 'Numbers' };

  const item = { dictID: 'D01', id: 'id-1', str: 'abcde', descr: 'Abcde',
    type: 'S',
    terms: [{ str: 'abcde' }, { str: 'Q' }],
    z: { stars: '**' } };
  const itemN = { dictID: '00', id: '00:5e+0', str: '5', descr: 'number',
    type: 'N' };
  const itemN2 = { dictID: '00', id: '00:1.2e+1', str: '12', descr: 'twelve',
    type: 'S' };  // A number-str as a queried match, not as VsmDict.-generated.
  const itemR = { str: 'it', descr: 'referring term', type: 'R' };
  const itemN_shortID = '5e+0';
  const itemN2_shortID = '1.2e+1';

  const maxStringLengths = {str: Number.MAX_VALUE, strAndDescr: Number.MAX_VALUE};
  const maxStringLengthsS = { str: 3, strAndDescr: Number.MAX_VALUE };
  const maxStringLengthsD = { str: Number.MAX_VALUE, strAndDescr: 8 };
  const maxStringLengthsSD = { str: 3, strAndDescr: 6 };

  const vsmDictionary = {
    numberMatchConfig: { dictID: '00', conceptIDPrefix: '00:' }
  };


  // A function for creating a test-component with custom props.
  const make = props => shallowMount(
    ListItem,
    { propsData: Object.assign(
      // Add at least these 4 props; give them default (but overridable) values:
      { item, maxStringLengths, dictInfo, vsmDictionary },
      // A test can override the above and add others, via the `props` argument:
      props
    ) }
  );

  // Shorthands for testing the text/html of a ListItem's different html-parts.
  const _str   = wrap => wrap.find('.item-part-str'  ).text();
  const _descr = wrap => wrap.find('.item-part-descr').text();
  const _info  = wrap => wrap.find('.item-part-info' ).text();
  const _extra = wrap => wrap.find('.item-part-extra').html(); // I.e. full HTML.
  const _strT   = wrap => wrap.find('.item-part-str'  ).attributes().title;
  const _descrT = wrap => wrap.find('.item-part-descr').attributes().title;
  const _infoT  = wrap => wrap.find('.item-part-info' ).attributes().title;


  it('initializes, when getting only the required props', () => {
    shallowMount(ListItem, {
      propsData: {
        /// searchStr: '',
        item,
        maxStringLengths,
        /// dictInfo,
        /// vsmDictionary:  {}
      }
    });
  });


  it('emits a (left-button) click event, with the ListItem\'s `index`', () => {
    var wrap = make({ index: 3 });
    wrap.trigger('click', { button: 0 });  /// (Or: `wrap.element.click()`).
    wrap.emitted('click')[0][0].should.equal(3);  // Emits its index: '3'.
    wrap.trigger('click', { button: 2 });
    wrap.emitted('click').length.should.not.equal(2); // Did not emit 2nd event.
  });

  it('emits a hover event, with the `index`, ' +
     'when it detects a mousemove event', () => {
    // Note: not just mouseenter but mouseover/mousemove!
    // Like that, after a user had used arrow-up/down, s/he can switch to the
    // mouse, without potentially having to leave & enter the intended ListItem,
    // if the mouse pointer would already be over it.
    var wrap = make({ index: 3 });
    wrap.trigger('mousemove');
    wrap.emitted('hover')[0][0].should.equal(3);
  });

  it('on mousedown: ' +
     'cancels the event so it doesn\'t steal focus from TheInput; ' +
     'and emits a hover event', () => {
    var wrap = make({ index: 3 });
    var called = 0;  // Hack, because `event.isDefaultPrevented()` does not work.
    wrap.trigger('mousedown', {
      button: 0,
      preventDefault: () => { called = 1 }
    });
    called.should.equal(1);  // Cancels the event.
    wrap.emitted('hover')[0][0].should.equal(3);  // Emits 'hover' event.
  });


  it('shows `str`, `descr`, `dictID`, and dict-title ' +
     'for a normal item; and puts `descr` and `dictID` in parentheses', () => {
    var wrap = make({});
    _str  (wrap).should.equal(item.str);
    _descr(wrap).should.equal('(' + item.descr  + ')');
    _info (wrap).should.equal('(' + item.dictID + ')');
    _infoT(wrap).should.equal(item.id + ' in ' + dictInfo.name);
  });

  it('shows `str`, `descr`, short-form concept-ID, and dict-title ' +
     'for number-type items; and puts `descr` in square brackets', () => {
    var wrap = make({ item: itemN, dictInfo: dictInfoN });
    _str  (wrap).should.equal(itemN.str);
    _descr(wrap).should.equal('[' + itemN.descr   + ']');
    _info (wrap).should.equal('(' + itemN_shortID + ')');
    _infoT(wrap).should.equal(itemN.id + ' in ' + dictInfoN.name);

    wrap = make({ item: itemN2, dictInfo: dictInfoN });
    _str  (wrap).should.equal(itemN2.str);
    _descr(wrap).should.equal('[' + itemN2.descr   + ']');
    _info (wrap).should.equal('(' + itemN2_shortID + ')');
    _infoT(wrap).should.equal(itemN2.id + ' in ' + dictInfoN.name);
  });

  it('shows `str` and `descr` for a refTerm-type item, no info-part; ' +
     'and puts `descr` in square brackets', () => {
    var wrap = make({ item: itemR });
    _str  (wrap).should.equal(itemR.str);
    _descr(wrap).should.equal('[' + itemR.descr   + ']');
    wrap.find('.item-part-info' ).exists().should.equal(false);
  });

  it('omits `dictInfo`-related output if none is given', () => {
    var wrap = make({ dictInfo: undefined });
    _info (wrap).should.equal('(' + item.dictID + ')');
    _infoT(wrap).should.equal( item.id);  // I.e. no "+ ' in ' + dictInfo.name".
  });


  it('applies a custom render function ' +  // (This is just a superficial test).
     '`f_aci()`, which gets all needed data passed as its arguments', () => {

    var dictInfoF = { id: 'D01', name: 'Dict.1',
      f_aci: (item, strs, searchStr, maxStringLengths, dictInfo, vsmDict) => ({
        str: `--${strs.str}--` + (item.z ? item.z.stars : ''),
        strTitle: 'strTitle__',
        descr: (item.terms || []).map(t => t.str).join(',') + ',' + strs.descr,
        descrTitle: 'descrTitle__',
        info: 'info__',
        infoTitle: '__' +  // Helps test that all args are passed correctly:
          [ item.id, searchStr,
            maxStringLengths.str, maxStringLengths.strAndDescr,
            dictInfo.id, dictInfo.name, vsmDict.numberMatchConfig.dictID,
            vsmDict.numberMatchConfig.conceptIDPrefix,
            strs.str, strs.strTitle, strs.descr, strs.descrTitle,
            strs.info, strs.infoTitle, strs.extra ].join('__') + '__',
        extra: '<i a="b">extra__</i>'
      })
    };

    var searchStr = 'SRCH';
    var w = make({ searchStr, maxStringLengths, dictInfo: dictInfoF });

    _str   (w).should.equal('--' + item.str + '--**');  // New `strs.str`.
    _strT  (w).should.equal('strTitle__');              // New `strs.strTitle`.
    _descr (w).should.equal(`(abcde,Q,${item.descr})`); // New `strs.descr`.
    _descrT(w).should.equal('descrTitle__');            // New `strs.descrTitle`.
    _info  (w).should.equal('(' + 'info__' + ')');      // New `strs.info`.
    _extra (w).should.contain('<i a="b">extra__</i>');  // New `strs.extra`.

    // Test that all `f_aci()`-arguments are passed correctly.
    var strs = {  // This object is built in ListItem's computed `strs()`.
      str:      item.str,
      strTitle: '',
      descr:      item.descr,
      descrTitle: '',
      info:      item.dictID,
      infoTitle: item.id + ' in ' + dictInfo.name,
      extra: ''  // -> is always given as '' to f_aci(), which may replace it.
    };
    _infoT(w).should.equal('__' +
      [ item.id, searchStr, maxStringLengths.str, maxStringLengths.strAndDescr,
        dictInfoF.id, dictInfoF.name, vsmDictionary.numberMatchConfig.dictID,
        vsmDictionary.numberMatchConfig.conceptIDPrefix,
        strs.str, strs.strTitle, strs.descr, strs.descrTitle,
        strs.info, strs.infoTitle, strs.extra ].join('__') + '__'
    );
  });


  it('accepts HTML-code from the custom render function, ' +
     'but secures against `<script>`, `<iframe>`, etc. tags, ' +
     'and `"` in title-attributes ', () => {
    var html = make({
      maxStringLengths: maxStringLengthsSD,
      dictInfo: Object.assign({}, dictInfo, {
        f_aci: (item, strs) => Object.assign(strs, {
          strTitle:   '<x1>"<script>',
          str:        '<x2>"<script>',
          descrTitle: '<x3>"<script>',
          descr:      '<x4>"<script>',
          infoTitle:  '<x5>"<script>',
          info:       '<x6>"<script>',
          extra:      '<x7>"<script>< script="a"><iframe>< style><textarea\n>'
        })
      }),
    }).html();
    ///H(html);
    html.should.contain('<x1>&quot;<script');
    html.should.contain(  '<x2>"&lt;script');
    html.should.contain('<x3>&quot;<script');
    html.should.contain(  '<x4>"&lt;script');
    html.should.contain('<x5>&quot;<script');
    html.should.contain(  '<x6>"&lt;script');
    html.should.contain(  '<x7>"&lt;script');
    html.should.contain(      '&lt; script=');
    html.should.contain(       '&lt;iframe');
    html.should.contain(      '&lt; style');
    html.should.contain(       '&lt;textarea');
  });

  it('drops empty \'title\' attributes', () => {
    var wrap = make({
      dictInfo: Object.assign({}, dictInfo, {
        f_aci: (item, strs) => Object.assign(strs, {
          strTitle: '',
          str: '',
          descrTitle: '',
          infoTitle: ''
        })
      }),
    });
    expect(_strT  (wrap)).to.equal(undefined);
    expect(_descrT(wrap)).to.equal(undefined);
    expect(_infoT (wrap)).to.equal(undefined);
  });

  it('drops empty \'<span>\' tags, except for \'.item-part-str\'', () => {
    var wrap = make({
      dictInfo: Object.assign({}, dictInfo, {
        f_aci: (item, strs) => Object.assign(strs, {
          str: '',
          descr: '',
          info: '',
          extra: '',
          strTitle: 'test',
          descrTitle: 'test',
          infoTitle: 'test'
        })
      }),
    });
    wrap.find('.item-part-str'  ).exists().should.equal(true );
    wrap.find('.item-part-descr').exists().should.equal(false);
    wrap.find('.item-part-info' ).exists().should.equal(false);
    wrap.find('.item-part-extra').exists().should.equal(false);
  });


  it('limits `str`   length, and shows it fully in a \'title\' attribute', () => {
    var wrap = make({ maxStringLengths: maxStringLengthsS });
    _str  (wrap).should.equal(item.str.substr(0, 2) + '…');
    _strT (wrap).should.equal(item.str);
    _descr(wrap).should.equal('(' + item.descr + ')'); // `descr` wasn't changed.
  });

  it('limits `descr` length, and shows it fully in a \'title\' attribute', () => {
    var wrap = make({ maxStringLengths: maxStringLengthsD });
    _str   (wrap).should.equal(item.str);
    _descr (wrap).should.equal('(' + item.descr.substr(0, 2) + '…' + ')');
    _descrT(wrap).should.equal(item.descr);
  });

  it('limits `str` + `descr` lengths together, ' +
     'and shows them fully in \'title\' attributes', () => {
    var wrap = make({ maxStringLengths: maxStringLengthsSD });
    _str   (wrap).should.equal(item.str.substr(0, 2) + '…');
    _strT  (wrap).should.equal(item.str);
    _descr (wrap).should.equal('(' + item.descr.substr(0, 2) + '…' + ')');
    _descrT(wrap).should.equal(item.descr);
  });
});
