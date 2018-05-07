import { shallow } from '@vue/test-utils';
import ListItem from './ListItem.vue';


describe('sub/ListItem', () => {
  // Note: a ListItem receives `dictInfos` as a ID-based Map,
  // not as an Array that is returned by a VsmDictionary.
  const dictInfo = { id: 'D01', name: 'Dict.1' };
  const dictInfoN = { id: '00', name: 'Numbers' };
  const dictInfoF = { id: 'D01', name: 'Dict.1',
    f_aci: (item, strs, searchStr, maxStringLengths, dictInfo, vsmDict) => ({
      str: `--${strs.str}--` + (item.z ? item.z.stars : ''),
      strTitle: 'strTitle__',
      descr: (item.terms || []).map(obj => obj.str).join(',') + ',' + strs.descr,
      descrTitle: 'descrTitle__',
      info: 'info__',
      infoTitle: '__' +  // Helps test that all arguments are passed correctly:
        [ item.id, searchStr, maxStringLengths.str, maxStringLengths.strAndDescr,
          dictInfo.id, dictInfo.name, vsmDict.numberMatchConfig.dictID,
          vsmDict.numberMatchConfig.conceptIDPrefix,
          strs.str, strs.strTitle, strs.descr, strs.descrTitle,
          strs.info, strs.infoTitle, strs.extra ].join('__') + '__',
      extra: '<span a="b">extra__</span>'
    })
  };

  const item = { dictID: 'D01', id: 'id-1', str: 'abcde', descr: 'Abcde',
    type: 'S',
    terms: [{ str: 'abcde' }, { str: 'x12' }],
    z: { stars: '**'} };
  const itemN = { dictID: '00', id: '00:5e+0', str: '5', descr: 'number',
    type: 'N' };
  const itemN2 = { dictID: '00', id: '00:1.2e+1', str: '12', descr: 'twelve',
    type: 'S' };  // A number-str as a queried match, not as VsmDict.-generated.
  const itemR = { str: 'it', descr: 'referring term', type: 'R' };
  const itemN_shortID = '5e+0';
  const itemN2_shortID = '1.2e+1';

  const maxStringLengths =
    { str: Number.POSITIVE_INFINITY, strAndDescr: Number.POSITIVE_INFINITY };
  const maxStringLengthsS = { str: 3, strAndDescr: Number.POSITIVE_INFINITY };
  const maxStringLengthsD = { str: Number.POSITIVE_INFINITY, strAndDescr: 8 };
  const maxStringLengthsSD = { str: 3, strAndDescr: 6 };

  const vsmDictionary = {
    numberMatchConfig: { dictID: '00', conceptIDPrefix: '00:' }
  };


  // A function for creating a test-component with custom props.
  const make = props => shallow(
    ListItem,
    { propsData: Object.assign(
      { // Add at least the 3 required props, using default (overridable) values:
        item, maxStringLengths, dictInfo,
        vsmDictionary
      },
      props
    ) }
  );

  // A function for firing custom events that vue-test-utils can't `trigger()`.
  const fire = function(elem, type, options) {
    elem.dispatchEvent( Object.assign(new CustomEvent(type), options) );
  };


  it('initializes', () => {
    shallow(ListItem, {
      propsData: {
        /// searchStr: '',
        item,
        maxStringLengths,
        dictInfo,
        /// vsmDictionary:  {}
      }
    });
  });


  it('emits a click event, with the `index`', () => {
    var wrap = make({ index: 3 });
    fire(wrap.element, 'click', { button: 0 });  // (Or: `wrap.element.click()`).
    wrap.emitted('click')[0][0].should.equal(3);
  });

  it('emits a hover event, with the `index`', () => {
    // Note: not just mouseenter but mouseover!
    // Like that, after a user had used arrow-up/down, s/he can switch to the
    // mouse, without potentially having to leave & enter the intended ListItem,
    // if the mouse pointer would already be over it.
    var wrap = make({ index: 3 });
    fire(wrap.element, 'mousemove', { button: 0 });
    wrap.emitted('hover')[0][0].should.equal(3);
  });

  it('on mousedown: ' +
     'cancels the event so it doesn\'t steal focus from TheInput; ' +
     'and emits a hover event', () => {
    var wrap = make({ index: 3 });
    var called = 0;  // Hack, because `event.isDefaultPrevented()` does not work.
    fire(wrap.element, 'mousedown', {
      button: 0,
      preventDefault: () => { called = 1 }
    });
    called.should.equal(1);  // Cancels the event.
    wrap.emitted('hover')[0][0].should.equal(3);  // Emits 'hover' event.
  });


  it('shows `str`, `descr`, `dictID`, and dict-title ' +
     'for a normal item', () => {
    var html = make({}).html();
    html.should.contain(item.str);
    html.should.contain(item.descr);
    html.should.contain(item.dictID);
    html.should.contain(item.id + ' in ' + dictInfo.name);
  });

  it('shows `str`, `descr`, short-form concept-ID, and dict-title ' +
     'for number-type items', () => {
    var html = make({ item: itemN, dictInfo: dictInfoN }).html();
    html.should.contain(itemN.str);
    html.should.contain(itemN.descr);
    html.should.contain('(' + itemN_shortID + ')');
    html.should.contain(itemN.id + ' in ' + dictInfoN.name);

    html = make({ item: itemN2, dictInfo: dictInfoN }).html();
    html.should.contain(itemN2.str);
    html.should.contain(itemN2.descr);
    html.should.contain('(' + itemN2_shortID + ')');
    html.should.contain(itemN2.id + ' in ' + dictInfoN.name);
  });

  it('shows `str` and `descr` for a refTerm-type item', () => {
    var html = make({ item: itemR }).html();
    html.should.contain(itemR.str);
    html.should.contain(itemR.descr);
    html.should.not.contain(': ');
  });

  it('adds parenthesis to the `descr` and `info` parts ' +
     'of a normal item', () => {
    var html = make({}).html();
    html.should.contain('(' + item.descr + ')');
    html.should.contain('(' + item.dictID + ')');
  });

  it('adds square brackets instead, to the `descr` part ' +
     'of N- or R-type items', () => {
    var html = make({ item: itemN, dictInfo: dictInfoN }).html();
    html.should.contain('[' + itemN.descr + ']');

    html = make({ item: itemN2, dictInfo: dictInfoN }).html();
    html.should.contain('[' + itemN2.descr + ']');

    html = make({ item: itemR }).html();
    html.should.contain('[' + itemR.descr + ']');
  });

  it('does not error if no `dictInfo` is given', () => {
    var html = make({ dictInfo: undefined }).html();
    html.should.not.contain('undefined');  //.. and does not show `undefined`,
    html.should.not.contain('()');  //.. and no visible, empty item-part-info.
  });


  it('applies a custom render function ' +      // This is just a shallow test.
     '`f_aci()`, which gets all needed data passed as its arguments', () => {
    var searchStr = 'SRCH';
    var html = make({ searchStr, maxStringLengths, dictInfo: dictInfoF }).html();
    html.should.contain('--' + item.str + '--**');   // New `strs.str`.
    html.should.contain('strTitle__');               // New `strs.strTitle`.
    html.should.contain('abcde,x12,' + item.descr);  // New `strs.descr`.
    html.should.contain('descrTitle__');             // New `strs.descrTitle`.
    html.should.contain('info__');                   // New `strs.info`.
    html.should.contain('<span a="b">extra__</span>'); // New `strs.extra`.

    // Tests that all f_aci-arguments are passed correctly.
    var strs = {
      str:      item.str,
      strTitle: '',
      descr:      item.descr,
      descrTitle: '',
      info:      item.dictID,
      infoTitle: item.id + ' in ' + dictInfo.name,
      extra: ''
    };
    html.should.contain('__' +
      [ item.id, searchStr, maxStringLengths.str, maxStringLengths.strAndDescr,
        dictInfoF.id, dictInfoF.name, vsmDictionary.numberMatchConfig.dictID,
        vsmDictionary.numberMatchConfig.conceptIDPrefix,
        strs.str, strs.strTitle, strs.descr, strs.descrTitle,
        strs.info, strs.infoTitle, strs.extra ].join('__') + '__'
    );
  });

  it('drops empty \'title\' attributes', () => {
    var html = make({
      maxStringLengths: maxStringLengthsSD,
      dictInfo: Object.assign({}, dictInfo, {
        f_aci: (item, strs) => Object.assign(strs, {
          strTitle: '',
          descrTitle: '',
          infoTitle: ''
        })
      }),
    }).html();
    html.should.not.contain('title="');
  });

  it('drops empty \'<span>\' tags', () => {
    var html = make({
      maxStringLengths: maxStringLengthsSD,
      dictInfo: Object.assign({}, dictInfo, {
        f_aci: (item, strs) => Object.assign(strs, {
          descr: '',
          info: ''
        })
      }),
    }).html();
    html.should.not.contain('item-part-descr');
    html.should.not.contain('item-part-info');
  });


  it('limits `str`   length, and shows it fully in a \'title\' attribute', () => {
    var html = make({ maxStringLengths: maxStringLengthsS }).html();
    html.should.contain(item.str.substr(0, 2) + '…');
    html.should.contain('title="' + item.str + '"');
    html.should.contain(item.descr);  // ..and leaves `descr` unchanged.
  });

  it('limits `descr` length, and shows it fully in a \'title\' attribute', () => {
    var html = make({ maxStringLengths: maxStringLengthsD }).html();
    html.should.contain(item.str);
    html.should.contain(item.descr.substr(0, 2) + '…');
    html.should.contain('title="' + item.descr + '"');
  });

  it('limits `str` + `descr` lengths together, ' +
     'and shows them fully in \'title\' attributes', () => {
    var html = make({ maxStringLengths: maxStringLengthsSD }).html();
    html.should.contain(item.str.substr(0, 2) + '…');
    html.should.contain(item.descr.substr(0, 2) + '…');
    html.should.contain('title="' + item.str + '"');
    html.should.contain('title="' + item.descr + '"');
  });

});
