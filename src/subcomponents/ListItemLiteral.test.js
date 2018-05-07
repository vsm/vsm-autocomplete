import { shallow } from '@vue/test-utils';
import ListItemLiteral from './ListItemLiteral.vue';


describe('sub/ListItemLiteral', () => {

  const maxStringLengths =
    { str: Number.POSITIVE_INFINITY, strAndDescr: Number.POSITIVE_INFINITY };
  const maxStringLengthsS = { str: 3, strAndDescr: Number.POSITIVE_INFINITY };


  const make = props => shallow(
    ListItemLiteral,
    { propsData: Object.assign(
      { maxStringLengths, itemLiteralContent: false },
      props
    ) }
  );

  const fire = function(elem, type, options) {
    elem.dispatchEvent( Object.assign(new CustomEvent(type), options) );
  };

  const itemLiteralContent = searchStr => `--${searchStr}--`;


  it('initializes', () => {
    shallow(ListItemLiteral, {
      propsData: {
        /// searchStr: '',
        /// index: 0,
        maxStringLengths,
        itemLiteralContent: false
      }
    });
  });


  // The following six tests are like the three tests in 'ListItem.test.js'.

  it('emits a click event, with the `index`', () => {
    var wrap = make({ index: 3 });
    fire(wrap.element, 'click', { button: 0 });
    wrap.emitted('click')[0][0].should.equal(3);
  });

  it('emits a click event, with the `index`, ' +
     'also when a `itemLiteralContent` is given', () => {
    var wrap = make({ index: 3, itemLiteralContent });
    fire(wrap.element, 'click', { button: 0 });
    wrap.emitted('click')[0][0].should.equal(3);
  });

  it('emits a hover event, with the `index`', () => {
    var wrap = make({ index: 3 });
    fire(wrap.element, 'mousemove', { button: 0 });
    wrap.emitted('hover')[0][0].should.equal(3);
  });

  it('emits a hover event, with the `index`, ' +
     'also when a `itemLiteralContent` is given', () => {
    var wrap = make({ index: 3, itemLiteralContent });
    fire(wrap.element, 'mousemove', { button: 0 });
    wrap.emitted('hover')[0][0].should.equal(3);
  });

  it('on mousedown: ' +
     'cancels the event so it doesn\'t steal focus from TheInput; ' +
     'and emits a hover event', () => {
    var wrap = make({ index: 3 });
    var called = 0;
    fire(wrap.element, 'mousedown', {
      button: 0,
      preventDefault: () => { called = 1 }
    });
    called.should.equal(1);
    wrap.emitted('hover')[0][0].should.equal(3);
  });

  it('on mousedown: same as above, ' +
     'also when a `itemLiteralContent` is given', () => {
    var wrap = make({ index: 3, itemLiteralContent });
    var called = 0;
    fire(wrap.element, 'mousedown', {
      button: 0,
      preventDefault: () => { called = 1 }
    });
    called.should.equal(1);
    wrap.emitted('hover')[0][0].should.equal(3);
  });


  it('shows the `searchStr`', () => {
    var html = make({ searchStr: 'xyz' }).html();
    html.should.contain('xyz');
  });

  it('shows custom content when a `itemLiteralContent` is given', () => {
    var html = make({ searchStr: 'xyz', itemLiteralContent }).html();
    html.should.contain('--xyz--');
  });


  it('limits `searchStr` length, ' +
     'and shows it fully in a \'title\' attribute', () => {
    var wrap = make({
      searchStr: 'abcde',
      maxStringLengths: maxStringLengthsS
    });
    wrap.html().should.contain('ab…');
    wrap.html().should.contain('\'abcde\'');
  });

  it('shows custom content, based on limited `searchStr` length, ' +
     'also when a `itemLiteralContent` is given', () => {
    var wrap = make({
      searchStr: 'abcde',
      maxStringLengths: maxStringLengthsS,
      itemLiteralContent
    });
    wrap.html().should.contain('--ab…--');
  });

});
