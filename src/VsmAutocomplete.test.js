

// ----- Most of this file is still TO DO ----------


import { shallow, mount } from '@vue/test-utils';
import VsmAutocomplete from './VsmAutocomplete.vue';
import VsmDictionaryLocal from 'vsm-dictionary-local';


describe('VsmAutocomplete', () => {

  var dict = new VsmDictionaryLocal({
    dictData: [
      {id: 'DictID_12',  name: 'Example subdictionary', entries: [
        {id: 'URI:001', terms: ['aaa', 'synonym']},
        {id: 'URI:002', terms: 'aab'},
        {id: 'URI:003', terms: 'abc', descr: 'description'}
      ]},
    ],
  });

  dict.getMatchesForString = function(s, opt, cb) {
    /// console.log('CALLED getMatchesForString');
    return VsmDictionaryLocal.prototype
      .getMatchesForString.call(this, s, opt, cb);
  };

  // A function for creating a (shallow/deep) test-component with custom props.
  const make = (props, deeply = true) => (deeply ? mount : shallow) (
    VsmAutocomplete,
    {
      propsData: Object.assign(
        { vsmDictionary: dict }, // Add at least the required prop (overridable).
        props  // <--- Insert test-specific props here/
      ),
      // `vue-test-utils` can't work with <transition>s. It errors. And setting
      // `config.stubs.transition` to false or TransitionStub doesn't work...
      // So, we just stub TheSpinner.
      stubs: ['the-spinner']
    }
  );

  // A function for firing custom events that vue-test-utils can't `trigger()`.
  //const fire = function(elem, type, options) {
  //  elem.dispatchEvent( Object.assign(new CustomEvent(type), options) );
  //};


  it('initializes', () => {
    var wrap = mount(VsmAutocomplete, {  // All this is what `make()` shortens.
      propsData: {
        vsmDictionary: dict
      }
    });
    wrap.vm.inputStr.should.equal('');
    wrap.vm.showError.should.equal(false);
    wrap.vm.matches.length.should.equal(0);
    wrap.find('.input').html().should.not.contain('placeholder="');
  });

  it('shows a given initial input-value', () => {
    var wrap = make({ initialValue: 'abc' });
    wrap.find('.input').element.value.should.equal('abc');
  });

  it('shows a given placeholder', () => {
    var wrap = make({ placeholder: 'plc' });
    wrap.find('.input').html().should.contain('placeholder="plc"');
  });

  it('hides the placeholder when the TheInput gets focused', () => {
    var wrap = make({ placeholder: 'plc' });
    var input = wrap.find('.input');
    input.html().should.contain('placeholder="plc"');
    input.element.focus();
    ///input.trigger('focus');  //// Why does this not work?
    ///fire(input.element, 'focus');  //// Why does this not work either?
    input.html().should.not.contain('placeholder="plc"');
    ///console.dir(wrap.vm.isListOpen);
    input.element.blur();
    input.html().should.contain('placeholder="plc"');
  });

  it('hides the placeholder when the TheInput gets clicked', cb => {
    var wrap = make({ placeholder: 'plc'});
    var input = wrap.find('.input');
    ///npm i -D chai-spies
    ///var spy = chai.spy.on(wrapper.vm, 'openList');

    input.html().should.contain('placeholder="plc"');

    input.trigger('click');
    //input.html().should.not.contain('placeholder="plc"');

    ////input.trigger('keydown.65');  // Doesn't work!....
    ////input.element.value = 'a';  // Has no effect on Vue state...
    wrap.setData({ inputStr: 'a' });
    //--console.dir(wrap.find('.input').element.value);
    //--console.dir(wrap.find('.input').vm);

    Vue.nextTick(() => {
      Vue.nextTick(() => {
        Vue.nextTick(() => {
          Vue.nextTick(() => {
            //--console.dir(wrap.vm.matches);
            //--console.dir(wrap.vm.isListOpen);
            //console.dir(input.html());
            ///input.html().should.not.contain('placeholder="plc"');
            cb();
          });
        });
      });
    });
    //dict.getMatchesForString('a', {}, (err, res) => console.log(err, res));

    // spy.should.have.been.called.exactly(1);
    // spy.should.have.been.called.with(true);
  });

});
