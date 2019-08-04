import TheInput from './TheInput.vue';
// Some extra, global variables are defined in 'test-setup.js'.


describe('sub/TheInput', () => {
  var w;

  // A function for creating a test-component with custom props.
  const make = props => w = shallowMount(TheInput, { propsData: props });

  const _input  = () => w.find('.input');
  const _inputA = () => _input().attributes();
  const _label  = () => w.find('.label');
  const _labelV = () => _label().text();


  it('initializes when given no props', () => {
    var wrap = shallowMount(TheInput, {
      propsData: {
        /// placeholder: false,
        /// autofocus: false,
        /// showError: false,
        /// value: ''
      }
    });
    var input = wrap.find('.input');
    var label = wrap.find('.label');
    input.exists();
    label.exists();
    expect(input.attributes().placeholder).to.equal(undefined);
    expect(input.attributes().autofocus  ).to.equal(undefined);
    input.attributes().spellcheck.should.equal('false');
    input.classes().should.not.contain('error');
    input.element.value.should.equal('');
  });


  it('shows a given placeholder, in a \'label\' element', () => {
    make({ placeholder: 'plc' });
    _labelV().should.equal('plc');
  });

  it('gives the label a \'focus\' class on focus; removes it on blur', () => {
    make({ placeholder: 'plc' });
    _label().classes().should.not.contain('focus');
    _input().trigger('focus');
    _label().classes().should    .contain('focus');
    _input().trigger('blur');
    _label().classes().should.not.contain('focus');
  });

  it('gives the label a \'hidden\' class, only if an initialValue or ' +
     'no placeholder is given', () => {
    make({ placeholder: 'plc' });
    _label().classes().should.not.contain('hidden');
    make({ initialValue: 'abc' });
    _label().classes().should.contain('hidden');
    make({ placeholder: '' });
    _label().classes().should.contain('hidden');
    make({ placeholder: false });
    _label().classes().should.contain('hidden');
  });

  it('gives the label a \'hidden\' class, if the input is not empty, ' +
     'but not if it is empty', () => {
    make({ placeholder: 'plc' });
    _input().element.value = 'a';  _input().trigger('input');
    _label().classes().should.contain('hidden');
    _input().element.value = '';   _input().trigger('input');
    _label().classes().should.not.contain('hidden');
  });

  it('changes the placeholder label along with its prop', () => {
    make({ placeholder: 'plc' });
    _labelV().should.equal('plc');
    w.setProps({ placeholder: 'plc2' });
    _labelV().should.equal('plc2');
  });


  it('can autofocus', () => {
    make({ autofocus: true });
    _inputA().autofocus.should.not.equal(undefined);
    //// (Note: this doesn't work, can't be tested) :
    //setTimeout(() => {     D(w.emitted('focus'));
    //  Vue.nextTick(() => { D(w.emitted('focus')); cb() });  }, 100);
  });


  it('can add an error-indicating CSS class', () => {
    make({ showError: true });
    _input().classes().should.contain('error');
  });


  it('shows a given initial input-value', () => {
    make({ value: 'abc' });
    _input().element.value.should.equal('abc');
  });

  it('puts the cursor at the end of the input, on a focus event', cb => {
    make({ value: 'abc' });
    _input().element.selectionStart = 0;  // } Put cursor at start of <input>.
    _input().element.selectionEnd = 0;    // }
    _input().trigger('focus');
    setTimeout(() => {  // (Short timeout is required for browsers to respond).
      _input().element.selectionStart.should.equal(3);  // `3 == 'abc'.length`.
      _input().element.selectionEnd  .should.equal(3);
      cb();
    }, 1);
  });

  it('changes its model `str` when receiving an input event (from <input>), ' +
     'and emits an input event itself', () => {
    make({});
    _input().element.value = 'a';  // } Set the <input>'s content, ..
    _input().trigger('input');     // } ..and notify TheInput.
    w.vm.str.should.equal('a');
    Vue.nextTick(() => {
      w.emitted('input')[0][0].should.equal('a'); // (=first emit's first arg).
    });
  });


  it('emits focus and blur events', () => {
    make({});
    _input().trigger('focus');
    w.emitted('focus').should.not.equal(undefined);
    _input().trigger('blur' );
    w.emitted('blur' ).should.not.equal(undefined);
  });

  it('emits a doubleclick event', () => {
    make({});
    // Since 'vue-test-utils' can't dblclick, we must make the Event manually:
    _input().element.dispatchEvent(new MouseEvent('dblclick'));
    w.emitted('dblclick').should.not.equal(undefined);
  });


  it('emits events for keys: up, down, esc, enter, bksp, tab, ' +
     'shift+tab, ctrl+enter, shift+enter', () => {
    make({});

    _input().trigger('keydown.up');
    _input().trigger('keydown.down');
    _input().trigger('keydown.esc');
    _input().trigger('keydown.enter');
    _input().trigger('keydown.backspace');
    _input().trigger('keydown.tab');
    _input().trigger('keydown.tab',   { shiftKey: true });
    _input().trigger('keydown.enter', { ctrlKey: true });
    _input().trigger('keydown.enter', { shiftKey: true });

    w.emittedByOrder().map(
      e => e.name == 'key-tab' ? [e.name, e.args[0]] : e.name
    ).should.deep.equal([
      'key-up',
      'key-down',
      'key-esc',
      'key-enter',
      'key-bksp',
      ['key-tab', ''],
      ['key-tab', 'shift'],
      'key-ctrl-enter',
      'key-shift-enter'
    ]);

    // Shallow-test that key-bksp/tab emit an `event` Object too.
    w.emitted('key-bksp')[0].length.should.equal(1);  // 1: one argument,
    w.emitted('key-tab' )[0].length.should.equal(2);  // [0]: 1st emit.
    w.emitted('key-tab' )[1].length.should.equal(2);  // [1]: 2nd emit.
  });


  it('responds to *left* clicks, *without modifier keys* only', () => {
    make({});
    // Let's test all combinations just for fun.
    _input().trigger('click', { button: 0, shiftKey: true });
    _input().trigger('click', { button: 0, ctrlKey: true });
    _input().trigger('click', { button: 0, altKey: true });
    _input().trigger('click', { button: 0, shiftKey: true, ctrlKey: true });
    _input().trigger('click', { button: 0, shiftKey: true, altKey: true });
    _input().trigger('click', { button: 0, ctrlKey: true, altKey: true });
    _input().trigger('click', { button: 0, shiftKey:true, ctrlKey:true, altKey:true});
    _input().trigger('click', { button: 2 });
    _input().trigger('click', { button: 2, shiftKey: true });
    _input().trigger('click', { button: 2, ctrlKey: true });
    _input().trigger('click', { button: 2, altKey: true });
    _input().trigger('click', { button: 2, shiftKey: true, ctrlKey: true });
    _input().trigger('click', { button: 2, shiftKey: true, altKey: true });
    _input().trigger('click', { button: 2, ctrlKey: true, altKey: true });
    _input().trigger('click', { button: 2, shiftKey:true, ctrlKey:true, altKey:true});
    w.emittedByOrder().should.deep.equal([]);
    _input().trigger('click', { button: 0 });
    w.emittedByOrder().should.deep.equal([ { name: 'click', args: [] } ]);
  });


  it('calls `preventDefault()` on Esc-press (this makes it not lose ' +
     'focus in some browsers)', () => {
    make({});
    var called = 0;
    _input().trigger('keydown.esc', { preventDefault: () => called = 1 });
    called.should.equal(1); // Can only test this, not that browser doesn't blur.
  });

  it('does not call `preventDefault()` on Tab or Shift+Tab (this allows ' +
     'the parent component do decide whether to call it or not)', () => {
    make({});
    var c = 0;
    _input().trigger('keydown.tab', { preventDefault: () => c = 1 });
    _input().trigger('keydown.tab', { preventDefault: () => c = 1, shiftKey: true });
    c.should.equal(0);
    _input().trigger('keydown.esc', { preventDefault: () => c = 1 });
    c.should.equal(1);  // Just to test that this test-code works.
  });
});
