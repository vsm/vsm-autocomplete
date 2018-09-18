import ListItemLiteral from './ListItemLiteral.vue';
// Some extra, global variables are defined in 'test-setup.js'.


describe('sub/ListItemLiteral', () => {

  const maxStringLengths = {str: Number.MAX_VALUE, strAndDescr: Number.MAX_VALUE};
  const maxStringLengthsS = { str: 3, strAndDescr: Number.MAX_VALUE };


  const make = props => shallowMount(ListItemLiteral, {
    propsData: Object.assign(
      { maxStringLengths, itemLiteralContent: false },
      props
    )
  });


  /**
   * Function that generates custom content, based on the current search-string.
   */
  const itemLiteralContent = searchStr => `--${searchStr}--`;


  it('initializes, when getting only the required props', () => {
    shallowMount(ListItemLiteral, {
      propsData: {
        /// searchStr: '',
        /// index: 0,
        maxStringLengths,
        /// itemLiteralContent: false
      }
    });
  });


  // The following six tests are like the three tests in 'ListItem.test.js'.

  it('emits a (left-button) click event, with ListItemLiteral\'s ' +
     '`index`', () => {
    var wrap = make({ index: 3 });
    wrap.trigger('click', { button: 0 });
    wrap.emitted('click')[0][0].should.equal(3);  // Emits its index: '3'.
    wrap.trigger('click', { button: 2 });
    wrap.emitted('click').length.should.not.equal(2); // Did not emit 2nd event.
  });

  it('emits a (left-button) click event, with ListItemLiteral\'s ' +
     '`index`, also when a `itemLiteralContent` is given', () => {
    var wrap = make({ index: 3, itemLiteralContent });
    wrap.trigger('click', { button: 0 });
    wrap.emitted('click')[0][0].should.equal(3);
    wrap.trigger('click', { button: 2 });
    wrap.emitted('click').length.should.not.equal(2);
  });

  it('emits a hover event, with the `index`', () => {
    var wrap = make({ index: 3 });
    wrap.trigger('mousemove');
    wrap.emitted('hover')[0][0].should.equal(3);
  });

  it('emits a hover event, with the `index`, ' +
     'also when a `itemLiteralContent` is given', () => {
    var wrap = make({ index: 3, itemLiteralContent });
    wrap.trigger('mousemove');
    wrap.emitted('hover')[0][0].should.equal(3);
  });

  it('on mousedown: ' +
     'cancels the event (so it doesn\'t steal focus from TheInput), ' +
     'and emits a hover event', () => {
    var wrap = make({ index: 3 });
    var called = 0;
    wrap.trigger('mousedown', {
      button: 0,
      preventDefault: () => { called = 1 }
    });
    called.should.equal(1);
    wrap.emitted('hover')[0][0].should.equal(3);
  });

  it('on mousedown: cancels it and emits a hover-event, ' +
     'also when a `itemLiteralContent` is given', () => {
    var wrap = make({ index: 3, itemLiteralContent });
    var called = 0;
    wrap.trigger('mousedown', {
      button: 0,
      preventDefault: () => { called = 1 }
    });
    called.should.equal(1);
    wrap.emitted('hover')[0][0].should.equal(3);
  });


  it('shows the `searchStr`', () => {
    make({ searchStr: 'xyz' })
      .text().startsWith('xyz') .should.equal(true);
  });

  it('shows custom content when a `itemLiteralContent` is given', () => {
    make({ searchStr: 'xyz', itemLiteralContent })
      .text().startsWith('--xyz--') .should.equal(true);
  });


  it('limits `searchStr` length, ' +
     'and shows it fully in a \'title\' attribute', () => {
    var wrap = make({
      searchStr: 'abcde',
      maxStringLengths: maxStringLengthsS
    });
    wrap.text().startsWith('ab…') .should.equal(true);
    wrap.attributes().title.should.contain('\'abcde\'');
  });

  it('limits `searchStr` length, ' +
     'also when a custom `itemLiteralContent` is given', () => {
    var wrap = make({
      searchStr: 'abcde',
      maxStringLengths: maxStringLengthsS,
      itemLiteralContent
    });
    wrap.text().startsWith('--ab…--') .should.equal(true);
  });

  it('accepts HTML-code from the custom `itemLiteralContent` function, ' +
     'but secures against `<script>`, `<iframe>`, etc. tags', () => {
    var html = make({
      searchStr: 'abc',
      itemLiteralContent: searchStr =>
        `--${searchStr}<script>< script="a"><iframe>< style><textarea\n>--`
    }).html();
    html.should.contain('--abc&lt;script');
    html.should.contain('&lt; script');
    html.should.contain('&lt;iframe');
    html.should.contain('&lt; style');
    html.should.contain('&lt;textarea');
  });
});
