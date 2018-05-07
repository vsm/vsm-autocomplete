import { shallow } from '@vue/test-utils';
import TheInput from './TheInput.vue';


describe('sub/TheInput', () => {

  // A function for creating a test-component with custom props.
  const make = props => shallow(TheInput, { propsData: props });

  // A function for firing custom events that vue-test-utils can't `trigger()`.
  const fire = function(elem, type, options) {
    elem.dispatchEvent( Object.assign(new CustomEvent(type), options) );
  };


  it('initializes', () => {
    var wrap = shallow(TheInput, {
      propsData: {
        /// placeholder: false,
        /// autofocus: false,
        /// showError: false,
        /// value: ''
      }
    });
    wrap.html().should.not.contain('placeholder="');
    wrap.html().should.not.contain('autofocus');
    wrap.html().should.not.contain('error');
    wrap.vm.str.should.equal('');
  });


  it('shows a given placeholder', () => {
    var wrap = make({ placeholder: 'plc' });
    wrap.html().should.contain('placeholder="plc"');
  });

  it('hides a placeholder when the TheInput gets focused, and ' +
      'and puts it back on blur', () => {
    var wrap = make({ placeholder: 'plc' });
    wrap.html().should.contain('placeholder="plc"');
    wrap.trigger('focus');
    wrap.html().should.not.contain('placeholder="plc"');
    wrap.trigger('blur');
    wrap.html().should.contain('placeholder="plc"');
  });

  it('hides a placeholder when the TheInput gets clicked', () => {
    var wrap = make({ placeholder: 'plc'});
    wrap.html().should.contain('placeholder="plc"');
    //// wrap.trigger('click');  // <-- (For some reason, this doesn't work...)
    wrap.element.click();       // <-- (.. but this does).
    wrap.html().should.not.contain('placeholder="plc"');
  });


  it('can autofocus', () => {
    var wrap = make({ autofocus: true });
    wrap.html().should.contain('autofocus');
  });


  it('can add an error-indicating CSS class', () => {
    var wrap = make({ showError: true });
    wrap.html().should.contain('error');
  });


  it('shows a given initial input-value', () => {
    var wrap = make({ value: 'abc' });
    wrap.element.value.should.equal('abc');
  });

  it('puts the cursor at the end of the input, on focus', cb => {
    var wrap = make({ value: 'abc' });
    wrap.element.selectionStart = 0;
    wrap.element.selectionEnd = 0;
    wrap.trigger('focus');
    setTimeout(() => {  // (Short timeout is required for browsers to respond).
      wrap.element.selectionStart.should.equal(3);  // `3 == 'abc'.length`.
      wrap.element.selectionEnd.should.equal(3);
      cb();
    }, 1);
  });

  it('changes its model `str` on an input event, ' +
     'and emits an input event itself', () => {
    var wrap = make({});
    wrap.element.value = 'a';  // } Set the <input>'s content, ..
    wrap.trigger('input');     // } ..and notify TheInput.
    wrap.vm.str.should.equal('a');
    wrap.emitted('input')[0][0].should.equal('a'); // (=1st emit's 1st arg).
  });


  it('emits focus and blur events', () => {
    var wrap = make({});
    wrap.trigger('focus');
    (!!wrap.emitted('focus')).should.equal(true);
    wrap.trigger('blur');
    (!!wrap.emitted('blur')).should.equal(true);
  });

  it('emits a doubleclick event', () => {
    var wrap = make({});
    var event = document.createEvent('MouseEvents');  // } This is how to..
    event.initEvent('dblclick', true, true);          // } ..generate dblclick-..
    wrap.element.dispatchEvent(event);                // } ..event with JS.
    (!!wrap.emitted('dblclick')).should.equal(true);
  });

  it('emits events for keys: up, down, esc, enter, bksp, tab, ' +
      'shift+tab, ctrl+enter', () => {
    var wrap = make({});

    wrap.trigger('keydown.up');
    wrap.trigger('keydown.down');
    wrap.trigger('keydown.esc');
    wrap.trigger('keydown.enter');
    fire(wrap.element, 'keydown', { keyCode: 8 });
    wrap.trigger('keydown.tab');
    fire(wrap.element, 'keydown', { shiftKey: true, keyCode: 9 });
    fire(wrap.element, 'keydown', { ctrlKey: true, keyCode: 13 });

    // See https://vue-test-utils.vuejs.org/en/api/wrapper/emittedByOrder.html
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

    /* Note: without `emittedByOrder()`, we'd have to take this into account:
      wrap.trigger('keydown.tab');
      wrap.emitted('key-tab')[0][0].should.equal('');

      fire(wrap.element, 'keydown', { shiftKey: true, keyCode: 9 });
      wrap.emitted('key-tab')[1][0].should.equal('shift'); // 2nd emit for tab!
    */
  });

});
