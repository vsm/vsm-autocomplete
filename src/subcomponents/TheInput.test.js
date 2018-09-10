import TheInput from './TheInput.vue';
// Some extra, global variables are defined in 'test-setup.js'.


describe('sub/TheInput', () => {

  // A function for creating a test-component with custom props.
  const make = props => shallowMount(TheInput, { propsData: props });


  it('initializes when given no props', () => {
    var wrap = shallowMount(TheInput, {
      propsData: {
        /// placeholder: false,
        /// autofocus: false,
        /// showError: false,
        /// value: ''
      }
    });
    expect(wrap.attributes().placeholder).to.equal(undefined);
    expect(wrap.attributes().autofocus  ).to.equal(undefined);
    wrap.classes().should.not.contain('error');
    wrap.attributes().spellcheck.should.equal('false');
    wrap.element.value.should.equal('');
  });


  it('shows a given placeholder', () => {
    var wrap = make({ placeholder: 'plc' });
    wrap.attributes().placeholder.should.equal('plc');
  });

  it('hides a placeholder when the TheInput gets focused, and ' +
     'and puts it back on blur', () => {
    var wrap = make({ placeholder: 'plc' });
    wrap.attributes().placeholder.should.equal('plc');
    wrap.trigger('focus');
    expect(wrap.attributes().placeholder).to.equal(undefined);
    wrap.trigger('blur');
    wrap.attributes().placeholder.should.equal('plc');
  });

  it('hides a placeholder when the TheInput gets clicked', () => {
    var wrap = make({ placeholder: 'plc' });
    wrap.attributes().placeholder.should.equal('plc');
    ///wrap.element.click();  // =Bit shorter version of the line below.
    wrap.trigger('click', { button: 0 });
    expect(wrap.attributes().placeholder).to.equal(undefined);
  });


  it('changes the placeholder along with its prop', () => {
    var wrap = make({ placeholder: 'plc' });
    wrap.attributes().placeholder.should.equal('plc');
    wrap.setProps({ placeholder: 'plc2' });
    wrap.attributes().placeholder.should.equal('plc2');
  });


  it('changes the placeholder, also if its prop is changed while TheInput is ' +
     'focused', () => {
    var wrap = make({ placeholder: 'plc' });
    wrap.attributes().placeholder.should.equal('plc');

    wrap.trigger('focus');
    expect(wrap.attributes().placeholder).to.equal(undefined);

    wrap.setProps({ placeholder: 'plc2' });
    expect(wrap.attributes().placeholder).to.equal(undefined);

    wrap.trigger('blur');
    wrap.attributes().placeholder.should.equal('plc2');
  });


  it('can autofocus', () => {
    var wrap = make({ autofocus: true });
    wrap.attributes().autofocus.should.not.equal(undefined);
    //// (Note: this doesn't work, can't be tested) :
    //setTimeout(() => {     D(wrap.emitted('focus'));
    //  Vue.nextTick(() => { D(wrap.emitted('focus')); cb() });  }, 100);
  });


  it('can add an error-indicating CSS class', () => {
    var wrap = make({ showError: true });
    wrap.classes().should.contain('error');
  });


  it('shows a given initial input-value', () => {
    var wrap = make({ value: 'abc' });
    wrap.element.value.should.equal('abc');
  });

  it('puts the cursor at the end of the input, on a focus event', cb => {
    var wrap = make({ value: 'abc' });
    wrap.element.selectionStart = 0;  // } Put cursor at start of <input>.
    wrap.element.selectionEnd = 0;    // }
    wrap.trigger('focus');
    setTimeout(() => {  // (Short timeout is required for browsers to respond).
      wrap.element.selectionStart.should.equal(3);  // `3 == 'abc'.length`.
      wrap.element.selectionEnd  .should.equal(3);
      cb();
    }, 1);
  });

  it('changes its model `str` when receiving an input event (from <input>), ' +
     'and emits an input event itself', () => {
    var wrap = make({});
    wrap.element.value = 'a';  // } Set the <input>'s content, ..
    wrap.trigger('input');     // } ..and notify TheInput.
    wrap.vm.str.should.equal('a');
    wrap.emitted('input')[0][0].should.equal('a'); // (=first emit's first arg).
  });


  it('emits focus and blur events', () => {
    var wrap = make({});
    wrap.trigger('focus');
    wrap.emitted('focus').should.not.equal(undefined);
    wrap.trigger('blur' );
    wrap.emitted('blur' ).should.not.equal(undefined);
  });

  it('emits a doubleclick event', () => {
    var wrap = make({});
    // Since 'vue-test-utils' can't dblclick, we must make the Event manually:
    wrap.element.dispatchEvent(new MouseEvent('dblclick'));
    wrap.emitted('dblclick').should.not.equal(undefined);
  });

  it('emits events for keys: up, down, esc, enter, bksp, tab, ' +
     'shift+tab, ctrl+enter', () => {
    var wrap = make({});

    wrap.trigger('keydown.up');
    wrap.trigger('keydown.down');
    wrap.trigger('keydown.esc');
    wrap.trigger('keydown.enter');
    wrap.trigger('keydown', { keyCode: 8 });
    wrap.trigger('keydown.tab');
    wrap.trigger('keydown.tab',   { shiftKey: true });
    wrap.trigger('keydown.enter', { ctrlKey: true });

    // See https://vue-test-utils.vuejs.org/api/wrapper/#emittedbyorder
    wrap.emittedByOrder().map(e => !e.args.length ? e.name : [e.name, e.args[0]])
      .should.deep.equal([
        'key-up',
        'key-down',
        'key-esc',
        'key-enter',
        'key-bksp',
        ['key-tab', ''],
        ['key-tab', 'shift'],
        'key-ctrl-enter'
      ]);

    /*// Note: without `emittedByOrder()`, we'd have to take this into account:
      wrap.trigger('keydown.tab');
      wrap.emitted('key-tab')[0][0].should.equal('');

      wrap.trigger('keydown.tab', { shiftKey: true });
      wrap.emitted('key-tab')[1][0].should.equal('shift');  // 2nd emit!
    */
  });


  it('responds to *left* clicks, *without modifier keys* only', () => {
    var wrap = make({});
    // Let's test all combinations just for fun.
    wrap.trigger('click', { button: 0, shiftKey: true });
    wrap.trigger('click', { button: 0, ctrlKey: true });
    wrap.trigger('click', { button: 0, altKey: true });
    wrap.trigger('click', { button: 0, shiftKey: true, ctrlKey: true });
    wrap.trigger('click', { button: 0, shiftKey: true, altKey: true });
    wrap.trigger('click', { button: 0, ctrlKey: true, altKey: true });
    wrap.trigger('click', { button: 0, shiftKey:true, ctrlKey:true, altKey:true});
    wrap.trigger('click', { button: 2 });
    wrap.trigger('click', { button: 2, shiftKey: true });
    wrap.trigger('click', { button: 2, ctrlKey: true });
    wrap.trigger('click', { button: 2, altKey: true });
    wrap.trigger('click', { button: 2, shiftKey: true, ctrlKey: true });
    wrap.trigger('click', { button: 2, shiftKey: true, altKey: true });
    wrap.trigger('click', { button: 2, ctrlKey: true, altKey: true });
    wrap.trigger('click', { button: 2, shiftKey:true, ctrlKey:true, altKey:true});
    wrap.emittedByOrder().should.deep.equal([]);
    wrap.trigger('click', { button: 0 });
    wrap.emittedByOrder().should.deep.equal([ { name: 'click', args: [] } ]);
  });


  it('calls `preventDefault()` on Esc-press (this makes it not lose ' +
     'focus in some browsers)', () => {
    var wrap = make({});
    var called = 0;
    wrap.trigger('keydown.esc', { preventDefault: () => called = 1 });
    called.should.equal(1); // Can only test this, not that browser doesn't blur.
  });

  it('does not call `preventDefault()` on Tab or Shift+Tab (this allows ' +
     'the parent component do decide whether to call it or not)', () => {
    var wrap = make({});
    var c = 0;
    wrap.trigger('keydown.tab', { preventDefault: () => c = 1 });
    wrap.trigger('keydown.tab', { preventDefault: () => c = 1, shiftKey: true });
    c.should.equal(0);
    wrap.trigger('keydown.esc', { preventDefault: () => c = 1 });
    c.should.equal(1);  // Just to test that this test-code works.
  });
});
