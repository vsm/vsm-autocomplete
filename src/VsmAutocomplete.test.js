import VsmAutocomplete from './VsmAutocomplete.vue';
import VsmDictionaryLocal from 'vsm-dictionary-local';
// Some extra, global variables are defined in 'test-setup.js'.

const Z = false; // Disable some subtests while awaiting vue-test-utils bugfixes.


describe('VsmAutocomplete', () => {

  // We first create a sizable test-setup, after which we run the actual tests.



  // --- 1/5) CREATE A TEST-VsmDictionary ---

  // DictInfo/entriy/refTerm-data, for a test-VsmDictionaryLocal.
  const di1 = { id: 'A', name: 'Name 1' };
  const di2 = { id: 'B', name: 'Name 2' };
  const di3 = { id: 'C', name: 'Name 3',
    f_aci: (item, strs) => Object.assign(strs, { str: `--${strs.str}--` }) };

  const e1 = { id: 'A:01', dictID: 'A', terms: [{ str: 'a'   }] };
  const e2 = { id: 'A:02', dictID: 'A', terms: [{ str: 'ab'  }] };
  const e3 = { id: 'B:01', dictID: 'B', terms: [{ str: 'bc'  }] };
  const e4 = { id: 'B:02', dictID: 'B', terms: [{ str: 'bcd' }, { str: 'x' }],
    descr: 'Descr' };
  const e5 = { id: 'B:03', dictID: 'B', terms: [{ str: 'bcc' }] };
  const e6 = { id: 'C:01', dictID: 'C', terms: [{ str: 'xyz' }] };

  const r1 = 'it';

  const qoFT = {idts: [{id: 'B:03'}]}; // `queryOptions` to incl e5 as fixedTerm.

  // This combines a dictInfo with entries, like VD.Local's `dictData` wants it.
  const addEntries = (di, ...entries) => Object.assign({}, di, { entries });

  function makeDictionary(options = {}) {
    return new VsmDictionaryLocal(Object.assign({}, options, {
      dictData: [
        addEntries(di1, e1, e2),
        addEntries(di2, e3, e4, e5),
        addEntries(di3, e6)
      ],
      refTerms: [r1]
    }));
  }

  /**
   * + We create one VsmDictionary for all tests, now.
   * + By using a VsmDictionaryLocal with a delay, we'll e.g. be able to know if
   *   a request was made, by seeing that TheList doesn't open until after the
   *   req./s's delay/s has/ve passed. If no immediate list-open, it made a req.
   * + Note that VsmAutocomplete may query all of: loadFixedTerms(),
   *   getMatchesForString(), and getDictInfos(). So TheList may open after
   *   three times the `delay`, if the component needed to make all 3 queries.
   * + Note: in some examples we will us `e5` a 'fixedTerm'. We do not need to
   *   call `dict.loadFixedTerms([{ id: 'B:03' }], ..)` here, because VsmAutoC..
   *   will call it, when it is constructed with `queryOptions.idts` = `qoFT`.
   */
  var dict = makeDictionary({ delay: 100 });



  // --- 2/5) FOR CREATING A TEST-VsmAutocomplete-COMPONENT ---

  /**
   * This is used by each test to create a test-component with custom props.
   * By using `mount()` (not `shallowMount`), it adds full subcomponents too.
   */
  const make = (props, listeners) => mount(
    VsmAutocomplete,
    {
      propsData: Object.assign(
        { vsmDictionary: dict }, // Add at least the required prop (overridable).
        props                    // Insert test-specific props from the arg.
      ),
      listeners: listeners || {  // Add a set of listeners, by default.
        'item-literal-select': s => s,  ///D(`called with ${s}.`),
        'item-active-change':  o => o   ///D(o)
      }
    }
  );



  // --- 3/5) UTILITY FUNCTIONALITY ---

  // `w` is an IMPORTANT variable in all the tests!
  // ALL tests will `make()` a component 'wrapper', which the `_...()` functions
  // below can access. A global `w` frees us from giving it as arg. at each call.
  var w;

  // Shorthand functions for repeatedly accessed HTML parts.
  // + NOTE: We test only the effect of settings (props) & user-actions,
  //   on the generated HTML & emitted events.
  //   It is good to avoid testing internal state variables (`.vm.*`),
  //   because these may change along with the implementation.
  const _input   = () => w.find('.input');
  const _inputV  = () => _input().element.value;
  const _inputA  = () => _input().attributes();

  const _list    = () => w.find('.list');
  const _listEx  = () => _list().exists();

  const _items   = ()    => w.findAll('.list .item');
  const _item    = index => w.findAll('.list .item').at(index);
  const _itemPS  = index => _item(index).find('.item-part-str'  );
  const _itemPD  = index => _item(index).find('.item-part-descr');
  const _itemPI  = index => _item(index).find('.item-part-info' );
  const _itemPST = index => _itemPS(index).text();
  const _itemPDT = index => _itemPD(index).text();
  const _itemL   = ()    => w.find('.list .item-type-literal');
  const _itemLT  = ()    => _itemL().text();

  const _spinner = () => w.find('.spinner');


  // Shorthand conditions.
  const _listLen = () =>  // ->Nr of TheList-items, or false if list is closed.
    !_listEx() ? false : _items().length;

  const _itemLOnly = () =>  // True if open TheList, with only ListItemLiteral.
    _listLen() == 1  &&  _itemL().exists();


  // Shorthand functions to trigger user-generated events.
  const _focus     = () => _input().trigger('focus');
  const _blur      = () => _input().trigger('blur');
  const _keyUp     = () => _input().trigger('keydown.up');
  const _keyDown   = () => _input().trigger('keydown.down');
  const _keyEsc    = () => _input().trigger('keydown.esc');
  const _keyEnter  = () => _input().trigger('keydown.enter');
  const _keyBksp   = () => _input().trigger('keydown', { keyCode: 8 });
  const _keyTab    = () => _input().trigger('keydown.tab');
  const _keySTab   = () => _input().trigger('keydown.tab', { shiftKey: true });
  const _keyCEnter = () => _input().trigger('keydown.enter', { ctrlKey: true });
  const _setInput = newValue => {  // Changes the content of TheInput.
    var input = _input();
    input.element.value = newValue;
    input.trigger('input');
  };


  // Shorthand functions to check if a certain event was emitted X times.

  // Returns true/false if `str` was emitted at least `index+1` times.
  const _emit = (index = 0, str) => {
    var emit = w.emitted(str);
    return emit !== undefined  &&  emit[index] !== undefined;
  };

  // Returns 0 if `str` emitted <`index+1` times; else `index`'th emitted value.
  const _emitV = (index = 0, str) => {
    var emit = w.emitted(str);
    return emit !== undefined && emit[index] !== undefined ? emit[index][0] : 0;
  };

  const _emitIAC  = index => _emitV(index, 'item-active-change');
  const _emitIC   = index => _emitV(index, 'input-change');
  const _emitSel  = index => _emitV(index, 'item-select');
  const _emitLSel = index => _emitV(index, 'item-literal-select');
  const _emitLO   = index => _emit (index, 'list-open');
  const _emitLC   = index => _emit (index, 'list-close');
  const _emitF    = index => _emit (index, 'focus');
  const _emitB    = index => _emit (index, 'blur');
  const _emitEsc  = index => _emit (index, 'key-esc');
  const _emitBksp = index => _emit (index, 'key-bksp');
  const _emitTab  = index => _emitV(index, 'key-tab');
  const _emitDblc = index => _emit (index, 'dblclick');


  // Shorthand test functions.

  const _onlyOneItemIsActive = () =>
    w.findAll('.list .item.item-state-active').length.should.equal(1);

  const _itemXIsActive = index =>
    _item(index).classes().should.contain('item-state-active');


  // Shorthand that makes `Vue.nextTick` just a bit more concise.
  const vueTick = cb => Vue.nextTick(cb);

  // Shorthand for inspecting emitted events, while debugging.
  const DE = () => D(w.emittedByOrder());  // eslint-disable-line no-unused-vars



  // --- 4/5) TIME TRAVEL SETUP ---

  /*
  - When we mount() a test-component, it launches one or more requests
    for data to its VsmDictionary; and we need these requests to finish
    before we let the tests assert things.  This takes some 'time'/event-loops.
  - But we can not use `Vue.nextTick()` here, because that only makes Vue's
    DOM-updates finish, not requests to external datasources.
    + So `Vue.nextTick(() => { (1).should.equal(1);  cb(); });`
      does not work. (Not even with several nested nextTick-calls).
  - It would work with `setTimeout()`. And since we use VSMDictionaryLocal,
    we know that there will be no large delay; only a few event-loop jumps).
    But this approach will slow down our tests.
    + So `setTimeout(() => { (1).should.equal(1);  cb(); }, 10);`
      should not be used.
  - Instead, we use 'sinon' to artificially move forward time.
    - See https://stackoverflow.com/questions/17446064 about 'useFakeTimers()`.
    - We initialize it in `beforeEach/afterEach()`, even though we may not need
      fakeTimers every time. But this ensures that `clock.restore()` is always
      called, even when a test fails (which would prevent it from making the
      `restore()` call by itself at the end, and that would affect next tests).
  + This also enables us to make efficient tests, based on custom VsmDictionary-
    delays, as described earlier.
  */
  var clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });



  // --- 5/5) THE TESTS ---

  describe('handles props on a VsmAutocomplete component', () => {

    it('initializes, when getting only the required props', () => {
      // For this first test, we show how `mount/shallowMount()` is really used.
      // But in all next tests, we'll use more concise code, by using `make()`.
      w = mount(VsmAutocomplete, {  // We assign it to our global `w` test-var.
        propsData: {
          vsmDictionary: dict
          /// autofocus: false,    // Default, not-required values. These will..
          /// placeholder: false,  // ..be changed in some of the other tests.
          /// initialValue: '',
          /// queryOptions: { perPage: 20 },
          /// maxStringLengths: { str: 40, strAndDescr: 70 },
          /// itemLiteralContent: false
        }
      });
      ///H(w);

      w.isVueInstance().should.equal(true);
      w.classes().should.contain('vsm-autocomplete');

      // Note: _input () === w.find('.input') ;
      //       _inputA() === w.find('.input').attributes() ;
      //       _inputV() === w.find('.input').element.value ; etc.
      expect(_inputA().placeholder).to.equal(undefined);
      expect(_inputA().autofocus  ).to.equal(undefined);
      _inputV().should.equal('');
      _input ().classes().should.not.contain('error');

      _list   ().exists().should.equal(false);
      _spinner().exists().should.equal(false);
      _items  ().exists().should.equal(false);
    });


    it('uses the `autofocus` prop', () => {
      w = make({ autofocus: false });
      expect(_inputA().autofocus).to.equal(undefined);

      w = make({ autofocus: true });
      _inputA().autofocus.should.not.equal(undefined);
    });


    /*
    // The 'autofocus' attribute does not have a UI-effect in 'vue-test-utils',
    // so we can't test its effect.
    it('when `autofocus` is set, and TheInput is empty, and ' +
       'fixedTerm-matches exist: then opens TheList immediately', () => {
      w = make({
        autofocus: true,
        queryOptions: { idts: [{ id: 'D:002' }] }
      });
      clock.tick(300);
      _listEx().should.equal(true);
      H(w);
    });
    */


    it('uses the `placeholder` prop', () => {
      w = make({ placeholder: false });
      expect(_inputA().placeholder).to.equal(undefined);

      w = make({ placeholder: 'plc' });
      _inputA().placeholder.should.equal('plc');
      _inputV().should.equal('');  // TheInput should stay empty.
    });


    it('hides the placeholder when TheInput gets focused, ' +
       'and puts it back when it gets blurred', () => {
      w = make({ placeholder: 'plc' });
      _inputA().placeholder.should.equal('plc');

      _input().trigger('focus');
      expect(_inputA().placeholder).to.equal(undefined);

      _input().trigger('blur');
      _inputA().placeholder.should.equal('plc');
    });


    it('queries a match-obj. & dependent data for an `initialValue`, ' +
       'and shows this all in a ListItem in TheList', () => {
      w = make(
        { initialValue: 'ab',    // This will match entry `e2`.
          queryOptions: qoFT },  // Let the queries consider fixedTerms too.
        {}  // This removes all listeners => it makes no item-literal.
      );

      // Focusing TheInput means that the user will soon see a query result.
      _focus();
      _spinner().exists().should.equal(true);

      clock.tick(100);
      _list   ().exists().should.equal(false);  // Now, only loaded fixedTerms.
      clock.tick(100);
      _list   ().exists().should.equal(false);  // Now, still needs dictInfos.

      // After 300 ms, it loaded fixedTerms, the match-objs, and their dictInfos.
      clock.tick(100);
      _input  ().classes().should.not.contain('error');
      _list   ().exists().should.equal(true);
      _items  ().exists().should.equal(true);
      _items  ().length  .should.equal(1);
      _item  (0).exists().should.equal(true);
      _spinner().exists().should.equal(false);

      _itemPST(0).should.equal('ab');

      var title = _itemPI(0).attributes().title;
      title.should.contain(e2.id);
      title.should.contain(di1.name);
    });


    it('does not query or open TheList, if given an `initialValue` but no ' +
       'focus event; and then only queries after focus', () => {
      w = make({ initialValue: 'ab' });

      // Part 1: TheList does not open without `_focus()`.
      clock.tick(1000);
      _listEx().should.equal(false);

      // Part 2: TheList opens after 'focus', but only after query results took
      // their time to arrive; i.e. a query still had to be made upon focus.
      _focus();
      clock.tick(150);
      _listEx().should.equal(false);
      clock.tick(50);
      _listEx().should.equal(true);
    });


    it('changes TheInput if the `initialValue` prop is changed', () => {
      w = make({ initialValue: 'ab' });
      _focus();
      clock.tick(300);

      _listEx().should.equal(true);
      _itemPST(0).should.equal('ab');

      w.setProps({ initialValue: 'b' });
      _inputV().should.equal('b');

      clock.tick(200);
      _itemPST(0).should.equal('bc');
    });


    it('does not open a closed TheList if the `initialValue` prop ' +
       'is changed', () => {
      w = make({ initialValue: 'ab' });
      clock.tick(300);
      _listEx().should.equal(false);

      w.setProps({ initialValue: 'b' });
      clock.tick(1000);
      _listEx().should.equal(false);
    });


    it('does not open an Esc-closed TheList if the `initialValue` prop ' +
       'is changed', () => {
      w = make({ initialValue: 'ab' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);

      _keyEsc();
      _listEx().should.equal(false);

      w.setProps({ initialValue: 'b' });
      clock.tick(1000);
      _listEx().should.equal(false);
    });


    it('does not open a closed TheList if the `initialValue` prop ' +
       'is changed to the same value as the current TheInput content', () => {
      w = make({ initialValue: 'ab' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);

      _setInput('b');
      clock.tick(300);
      _listEx().should.equal(true);

      _keyEsc();
      _listEx().should.equal(false);

      w.setProps({ initialValue: 'b' });
      clock.tick(1000);
      _listEx().should.equal(false);
    });


    it('adds a ListItemLiteral if a listener for it is attached', cb => {
      w = make({
        initialValue: 'ab'  // Matches `e2`.
        // - No argument 2: by letting `make()` add its default listeners,
        //   a listener is added for 'item-literal-select', and that causes
        //   VsmAutocomplete to add a ListItemLiteral to TheList.
      });
      _focus();

      clock.tick(300);
      Vue.nextTick(() => {  // For some reason, now we need nextTick() here too.
        /// H(_item(0));  H(_itemL());
        _itemPST(0).should.equal  ('ab');
        _itemLT ( ).should.contain('ab');
        cb();
      });
    });


    it('lets a `VsmDictionary`\'s dictInfo\'s `f_aci()` modify the ' +
       'content of a ListItem', cb => {
      w = make({ initialValue: 'x' });  // Matches `e4` and `e6`.
      _focus();
      clock.tick(300);

      vueTick(() => {
        _listLen() .should.equal(3);
        _itemPST(0).should.equal('x');
        _itemPST(1).should.equal('--xyz--');  // Because `e6` belongs to..
        cb();              // dictInfo`di3`, which has a custom `f_aci()`.
      });
    });


    it('resets the component when the `VsmDictionary` prop is changed', cb => {
      w = make({ initialValue: 'a' });
      _focus();
      clock.tick(300);

      vueTick(() => {
        _listEx().should.equal(true);

        var dict2 = makeDictionary({ delay: 100 });
        w.setProps({ vsmDictionary: dict2 });
        _listEx() .should.equal(false);

        clock.tick(300);
        vueTick(() => {
          _listEx().should.equal(true);
          cb();
        });
      });
    });


    it('lets the `itemLiteralContent` prop make custom content for a ' +
       'ListItemLiteral', cb => {
      w = make({
        initialValue: 'Q',  // Matches no entries.
        itemLiteralContent: s => `<div x="y">_-${s}-_</div>`
      });
      _focus();
      clock.tick(300);

      vueTick(() => {
        _itemLOnly().should.equal(true);
        _itemL().html().should.contain('><div x="y">_-Q-_</div><');
        cb();
      });
    });


    it('follows through immediately when `itemLiteralContent` prop is ' +
       'changed', cb => {
      w = make({
        initialValue: 'Q',
        itemLiteralContent: s => `<div x="y">_-${s}-_</div>`
      });
      _focus();
      clock.tick(300);

      vueTick(() => {
        w.setProps({ itemLiteralContent: s => `**${s}**` });
        vueTick(() => {
          _itemLOnly().should.equal(true);
          _itemL().html().should.contain('>**Q**<');
          cb();
        });
      });
    });


    it('does not signal an error from `loadFixedTerms()` in TheInput, ' +
       '(as fixedTerms will then still be available as normal matches)', () => {
      var dict2 = makeDictionary({ delay: 100 });
      dict2.loadFixedTerms = (idts, options, cb) => cb('ERR');
      w = make({ initialValue: 'ab', vsmDictionary: dict2 });

      clock.tick(300);
      _input().classes().should.not.contain('error');
    });


    it('signals an error from `getMatchesForString()` in TheInput; ' +
       'and removes it after a next successful request', () => {
      var dict2 = makeDictionary({ delay: 100 });
      var callNr = 0;
      dict2.getEntryMatchesForString = (searchStr, options, cb) => {
        ///DEBUG//D('----- QUERY for ' + searchStr);
        return ++callNr == 1 ? setTimeout(() => cb('ERR'), 0) :
          dict.getEntryMatchesForString(searchStr, options, cb);
      };

      w = make({ initialValue: 'ab', vsmDictionary: dict2 });
      _focus();
      clock.tick(300);
      _input().classes().should.contain('error');
      // --- The line below SHOULD be tested. But somehow it fails in this test,
      //     while it succeeds when run live in the browser!...
      //     It fails also with Vue.nextTick(). Maybe a bug in 'vue-test-utils'?
      //     (Maybe this gets fixed in Vue 2.6 & next vue-test-utils?)
      //     => So, we just comment this (& 3 others below) out for now...  ---
      //  D(w.vm.isSpinnerShown);  // => false
      //  D(_spinner().exists());  // => true, even after nextTick():  Wrong!...
      if (Z)  _spinner().exists().should.equal(false);

      _setInput('a');
      clock.tick(200);
      _input().classes().should.not.contain('error');
      if (Z)  _spinner().exists().should.equal(false);
    });


    it('signals an error from `getDictInfos()` in TheInput; ' +
       'and removes it after a next successful request', () => {
      var dict2 = makeDictionary({ delay: 100 });
      var callNr = 0;
      dict2.getDictInfos = (options, cb) => {
        return ++callNr == 1 ? setTimeout(() => cb('ERR'), 0) :
          dict.getDictInfos(options, cb);
      };

      w = make({ initialValue: 'ab', vsmDictionary: dict2 });
      _focus();
      clock.tick(300);
      _input().classes().should.contain('error');
      if (Z)  _spinner().exists().should.equal(false);

      _setInput('a');
      clock.tick(200);
      _input().classes().should.not.contain('error');
      if (Z)  _spinner().exists().should.equal(false);
    });


    it('shows fixedTerms (given via `queryOptions.idts`), for an empty ' +
       'search string', () => {
      w = make({
        initialValue: '',
        queryOptions: { idts: [{ id: 'B:03' }] } // This also causes an initial..
      });                 // ..call to `loadFixTerms()` to preload data for this.
      _focus();

      clock.tick(300);
      _listEx () .should.equal(true);
      _itemPST(0).should.equal('bcc');  // ListItem for the fixedTerm.
    });


    it('pre-loads new fixedTerms when its prop `queryOptions`(/`.idts`) ' +
       'changes; and uses only those in subsequent query results', () => {
      var dict2 = makeDictionary({ delay: 100 });
      w = make({
        queryOptions: { idts: [{ id: 'B:03' }] },  // -> `e5`.
        vsmDictionary: dict2
      });
      _focus();

      clock.tick(100);
      Object.keys(dict2.fixedTermsCache).length.should.equal(1);
      clock.tick(200);
      _listEx () .should.equal(true);
      _itemPST(0).should.equal('bcc');

      w.setProps({ queryOptions: { idts: [{ id: 'B:02' }] } });  // -> `e4`.
      _listEx () .should.equal(false);

      clock.tick(100);
      Object.keys(dict2.fixedTermsCache).length.should.equal(2);
      clock.tick(200);
      _listEx () .should.equal(true);
      _itemPST(0).should.equal('bcd');
    });


    it('uses `queryOptions.perPage`', () => {
      w = make(
        { initialValue: 'b', queryOptions: { perPage: 100 }},
        {}  // Don't add any listeners => it won't add a ListItemLiteral.
      );
      _focus();

      clock.tick(300);
      _listLen().should.equal(4);

      w = make(
        { initialValue: 'b', queryOptions: { perPage: 2 }},
        {}
      );
      _focus();

      clock.tick(300);
      _listLen().should.equal(2);
    });


    it('uses `maxStringLengths`', () => {
      w = make({ initialValue: 'bcd' });  // Matches `e4`.
      _focus();
      clock.tick(300);
      _itemPST(0).should.equal('bcd');
      _itemPDT(0).should.equal('(Descr)');

      w = make({ initialValue: 'bcd',
        maxStringLengths: { str: 2 } });
      _focus();
      clock.tick(300);
      _itemPST(0).should.equal('b…');
      _itemPDT(0).should.equal('(Descr)');

      w = make({ initialValue: 'bcd',
        maxStringLengths: { strAndDescr: 6 } });
      _focus();
      clock.tick(300);
      _itemPST( 0).should.equal('bcd');
      _itemPDT( 0).should.equal('(De…)');

      w = make({ initialValue: 'bcd',
        maxStringLengths: { str: 2, strAndDescr: 5 } });
      _focus();
      clock.tick(300);
      _itemPST(0).should.equal('b…');
      _itemPDT(0).should.equal('(De…)');
    });


    it('follows through immediately when `maxStringLengths` prop is ' +
       'changed', () => {
      w = make({ initialValue: 'bcd' });  // Matches `e4`.
      _focus();
      clock.tick(300);
      _itemPST(0).should.equal('bcd');
      _itemPDT(0).should.equal('(Descr)');

      w.setProps({ maxStringLengths: { str: 2 } });
      _itemPST(0).should.equal('b…');
      _itemPDT(0).should.equal('(Descr)');
    });


    it('only adds a ListItemLiteral when an \'item-literal-select\' ' +
       'listener is added', cb => {
      // Note: our test-setup adds an 'item-literal-select' listener by default.
      w = make({ initialValue: 'Q' });  // Matches no entries.
      _focus();
      clock.tick(300);

      vueTick(() => {
        _listLen()  .should.equal(1);
        _itemLOnly().should.equal(true);

        // Subtest 2: don't add any listeners => it won't add a ListItemLiteral.
        w = make({ initialValue: 'Q' }, {});
        _focus();
        clock.tick(300);

        vueTick(() => {
          _listLen().should.equal(false);  // TheList is now closed.
          cb();
        });
      });
    });


    it('only emits an \'item-active-change\' event when a listener for it is ' +
       'added', () => {
      // Note: our test-setup adds an 'item-active-change' listener by default.
      w = make({ initialValue: 'ab' });  // Matches `e2`.
      _focus();
      clock.tick(300);
      _item(0).classes().should.contain('item-state-active');
      // (First emit's first arg should be `e2`).
      // w.emitted('item-active-change')[0][0].id.should.equal('A:02');
      _emitIAC().id.should.equal('A:02');   // This is shorthand for line above.

      // Subtest 2: don't add any listeners.
      w = make({ initialValue: 'ab' }, {});
      _focus();
      clock.tick(300);
      _item(0).classes().should.contain('item-state-active');
      // expect(w.emitted('item-active-change')).to.equal(undefined);  // ..:
      _emitIAC().should.equal(0);           // This is shorthand for line above.
    });
  });



  describe('handles user actions on TheInput', () => {

    it('if changing TheInput\'s content (1): opens a closed TheList, ' +
       'and emits \'list-open\' & \'item-active-change\'+matchObj; ' +
       'and shows fixedTerms & normal matches', cb => {
      w = make({ queryOptions: qoFT });  // Makes it consider a fixedTerm.
      clock.tick(1000);
      _listEx().should.equal(false);  // TheList is closed at start.

      _setInput('b');   // Change content of TheInput.
      clock.tick(200);  // Wait for results to come in.

      vueTick(() => {
        _listEx ()   .should.equal(true);   // After that, TheList is open.
        _emitLO ()   .should.equal(true);   // 'list-open' was emitted.
        _emitIAC().id.should.equal('B:03'); // 'item-active-change': the fixedT.

        _listLen( ).should.equal(5);
        _item   (0).classes().should.contain('item-type-fixed');  // fixedTerm.
        _itemPST(0).should.equal('bcc');
        _itemPST(1).should.equal('bc');
        _itemPST(2).should.equal('bcd');
        _itemPST(3).should.equal('ab');
        _item   (4).classes().should.contain('item-type-literal');
        cb();
      });
    });


    it('if changing TheInput\'s content (2): opens a closed TheList, ' +
       'and emits \'list-open\' & \'item-active-change\'+string ' +
       'if this just activated the ListItemLiteral', cb => {
      w = make({ queryOptions: qoFT });
      clock.tick(1000);
      _listEx().should.equal(false);

      _setInput('Q');  // Change content of TheInput to match no items.
      clock.tick(200);

      vueTick(() => {
        _listEx ().should.equal(true);
        _emitLO ().should.equal(true);
        _emitIAC().should.equal('Q');  // 'item-active-change': the searchStr.

        _itemLOnly().should.equal(true);
        cb();
      });
    });


    it('if changing TheInput\'s content (3): changes an open TheList, ' +
       'and emits only \'item-active-change\'+matchObj', cb => {
      w = make({ queryOptions: qoFT });
      _setInput('b');  // First, set this value, which will open TheList.
      clock.tick(300);
      _listEx().should.equal(true);
      _emitLO().should.equal(true);            // Emitted a first 'list-open'.

      _setInput('ab');  // Next, make TheInput match `e2` only.
      clock.tick(300);

      vueTick(() => {
        _listEx () .should.equal(true);
        _emitLO (1).should.equal(false);     // Emitted no second 'list-open'.
        _emitIAC(1).id.should.equal('A:02'); // 'item-active-change' #2: `e2`.

        _listLen() .should.equal(2);
        _itemPST(0).should.equal('ab');
        _item   (1).classes().should.contain('item-type-literal');
        cb();
      });
    });


    it('if changing TheInput\'s content (4): changes an open TheList, ' +
       'and emits \'item-active-change\'+string if this just activated ' +
       'the ListItemLiteral', cb => {
      w = make({ queryOptions: qoFT });
      _setInput('b');
      clock.tick(300);

      vueTick(() => {
        _setInput('Q');  // Make TheInput match no items.
        clock.tick(300);

        vueTick(() => {
          _listEx () .should.equal(true);
          _emitLO (1).should.equal(false);  // Emitted no second 'list-open'.
          _emitIAC(1).should.equal('Q');  // 'item-active-change' #2: searchStr.

          _listLen() .should.equal(1);
          _item   (0).classes().should.contain('item-type-literal');
          cb();
        });
      });
    });


    it('if changing TheInput\'s content (5): changes an open TheList, and ' +
       'and emits nothing if the ListItem actually did not change', cb => {
      w = make({ queryOptions: qoFT });
      _setInput('b');
      clock.tick(300);
      _listEx().should.equal(true);
      _emitLO().should.equal(true);

      _setInput('bc');  // This will keep the fixedTerm as a first match.
      clock.tick(300);

      vueTick(() => {
        _listEx () .should.equal(true);
        _emitLO (1).should.equal(false);  // Emitted no second 'list-open'.
        _emitIAC(1).should.equal(0);      // And no 2nd'item-active-change'.

        _listLen() .should.equal(4);      // I.e. 3 matches + ListItemLiteral.
        _itemPST(0).should.equal('bcc');
        cb();
      });
    });


    it('if changing TheInput\'s content (6): changes an open TheList, and ' +
       'emits if the only item, ListItemLiteral, changed', cb => {
      w = make({ queryOptions: qoFT });
      _setInput('Q');
      clock.tick(300);
      _listEx().should.equal(true);
      _emitLO().should.equal(true);

      _setInput('QQ');  // Results in another single ListItemLiteral.
      clock.tick(300);

      vueTick(() => {
        _listEx () .should.equal(true);
        _emitLO (1).should.equal(false);  // Emitted no second 'list-open'.
        _emitIAC(1).should.equal('QQ');   // 'item-active-change': emit #2.

        _listLen() .should.equal(1);
        _item   (0).classes().should.contain('item-type-literal');
        cb();
      });
    });


    it('if changing TheInput\'s content (7), and no results: ' +
       'closes an open TheList, and emits \'close-list\' & ' +
       '\'item-active-change\'+false', cb => {
      w = make(
        { queryOptions: qoFT },
        { 'item-active-change': o => o
          // No 'item-literal-select' listener => it won't add a ListItemLiteral.
        }
      );
      _setInput('b');
      clock.tick(300);
      _listEx().should.equal(true);  // TheList is open.
      _emitLO().should.equal(true);

      _setInput('Q');  // Results in no matches, not even a ListItemLiteral.
      clock.tick(300);

      vueTick(() => {
        _listEx () .should.equal(false);  // TheList is closed.
        _emitLC () .should.equal(true);   // It emitted a 'list-close'.
        _emitIAC(1).should.equal(false);  // 'item-active-change' #2: `false`.
        cb();
      });
    });


    it('if changing TheInput\'s content (8), and no results: leaves a ' +
       'closed TheList closed, and emits none of the above', cb => {
      w = make(
        { queryOptions: qoFT },
        { 'item-active-change': o => o }
      );
      _setInput('Q');
      clock.tick(300);
      _listEx().should.equal(false);  // TheList stays closed.

      _setInput('Q');  // Results in no matches, not even a ListItemLiteral.
      clock.tick(300);

      vueTick(() => {
        _listEx ().should.equal(false);  // TheList stays closed again.
        _emitLO ().should.equal(false);  // } It emitted no 'list-open', ..
        _emitLC ().should.equal(false);  // } ..no 'list-close', ..
        _emitIAC().should.equal(0);      // } ..and no 'item-active-change'.
        cb();
      });
    });


    it('trims the input string (i.e. removes front/end whitespace)', () => {
      w = make({});
      _setInput(' \t ab \r\n ');  // Matches `e2`.
      clock.tick(300);
      _listEx () .should.equal(true);
      _itemPST(0).should.equal('ab');
    });


    it('emits \'input-change\' + search-string, ' +
       'for absent `initialValue`', () => {
      w = make({});
      clock.tick(300);
      _emitIC(0).should.equal('');
    });


    it('emits \'input-change\' + trimmed search-string, ' +
       'for a given `initialValue`', () => {
      w = make({ initialValue: '  \r \n \t   a    ' });
      clock.tick(300);
      _emitIC(0).should.equal('a');
    });


    it('emits \'input-change\' + trimmed search-string, ' +
       'when changing TheInput', () => {
      w = make({});
      clock.tick(50);

      _setInput(' \t ab \r\n ');
      clock.tick(300);
      _emitIC(1).should.equal('ab');

      _setInput('x');
      clock.tick(300);
      _emitIC(2).should.equal('x');
    });


    it('does not emit \'input-change\', nor changes TheList, if adding only ' +
       'whitespace to the input string\'s start/end', () => {
      w = make({ initialValue: 'a' }, {});  // Matches `e1` and `e2`.
      _focus();

      clock.tick(300);
      _emitIC (0).should.equal('a');
      _listLen() .should.equal(2);
      _itemPST(0).should.equal('a');
      _itemPST(1).should.equal('ab');

      _setInput('  \n \r  a \t  ');
      clock.tick(300);
      _emitIC (1).should.equal(0); // It did not emit a second 'input-change'.
      _listLen() .should.equal(2);     // } TheList did not change.
      _itemPST(0).should.equal('a');   // }
      _itemPST(1).should.equal('ab');  // }
    });


    it('makes the first ListItem the active one again, ' +
       'after updating TheList', cb => {
      w = make({ initialValue: 'b' });  // Matches `e3/5/4/2` + item-literal.
      _focus();
      clock.tick(300);

      vueTick(() => {  // Somehow, vue-test-utils needs this to add item-literal.
        _listLen().should.equal(5);
        _item   (0).classes().should.contain('item-state-active');

        _keyDown();       // Make the second item ('bcc') the active one.
        _item (1).classes().should.contain('item-state-active');

        _setInput('bc');  // Change input (this makes TheList stale), ..
        clock.tick(200);  // and wait for query result to arrive.

        vueTick(() => {
          _listLen().should.equal(4);  // TheList changed: one match less.
          _item(0).classes().should.contain('item-state-active'); // Item1=activ.
          cb();
        });
      });
    });


    it('makes the first ListItem the active one again, ' +
       'after updating TheList; also when reopening a closed TheList', cb => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);

      vueTick(() => {
        // NOTE: somehow, the following line is needed under the current version
        // of 'vue-test-utils'@1.0.0-beta.24.  It 'touches' TheList's existence.
        _listEx().should.equal(true);

        _keyDown();         // Makes the second item the active one.
        _item  (1).classes().should.contain('item-state-active');

        _keyEsc();          // Closes TheList again.
        _listEx().should.equal(false);

        _setInput('bc');  // Launches new query.
        clock.tick(200);

        vueTick(() => {
          _listEx ().should.equal(true);  // TheList re-opened.
          _listLen().should.equal(4);
          _item(0).classes().should.contain('item-state-active');
          cb();
        });
      });
    });


    it('makes the first ListItem the active one again, after updating ' +
       'TheList; also if there remains only a ListItemLiteral', cb => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);

      vueTick(() => {
        _listEx().should.equal(true);

        _keyDown();         // Makes the second item the active one.
        _item(1).classes().should.contain('item-state-active');

        _setInput('Q');   // This will give no matches.
        clock.tick(200);

        vueTick(() => {
          _listLen().should.equal(1);  // Only the ListItemLiteral.
          _item(0).classes().should.contain('item-type-literal');
          _item(0).classes().should.contain('item-state-active');
          cb();
        });
      });
    });


    it('changes ListItemLiteral\'s content along with TheInput', cb => {
      w = make({ initialValue: 'QQQ' });   // This will give no matches.
      _focus();
      clock.tick(300);

      vueTick(() => {
        _itemLOnly().should.equal(true);  // Only the ListItemLiteral.
        _itemLT().should.contain('QQQ');

        _setInput('RRR');   // This will give no matches.
        clock.tick(200);

        vueTick(() => {
          _itemLOnly().should.equal(true);  // Only the ListItemLiteral.
          _itemLT().should.contain('RRR');
          cb();
        });
      });
    });


    it('on focus, it emits `focus`; and does not open TheList ' +
       '(if not given an initialValue)', () => {
      w = make({}, {});

      clock.tick(1000);
      _listEx().should.equal(false);

      _focus();
      _emitF().should.equal(true);

      clock.tick(1000);
      _listEx().should.equal(false);
    });


    it('on focus, it emits `focus`; and opens TheList ' +
       '(if given an `initialValue`) and emits `list-open`', () => {
      w = make({ initialValue: 'ab' }, {});

      // Part 1: TheList does not open without `_focus()`.
      clock.tick(1000);
      _listEx().should.equal(false);

      // Part 2: TheList opens after 'focus' and after query results arrive.
      _focus();
      _emitF().should.equal(true);
      clock.tick(200);
      _listEx().should.equal(true);
      _emitLO().should.equal(true);
    });


    it('on blur, it emits `blur`; and closes TheList and emits ' +
       '`list-close`', () => {
      w = make({ initialValue: 'ab' });
      _focus();
      clock.tick(300);

      _listEx().should.equal(true);

      _blur();
      _emitB ().should.equal(true);

      _listEx().should.equal(false);
      _emitLC().should.equal(true);
    });


    it('on focus, it does not reopen a hard-closed TheList ' +
       '(= closed with Esc)', () => {
      w = make({ initialValue: 'ab' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);    // TheList is open, ..
      _emitLO().should.equal(true);    // ..and it emitted a 'list-open'.

      _keyEsc();                       // Pressing Esc..
      _emitB ().should.equal(false);   // ..does not emit 'blur', ..

      _listEx().should.equal(false);   // ..but it closes TheList..
      _emitLC().should.equal(true);    // ..and this emits 'list-close'.

      _blur();                         // Next, after a blur..
      _focus();                        // ..and a new focus event,
      _listEx().should.equal(false);   // TheList stays closed, ..
      _emitLO(1).should.equal(false);  // ..and emits no 2nd 'list-open'.
    });


    it('on focus[=>open] (resp. blur/Esc[=>close]), it emits ' +
       '`item-active-change` + the active item\'s ID (resp. false)', () => {
      w = make({ initialValue: 'ab' });
      _focus();
      clock.tick(300);

      _listEx()     .should.equal(true);
      _emitIAC(0).id.should.equal(e2.id);  // On open: i-a-c + item `e2`'s ID.

      _blur();
      _listEx()     .should.equal(false);
      _emitIAC(1)   .should.equal(false);  // On blur-close: i-a-c + `false`.

      _focus();
      _listEx()     .should.equal(true);
      _emitIAC(2).id.should.equal(e2.id);  // On reopen: same as first.

      _keyEsc();
      _listEx()     .should.equal(false);
      _emitIAC(3)   .should.equal(false);  // On Esc-closing: i-a-c + `false`.
    });


    it('on Ctrl+Enter, when TheInput contains no string-code, ' +
       'it changes and emits nothing', () => {
      w = make({ initialValue: 'ab' }, {});
      _focus();
      clock.tick(300);

      _inputV().should.equal('ab');
      _listLen().should.equal(1);
      var emitCount = w.emittedByOrder().length;

      _keyCEnter();
      clock.tick(1000);

      _inputV().should.equal('ab');
      _listLen().should.equal(1);
      w.emittedByOrder().length.should.equal(emitCount);  // No new emits.
    });


    it(['on Ctrl+Enter, when TheInput contains a string-code (e.g. \'\\beta\'),',
      'it changes TheInput\'s content (e.g. \'β\'), updates TheList, and emits',
      'it with `input-change`; and `item-active-change` for a ListItemLiteral']
      .join('\n        '),
    cb => {
      w = make({ initialValue: 'ab\\beta/beta' });
      _focus();
      clock.tick(300);

      vueTick(() => {
        _itemLOnly().should.equal(true);  // Only ListItemLiteral, in open list.
        _inputV ().should.equal('ab\\beta/beta');
        _emitIC ().should.equal('ab\\beta/beta');
        _emitIAC().should.equal('ab\\beta/beta');

        _keyCEnter();
        _inputV() .should.equal('abββ');  // Ctrl+Enter changed TheInput's..
        _emitIC(1).should.equal('abββ');  // ..value, and also emits this.

        clock.tick(200);                  // Wait for the new query result.

        vueTick(() => {
          _itemLOnly();  // Still only a ListItemLiteral, in an open TheList.
          _itemLT () .should.contain('abββ'); // It contains TheInput's value.
          _emitIAC(1).should.equal('abββ');   // It emitted item-active-change.
          cb();
        });
      });
    });


    it('on key-Up/Down, changes the active ListItem, and emits ' +
       '`item-active-change`', cb => {
      w = make({ initialValue: 'b' });  // Matches `e3/5/4/2` + item-literal.
      var es = [e3, e5, e4, e2]; // Matching entries in match-order, excl. itemL.

      _focus();
      clock.tick(300);

      vueTick(() => {
        _listLen() .should.equal(5);
        _item   (0).classes().should.contain('item-state-active');
        _emitIAC(0).id.should.equal(es[0].id);

        _keyDown();  // Activate item 2.
        _item   (1).classes().should.contain('item-state-active');
        _emitIAC(1).id.should.equal(es[1].id);
        _onlyOneItemIsActive();

        _keyDown();  // Activate item 3.
        _item   (2).classes().should.contain('item-state-active');
        _emitIAC(2).id.should.equal(es[2].id);
        _onlyOneItemIsActive();

        _keyUp();   // Activate item 2.
        _item   (1).classes().should.contain('item-state-active');
        _emitIAC(3).id.should.equal(es[1].id);
        _onlyOneItemIsActive();

        _keyUp();   // Activate item 1.
        _item   (0).classes().should.contain('item-state-active');
        _emitIAC(4).id.should.equal(es[0].id);
        _onlyOneItemIsActive();
        cb();
      });
    });


    it('on key-Up/Down, cycles through a TheList without a ListItemLiteral, ' +
       'and emits', cb => {
      w = make(
        { initialValue: 'b' },
        {                               // We add no item-lit. listener, ..
          'item-active-change': o => o  // ..but still add one for this. ..
        }
      );                   // ..This matches `e3/5/4/2`; no ListItemLiteral.
      var es = [e3, e5, e4, e2];  // Matching entries in match-order.

      _focus();
      clock.tick(300);

      vueTick(() => {
        _listLen()   .should.equal(4);  // No ListItemLiteral.
        _itemL  ()   .exists().should.equal(false);

        _item   (0).classes().should.contain('item-state-active');
        _emitIAC(0).id.should.equal(es[0].id);

        _keyUp();  // Activate last item: `e2`.
        _item   (3).classes().should.contain('item-state-active');
        _emitIAC(1).id.should.equal(es[3].id);
        _onlyOneItemIsActive();

        _keyUp();  // Activate last-but-one item.
        _item   (2).classes().should.contain('item-state-active');
        _emitIAC(2).id.should.equal(es[2].id);
        _onlyOneItemIsActive();

        _keyDown();   // Activate last item.
        _item   (3).classes().should.contain('item-state-active');
        _emitIAC(3).id.should.equal(es[3].id);
        _onlyOneItemIsActive();

        _keyDown();   // Activate item 1.
        _item   (0).classes().should.contain('item-state-active');
        _emitIAC(4).id.should.equal(es[0].id);
        _onlyOneItemIsActive();

        _keyDown();   // Activate item 2.
        _item   (1).classes().should.contain('item-state-active');
        _emitIAC(5).id.should.equal(es[1].id);
        _onlyOneItemIsActive();
        cb();
      });
    });


    it('on key-Up/Down, cycles through a TheList with a ListItemLiteral, ' +
       'and emits', cb => {
      w = make({ initialValue: 'b' });  // Matches `e3/5/4/2` + item-literal.
      var es = [e3, e5, e4, e2]; // Matching entries in match-order, excl. itemL.

      _focus();
      clock.tick(300);

      vueTick(() => {
        _listLen()   .should.equal(5);
        _itemL  ()   .exists().should.equal(true);

        _item   (0).classes().should.contain('item-state-active');
        _emitIAC(0).id.should.equal(es[0].id);

        _keyUp();  // Activate last item: the ListItemLiteral.
        _item   (4).classes().should.contain('item-state-active');
        _emitIAC(1)   .should.equal('b');  // The literal input-string.
        _onlyOneItemIsActive();

        _keyUp();  // Activate last-but-one item: `e2`.
        _item   (3).classes().should.contain('item-state-active');
        _emitIAC(2).id.should.equal(es[3].id);
        _onlyOneItemIsActive();

        _keyDown();   // Activate last item.
        _item   (4).classes().should.contain('item-state-active');
        _emitIAC(3)   .should.equal('b');
        _onlyOneItemIsActive();

        _keyDown();   // Activate item 1.
        _item   (0).classes().should.contain('item-state-active');
        _emitIAC(4).id.should.equal(es[0].id);
        _onlyOneItemIsActive();

        _keyDown();   // Activate item 2.
        _item   (1).classes().should.contain('item-state-active');
        _emitIAC(5).id.should.equal(es[1].id);
        _onlyOneItemIsActive();
        cb();
      });
    });


    it('on key-Up/Down, for only one ListItem: does nothing', cb => {
      w = make({ initialValue: 'bcc' }, { 'item-active-change': o => o });
      _focus();
      clock.tick(300);

      vueTick(() => {
        _listLen().should.equal(1);
        _itemL  ().exists().should.equal(false);
        _item   (0).classes().should.contain('item-state-active');
        var emitCount = w.emittedByOrder().length;

        _keyUp();
        _item   (0).classes().should.contain('item-state-active');
        w.emittedByOrder().length.should.equal(emitCount);  // No new emits.

        _keyDown();   // Activate item 2.
        _item   (0).classes().should.contain('item-state-active');
        w.emittedByOrder().length.should.equal(emitCount);
        cb();
      });
    });


    it('on key-Up/Down, for only one ListItemLiteral: does nothing', cb => {
      w = make({ initialValue: 'Q' });
      _focus();
      clock.tick(300);

      vueTick(() => {
        _itemLOnly().should.equal(true);
        _itemL().classes().should.contain('item-state-active');
        var emitCount = w.emittedByOrder().length;

        _keyUp();
        _itemL().classes().should.contain('item-state-active');
        w.emittedByOrder().length.should.equal(emitCount);  // No new emits.

        _keyDown();   // Activate item 2.
        _itemL().classes().should.contain('item-state-active');
        w.emittedByOrder().length.should.equal(emitCount);
        cb();
      });
    });


    it('on key-Up/Down, for an Esc-closed TheList: opens it, ' +
       'and does not change the active item', cb => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);
      vueTick(() => {
        _listEx ().should.equal(true);
        _keyDown();  // Activate item 2.
        _keyEsc ();  // Close TheList again.
        _listEx ().should.equal(false);

        _keyDown();  // Key-Down should open TheList.
        _listEx ().should.equal(true);
        _item   (1).classes().should.contain('item-state-active');

        _keyEsc ();  // Close TheList again.
        _listEx ().should.equal(false);

        _keyUp  ();  // Key-Up should open TheList.
        _listEx ().should.equal(true);
        _item   (1).classes().should.contain('item-state-active');
        cb();
      });
    });


    it('on key-Up/Down, for an Esc-closed TheList that hasn\'t queried yet: ' +
       'queries for matches now, opens it, and sets item 1 to active', cb => {
      w = make({ initialValue: 'b', queryOptions: qoFT });
      _focus();
      clock.tick(50);  // While still waiting for fixedTerms to arrive, ..
      _keyEsc();      // ..Esc prevents the subsequent query for matches for 'b'.
      clock.tick(1000);

      vueTick(() => {
        _listEx().should.equal(false);

        _keyDown();  // Key-Down should now launch a query for 'b'.

        clock.tick(150);  // Matches haven't arrived yet.
        _listEx().should.equal(false);

        clock.tick(50);   // Matches have arrived now.
        _listEx().should.equal(true);
        _item  (0).classes().should.contain('item-state-active');
        cb();
      });
    });


    it('on key-Up/Down, for a closed TheList, Esc-closed just after a new ' +
       'query: requeries, opens it, and makes item 1 active', cb => {
      w = make({ initialValue: 'b', queryOptions: qoFT });
      _focus();
      clock.tick(150);  // While still waiting for query results for 'b',
      _keyEsc();        // ..Esc prevents subsequent opening of TheList.
      clock.tick(1000);

      vueTick(() => {
        _listEx().should.equal(false);

        _keyDown();  // Key-Down should now re-query. [We only test Key-Down].
        clock.tick(150);
        _listEx().should.equal(false);  // Still awaiting query result.
        clock.tick(50);
        _listEx().should.equal(true);   // Results for 'b' & dictInfos arrived.
        _item(0).classes().should.contain('item-state-active'); // Item 1=active.
        cb();
      });
    });


    it('on key-Up/Down, for an open TheList, Esc-closed just after a new ' +
       'query: requeries, opens it, and makes item 1 active again', () => {
      w = make({ initialValue: 'b' }, {});  // No ListItemLiteral.
      _focus();
      clock.tick(300);
      _listLen().should.equal(4);    // TheList is open, has 4 items, ..
      _keyDown();                    // ..and item 2 is active, ..
      _item(1).classes().should.contain('item-state-active');

      _setInput('bc');  // Start a new query.
      clock.tick(50);   // (Note: 50, not 150: no new dictInfos will be queried).
      _listLen().should.equal(4); // Still awaiting query result: list unchanged.

      _keyEsc();        // Abort by Esc-closing TheList.
      clock.tick(1000);
      _listEx().should.equal(false);

      _keyDown();  // Key-Down should now re-query. [We only test Key-Down].
      clock.tick(50);
      _listEx().should.equal(false);  // Still awaiting query result.
      clock.tick(150);
      _listLen().should.equal(3);     // The 3 matches for 'b' arrived.
      _item(0).classes().should.contain('item-state-active'); // Item 1 = active.
    });


    it('on key-Up/Down, for a no-results closed TheList: leaves it ' +
       'closed', () => {
      w = make({ initialValue: 'Q' }, {});  // No ListItemLiteral.
      _focus();
      clock.tick(1000);
      _listEx().should.equal(false);  // List is closed.

      _keyDown();
      clock.tick(1000);
      _listEx().should.equal(false);

      _keyUp();
      clock.tick(1000);
      _listEx().should.equal(false);
    });


    it('does not add ListItemLiteral for an empty input string', cb => {
      w = make({ initialValue: '' });
      _focus();
      clock.tick(300);

      vueTick(() => {
        _listEx().should.equal(false);  // No results, no ListItemLiteral.

        _setInput('b');
        clock.tick(200);
        vueTick(() => {
          _listLen().should.equal(5);
          _itemL().exists().should.equal(true);  // Check: ListItemLit. works.
          cb();
        });
      });
    });


    it('does not add ListItemLiteral for an empty input string, also if ' +
       'there is a fixedTerm', cb => {
      w = make({ initialValue: '', queryOptions: qoFT });
      _focus();
      clock.tick(300);

      vueTick(() => {
        _listLen().should.equal(1);  // TheList shows a fixedTerm only.
        _item(0).classes().should.contain('item-type-fixed');
        _itemL().exists().should.equal(false);
        cb();
      });
    });


    it('on Esc, and open TheList: closes it, emits `list-close` and ' +
       '`item-active-change` + false, but no `key-esc', () => {
      w = make({ initialValue: 'b' }, { 'item-active-change':  o => o });
      _focus();
      clock.tick(300);
      _listEx ().should.equal(true);

      _keyEsc();
      _listEx () .should.equal(false);
      _emitLC () .should.equal(true);
      _emitIAC(1).should.equal(false);  // Second emitted 'item-active-change'.
      _emitEsc() .should.equal(false);  // No emitted 'key-esc'.
    });


    it('on Esc, and closed TheList: emits `key-esc` only', () => {
      w = make({ initialValue: 'Q' }, { 'item-active-change':  o => o });
      _focus();
      clock.tick(300);
      _listEx ().should.equal(false);  // No results, so TheList stays closed.
      var emitCount = w.emittedByOrder().length;

      _keyEsc();
      _listEx ().should.equal(false);
      _emitLC ().should.equal(false);
      _emitIAC().should.equal(0);     // No emitted 'item-active-change' at all.
      _emitEsc().should.equal(true);  // It emitted 'key-esc', which is its..
      w.emittedByOrder().length.should.equal(emitCount + 1); // ..only new emit.
    });


    it('on Enter on ListItem: closes TheList, and emits ' +
       'item-select + match-object', () => {
      w = make({ initialValue: 'a' }, {});  // Matches `e1` and `e2`.
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);

      _keyDown();
      _item(1).classes().should.contain('item-state-active'); // Item 2 = active.

      _keyEnter();
      _listEx ().should.equal(false);
      _emitSel ().id.should.deep.equal(e2.id);
      _emitLSel().should.equal(0);
    });


    it('on Enter on ListItemLiteral: closes TheList, and emits ' +
       'item-literal-select + the trimmed input-string', cb => {
      w = make({ initialValue: ' A\t' });  // Matches `e1`, `e2`, and item-lit.
      _focus();
      clock.tick(300);

      vueTick(() => {
        _listLen().should.equal(3);

        _keyUp();  // Active ListItemLiteral.
        _itemL().classes().should.contain('item-state-active');
        _keyEnter();

        vueTick(() => {
          _listEx ().should.equal(false);
          _emitSel ().should.equal(0);    // No 'item-select'.
          _emitLSel().should.equal('A');  // Only 'item-literal-select'.
          cb();
        });
      });
    });


    it('on Enter on closed TheList: opens TheList, and leaves the ' +
       'active item unchanged', cb => {
      w = make({ initialValue: 'a' }, {});  // Matches `e1` and `e2`.
      _focus();
      clock.tick(300);

      vueTick(() => {
        _listEx().should.equal(true);
        _keyDown();         // Makes the second item the active one.
        _item(1).classes().should.contain('item-state-active'); // Item 2=active.
        _keyEsc();
        _listEx().should.equal(false);  // TheList is closed again.

        _keyEnter();
        vueTick(() => {
          _listEx().should.equal(true);
          _item(1).classes().should.contain('item-state-active');
          cb();
        });
      });
    });


    it('on Enter on early Esc-closed TheList: requeries, opens TheList, and ' +
       'makes item 1 active', cb => {
      w = make({ initialValue: 'b' }, {});
      _focus();
      clock.tick(300);

      vueTick(() => {
        _listEx().should.equal(true);
        _keyDown();         // Makes the second item the active one.
        _item(1).classes().should.contain('item-state-active'); // Item 2=active.
        _listLen().should.equal(4);

        _setInput('bc');  // Start query.
        clock.tick(50);
        _listLen().should.equal(4);  // List unchanged, i.e. results are awaited.

        _keyEsc();        // Close list, which aborts/discards query results.
        clock.tick(1000);
        _listEx().should.equal(false);

        _keyEnter();      // On Enter, ..

        vueTick(() => {
          clock.tick(50);
          _listEx().should.equal(false); // ..result isn't immediately available.

          clock.tick(150);
          _listEx().should.equal(true);
          _listLen().should.equal(3);    // Query result: a new TheList.
          _item(0).classes().should.contain('item-state-active');  // Item1=act.
          cb();
        });
      });
    });


    it('on Backspace on a filled TheInput (not all whitespace): just changes ' +
       'TheInput\'s and TheList\'s content', () => {
      w = make({ initialValue: 'ab' }, {});  // Matches `e2`.
      _focus();
      clock.tick(300);
      _listLen().should.equal(1);

      _input().element.selectionStart = 2;  // } Put cursor at end of TheInput.
      _input().element.selectionEnd   = 2;  // }

      _keyBksp();      // Fire a Bksp-event, but we need to manually simulate..
      _setInput('a');  // ..its effect. It makes TheInput match `e1` and `e2`.

      clock.tick(200);
      _listLen ().should.equal(2);
      _emitBksp().should.equal(false);  // No 'key-bksp' emitted.
    });


    it('on Backspace on an empty TheInput: closes TheList (if open), ' +
       'and emits `key-bksp`', () => {
      w = make({ initialValue: '', queryOptions: qoFT }, {});  // No item-lit.
      _focus();
      clock.tick(300);
      _listLen().should.equal(1);                      // TheList shows only..
      _item(0).classes().should.contain('item-type-fixed');  // ..a fixedTerm.

      _keyBksp();
      _listEx  ().should.equal(false);
      _emitBksp().should.equal(true);

      _keyBksp();
      _listEx  () .should.equal(false);
      _emitBksp(1).should.equal(true);  // Emits also for closed TheList.
    });


    it('on Backspace on a whitespace-only TheInput, and cursor is not ' +
       'at start of TheInput: has no special effect', () => {
      w = make({ initialValue: ' \t', queryOptions: qoFT }, {}); // No item-lit.
      _focus();
      clock.tick(300);
      _listLen().should.equal(1);                      // TheList shows only..
      _item(0).classes().should.contain('item-type-fixed');  // ..a fixedTerm.

      _input().element.selectionStart = 1;  // } Cursor in middle (not start)..
      _input().element.selectionEnd   = 1;  // } ..of TheInput, ..
      _keyBksp();                           // ..and then Bksp: ..
      _inputV  ().should.equal(' \t');      // }
      _listEx  ().should.equal(true);       // }
      _emitBksp().should.equal(false);      // }  ..has no effect.
    });


    it('on Backspace on a whitespace-only TheInput, and cursor is ' +
       'at start of TheInput: empties TheInput, closes an open TheList, ' +
       'and emits `key-bksp`', () => {
      w = make({ initialValue: ' \t', queryOptions: qoFT }, {}); // No item-lit.
      _focus();
      clock.tick(300);
      _listLen().should.equal(1);
      _item(0).classes().should.contain('item-type-fixed');

      _input().element.selectionStart = 0;  // }
      _input().element.selectionEnd   = 0;  // } Cursor at start of TheInput, ..
      _keyBksp();                           // ..and then Bksp: ..
      _inputV  ().should.equal('');         // ..it empties TheInput, ..
      _listEx  ().should.equal(false);      // ..closes TheList, ..
      _emitBksp().should.equal(true);       // ..and emits `key-bksp`.
    });


    it('on Backspace on a whitespace-only TheInput, and cursor is ' +
       'at start of TheInput: empties TheInput, leaves a closed TheList ' +
       'closed, and emits `key-bksp`', () => {
      w = make({ initialValue: ' \t', queryOptions: qoFT }, {}); // No item-lit.
      _focus();
      clock.tick(300);
      _listLen().should.equal(1);
      _item(0).classes().should.contain('item-type-fixed');

      _keyEsc();
      _listEx().should.equal(false);  // This time, start from a closed TheList.

      _input().element.selectionStart = 0;
      _input().element.selectionEnd   = 0;
      _keyBksp();                       // Now on Bksp: ..
      _inputV  ().should.equal('');     // ..it also empties TheInput, ..
      _listEx  ().should.equal(false);  // ..keeps TheList closed, ..
      _emitBksp().should.equal(true);   // ..and also emits `key-bksp`.
    });


    it('on Tab, with `key-tab` listener attached, emits `key-tab`', () => {
      w = make({ initialValue: 'a' }, { 'key-tab':  s => s });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);

      _keyTab();
      _emitTab().should.equal(''); // It emitted, with empty modifier-key string.
    });


    it('on Shift+Tab, with `key-tab` listener attached, emits `key-tab`, ' +
       'emits `key-tab` + \'shift\'', () => {
      w = make({ initialValue: 'a' }, { 'key-tab':  s => s });
      _focus();
      clock.tick(300);
      _keySTab();
      _emitTab().should.equal('shift');
    });


    it('on Tab or Shift+Tab, without `key-tab` listener, ' +
       'emits no `key-tab`', () => {
      w = make({ initialValue: 'a' }, {});
      _focus();
      clock.tick(300);
      _keyTab();
      _keySTab();
      _emitTab().should.equal(0);  // No 'key-tab's emitted.
    });


    it('on left-Click, and TheList is open: nothing special changes', () => {
      w = make({ initialValue: 'a' }, {});
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);

      _input().trigger('click', { button: 0 });
      _listEx().should.equal(true);
    });


    it('on left-Click, and TheList is closed because TheInput has no matches: ' +
       'nothing special changes', () => {
      w = make({ initialValue: 'Q' }, {});  // No matches, no ListItemLiteral.
      _focus();
      clock.tick(300);
      _listEx().should.equal(false);

      _input().trigger('click', { button: 0 });
      _listEx().should.equal(false);
    });


    it('on left-Click (only, and without modifier keys), after TheList was ' +
       'blur-closed: opens TheList, and emits `list-open` and ' +
       '`item-active-change` + data', () => {
      w = make({ initialValue: 'a' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);
      _emitIAC(0).id.should.equal(e1.id);

      _blur();
      _listEx().should.equal(false);
      _emitIAC(1).should.equal(false);

      // E.g. right-click and Ctrl+click have no effect.  (More combinations
      // are tested in TheInput.test.js).
      _input().trigger('click', { button: 1 });
      _input().trigger('click', { button: 0, ctrlKey: true });
      _emitIAC(1).should.equal(false);

      _input().trigger('click', { button: 0 });  // A pure left-click has effect.
      _listEx().should.equal(true);
      _emitIAC(2).id.should.equal(e1.id);
    });


    it('on left-Click (only, and without modifier keys), after TheList was ' +
       'Esc-closed: opens TheList, and emits `list-open` and ' +
       '`item-active-change` + data', () => {
      w = make({ initialValue: 'a' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);
      _emitIAC(0).id.should.equal(e1.id);

      _keyEsc();
      _listEx().should.equal(false);
      _emitIAC(1).should.equal(false);

      _input().trigger('click', { button: 1 });
      _input().trigger('click', { button: 0, ctrlKey: true });
      _emitIAC(1).should.equal(false);

      _input().trigger('click', { button: 0 });
      _listEx().should.equal(true);
      _emitIAC(2).id.should.equal(e1.id);
    });


    it('on left-Doubleclick (only, and without modifier keys), and TheList ' +
       'is open: closes TheList, and emits `dblclick` and `list-close`', () => {
      w = make({ initialValue: 'a' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);

      _input().trigger('dblclick', { button: 1 });
      _input().trigger('dblclick', { button: 0, ctrlKey: true });
      _listEx().should.equal(true);  // Other combinations have no effect.

      _input().trigger('dblclick', { button: 0 }); // A pure dblclick has effect.
      _listEx  ().should.equal(false);
      _emitLC  ().should.equal(true);
      _emitDblc().should.equal(true);
    });
  });



  describe('handles user actions on TheList', () => {

    it('on Hover over not-active (only) ListItem/Literal: makes it the ' +
      'active item, and emits `item-active-change` + match-obj/String', cb => {
      w = make({ initialValue: 'b' });  // Matches `e3/5/4/2` + ListItemLiteral.
      var es = [e3, e5, e4, e2];        // Matched entries in order, excl. itemL.

      _focus();
      clock.tick(300);

      vueTick(() => {
        _listLen() .should.equal(5);
        _item   (0).classes().should.contain('item-state-active');
        _emitIAC(0).id.should.equal(es[0].id);

        _item(2).trigger('mousemove');
        _item   (2).classes().should.contain('item-state-active');
        _emitIAC(1).id.should.equal(es[2].id);
        _onlyOneItemIsActive();

        _item(3).trigger('mousemove');
        _item   (3).classes().should.contain('item-state-active');
        _emitIAC(2).id.should.equal(es[3].id);
        _onlyOneItemIsActive();

        _item(2).trigger('mousemove');  // Give it a second hover, after unhover.
        _item   (2).classes().should.contain('item-state-active');
        _emitIAC(3).id.should.equal(es[2].id);
        _onlyOneItemIsActive();

        _item(2).trigger('mousemove');  // Hover on already active has no effect.
        _item   (2).classes().should.contain('item-state-active');
        _emitIAC(4)   .should.equal(0); // It didn't emit new item-active-change.
        _onlyOneItemIsActive();

        _itemL().trigger('mousemove');  // Mouse-hover over the ListItemLiteral.
        _itemL().classes().should.contain('item-state-active');
        _emitIAC(4).should.equal('b');
        _onlyOneItemIsActive();

        _itemL().trigger('mousemove');  // No effect if sending it a 2nd hover.
        _itemL().classes().should.contain('item-state-active');
        _emitIAC(5).should.equal(0);
        _onlyOneItemIsActive();
        cb();
      });
    });


    it('on left-Click (only, and without modifier keys) on ListItem: ' +
      'closes TheList, and emits `item-select` + match-object', () => {
      w = make({ initialValue: 'b' });  // Matches `e3/5/4/2`, no item-literal.
      _focus();
      clock.tick(300);
      _listLen().should.equal(4);

      _item(2).trigger('click', { button: 1 });
      _item(2).trigger('click', { button: 0, ctrlKey: true });
      _listEx ().should.equal(true);  // Other combinations have no effect.
      _emitSel()   .should.equal(0);  // No item-select emitted yet.

      _item(2).trigger('click', { button: 0 });  // A pure click has effect.
      _listEx ().should.equal(false);
      _emitLC ().should.equal(true);
      _emitSel().id.should.equal(e4.id);

      // Extra test: after requering/opening TheList, we can click a 2nd time.
      _keyDown();
      clock.tick(200);
      _listEx  ().should.equal(true);
      _item(0).trigger('click', { button: 0 });
      _listEx  ().should.equal(false);
      _emitLC (1).should.equal(true);
      _emitSel(1).id.should.equal(e3.id);

      // Extra test: after requery/open, we can click a 'same' item again.
      _keyDown();
      clock.tick(200);
      _listEx  ().should.equal(true);
      _item(0).trigger('click', { button: 0 });
      _listEx  ().should.equal(false);
      _emitLC (2).should.equal(true);
      _emitSel(2).id.should.equal(e3.id);
    });


    it('on left-Click (only, and no modifier keys) on ListItemLiteral: ' +
      'closes TheList, and emits `item-select` + trimmed input-string', cb => {
      w = make({ initialValue: 'b' });  // Matches `e3/5/4/2` + ListItemLiteral.
      _focus();
      clock.tick(300);

      vueTick(() => {
        _listLen() .should.equal(5);

        _itemL().trigger('click', { button: 1 });
        _itemL().trigger('click', { button: 0, ctrlKey: true });
        _listEx ().should.equal(true);  // Other combinations have no effect.
        _emitLSel()   .should.equal(0);  // No item-literal-select emitted yet.

        _itemL().trigger('click', { button: 0 });  // A pure click has effect.
        _listEx  ().should.equal(false);
        _emitLC  ().should.equal(true);
        _emitLSel().should.equal('b');

        // Extra test: after requery/open, we can click a 'same' item-lit. again.
        _keyDown();
        clock.tick(1000);
        vueTick(() => {
          _listLen() .should.equal(5);

          _itemL().trigger('click', { button: 0 });
          _listEx   ().should.equal(false);
          _emitLC  (1).should.equal(true);
          _emitLSel(1).should.equal('b');
          cb();
        });
      });
    });
  });



  describe('events and concurrent event handling at creation time', () => {

    it(['without `queryOptions.idts`, and focus at 0.5 req-delay:',
      'then it queries for search-string, then dictInfos, and then opens',
      'TheList at 2.5 req-delay in total']
      .join(' '),
    () => {
      w = make({ initialValue: 'b' });  // Matches `e3/5/4/2` + ListItemLiteral.
      clock.tick(50);
      _focus();
      clock.tick(199);
      _listEx().should.equal(false);
      clock.tick(1);
      _listEx().should.equal(true);
    });


    it(['without `queryOptions.idts`, and no focus, but search-string:',
      'then TheList stays closed, also after 10 req-delays']
      .join(' '),
    () => {
      w = make({ initialValue: 'b' });
      clock.tick(1000);
      _listEx().should.equal(false);
    });




    it(['with q-idts (=`queryOptions.idts`), and no focus: TheList stays closed,',
      'also after 3 req-delays (when data would have arrived)']
      .join(' '),
    () => {
      w = make({ initialValue: 'b', queryOptions: qoFT });
      clock.tick(300);
      _listEx().should.equal(false);
    });


    it(['with q-idts, and focus at 0.5 req-delay: still opens TheList ',
      'at 3 req-delay in total (=loads fixedTerms already before focus)']
      .join(' '),
    () => {
      w = make({ initialValue: 'b', queryOptions: qoFT });
      clock.tick(50);
      _focus();
      clock.tick(249);
      _listEx().should.equal(false);
      clock.tick(1);
      _listEx().should.equal(true);
    });


    it(['with q-idts, and focus at 10 req-delay: only then queries for searchStr',
      'and for dictInfos, and opens TheList at 12 req-delay in total']
      .join(' '),
    () => {
      w = make({ initialValue: 'b', queryOptions: qoFT });
      clock.tick(1000);
      _focus();
      clock.tick(199);
      _listEx().should.equal(false);
      clock.tick(1);
      _listEx().should.equal(true);
    });


    it(['with q-idts, focus at 0.5 req-delay, and key-Down at 0.5 req-delay:',
      'it opens TheList only after 3 req-delay in total']
      .join(' '),
    () => {
      w = make({ initialValue: 'b', queryOptions: qoFT });
      clock.tick(50);
      _focus();
      _keyDown();
      clock.tick(249);
      _listEx().should.equal(false);
      clock.tick(1);
      _listEx().should.equal(true);
    });


    it(['with q-idts, focus at 0.5 req-delay, and key-Down at 1.5 req-delay:',
      'it opens TheList only after 3 req-delay in total']
      .join(' '),
    () => {
      w = make({ initialValue: 'b', queryOptions: qoFT });
      clock.tick(50);
      _focus();
      clock.tick(100);
      _keyDown();
      clock.tick(149);
      _listEx().should.equal(false);
      clock.tick(1);
      _listEx().should.equal(true);
    });


    it(['with q-idts, focus at 0.5 req-delay, and key-Down at 2.5 req-delay:',
      'it opens TheList only after 3 req-delay in total']
      .join(' '),
    () => {
      w = make({ initialValue: 'b', queryOptions: qoFT });
      clock.tick(50);
      _focus();
      clock.tick(200);
      _keyDown();
      clock.tick(49);
      _listEx().should.equal(false);
      clock.tick(1);
      _listEx().should.equal(true);
    });


    it(['with q-idts, focus at 0.5 req-delay, and Esc at 0.5 req-delay:',
      'TheList stays closed at 10 req-delay;',
      'and key-Down opens it at 12 rd. (=search-string was not yet queried)']
      .join(' '),
    () => {
      w = make({ initialValue: 'b', queryOptions: qoFT });
      clock.tick(50);
      _focus();
      _keyEsc();
      clock.tick(950);
      _listEx().should.equal(false);

      _keyDown();
      clock.tick(199);
      _listEx().should.equal(false);
      clock.tick(1);
      _listEx().should.equal(true);
    });


    it(['with q-idts, focus at 0.5 req-delay, and Esc at 1.5 req-delay:',
      'TheList stays closed at 10 req-delay (=TheList stays closed also when',
      'query-results for search-str arrive)']
      .join(' '),
    () => {
      w = make({ initialValue: 'b', queryOptions: qoFT });
      clock.tick(50);
      _focus();
      clock.tick(100);
      _keyEsc();  // At this time, it got fixedTerms, and asked for 'b' matches.
      clock.tick(850);
      _listEx().should.equal(false);  // Now it received & discarded 'b'-results.
    });


    it(['with q-idts, focus at 0.5 req-delay, and Esc at 2.5 req-delay:',
      'TheList stays closed at 10 req-delay (=TheList stays closed also when',
      'query-results for dictInfos arrive)']
      .join(' '),
    () => {
      w = make({ initialValue: 'b', queryOptions: qoFT });
      clock.tick(50);
      _focus();
      clock.tick(200);  // Here, it already made the query for dictInfos too.
      _keyEsc();
      clock.tick(750);
      _listEx().should.equal(false); // Even though it kept 'b'&dictInfo-results.

      // Extra test: it did not discard 'b'&dictInfo-results, but build TheList..
      _keyDown();    //.. for them, even though it stays closed, until key-Down.
      _listEx().should.equal(true);
    });


    it(['with q-idts, focus at 0.5, Esc at 0.5, (loads fixedTerms),',
      'and key-Down at 10: TheList only opens at 12 req-delay in total']
      .join(' '),
    () => {
      w = make({ initialValue: 'b', queryOptions: qoFT });
      clock.tick(50);
      _focus();
      _keyEsc();

      clock.tick(950);
      _listEx().should.equal(false);

      _keyDown();
      clock.tick(199);
      _listEx().should.equal(false);
      clock.tick(1);
      _listEx().should.equal(true);
    });


    it(['with q-idts, focus at 0.5, Esc at 0.5, (loads fixedTerms),',
      'key-Down at 10, Esc at 10.5 (discards searchStr query),',
      'key-Down at 20: TheList only opens at 22 req-delay']
      .join(' '),
    () => {
      w = make({ initialValue: 'b', queryOptions: qoFT });
      clock.tick(50);
      _focus();
      _keyEsc();

      clock.tick(950);
      _listEx().should.equal(false);
      _keyDown();

      clock.tick(50);
      _listEx().should.equal(false);
      _keyEsc();

      clock.tick(950);
      _keyDown();
      clock.tick(199);
      _listEx().should.equal(false);
      clock.tick(1);
      _listEx().should.equal(true);
    });


    it(['with q-idts, focus at 0.5, Esc at 0.5, (loads fixedTerms),',
      'key-Down at 10, Esc at 11.5 (does not discard match+dictInfo results),',
      'key-Down at 12: TheList opens immediately']
      .join(' '),
    () => {
      w = make({ initialValue: 'b', queryOptions: qoFT });
      clock.tick(50);
      _focus();
      _keyEsc();

      clock.tick(950);
      _listEx().should.equal(false);
      _keyDown();

      clock.tick(150);
      _listEx().should.equal(false);
      _keyEsc();

      clock.tick(50);
      _keyDown();
      _listEx().should.equal(true);
    });


    it(['with q-idts, focus at 0.5, (TheList opens), then change search-string',
      'at 10: it updates TheList\'s content only at 12 req-delays total']
      .join(' '),
    () => {
      w = make({initialValue: 'b', queryOptions: qoFT}, {}); // 4 match; no lit.
      clock.tick(50);
      _focus();

      clock.tick(950);
      _listLen().should.equal(4);
      _setInput('a');  // 2 entries will match now.

      clock.tick(199);
      _listLen().should.equal(4);
      clock.tick(1);
      _listLen().should.equal(2);
    });


    it(['with q-idts, focus at 0.5, (TheList opens), then change search-string',
      'at 10: it updates TheList\'s content only at 12 req-delays total;',
      '\n        even if all dictInfos were queried before, i.e. it requeries',
      'dictInfos and avoids cache-handling)']
      .join(' '),
    () => {
      w = make({initialValue: 'b', queryOptions: qoFT}, {}); // 4 match; no lit.
      clock.tick(50);
      _focus();

      clock.tick(950);
      _listLen().should.equal(4);
      _setInput('ab');  // A subset, of only one entry, will match now.

      clock.tick(199);
      _listLen().should.equal(4);
      clock.tick(1);
      _listLen().should.equal(1);
    });
  });



  describe('handles showing TheSpinner', () => {

    it('on closed TheList, and no focus: hides TheSpinner, ' +
       'and keeps it hidden at 10 request-delays', () => {
      w = make({ initialValue: 'ab' }, {});
      _spinner().exists().should.equal(false);
      clock.tick(1000);
      _spinner().exists().should.equal(false);
    });


    it('on closed TheList, and focus at 0.5: shows TheSpinner with \'list-clos' +
       'ed\' class, and hides it at 3 req-delay, when TheList appears', () => {
      w = make({ initialValue: 'ab', queryOptions: qoFT }, {});

      clock.tick(50);
      _focus();
      _spinner().exists().should.equal(true);
      _spinner().classes().should.contain('list-closed');

      clock.tick(249);
      _list   ().exists().should.equal(false);
      _spinner().exists().should.equal(true);

      clock.tick(1);
      _list   ().exists().should.equal(true);   // TheList is present, ..
      _spinner().exists().should.equal(false);  // .. and TheSpinner is gone.
    });


    it('on closed TheList, and focus at 0.5: shows TheSpinner, and hides it ' +
       'at 2 req-delay, also when there are no results and no TheList', () => {
      w = make({ initialValue: 'Q', queryOptions: qoFT }, {});

      clock.tick(50);
      _focus();
      _spinner().exists().should.equal(true);
      _spinner().classes().should.contain('list-closed');

      clock.tick(149);  // Just before search-str query answer arrives.
      _spinner().exists().should.equal(true);

      clock.tick(1);  // No dictInfo-query, so querying is finished at 200 ms.
      _list   ().exists().should.equal(false);
      _spinner().exists().should.equal(false);
    });


    it('on closed TheList, focus at 0, and Esc at 0.5: hides TheSpinner ' +
       'at 0.5, and keeps it hidden at 10 req-delay', () => {
      w = make({ initialValue: 'ab' }, {});
      _focus();

      clock.tick(50);
      _keyEsc();
      _spinner().exists().should.equal(false);

      clock.tick(950);
      _spinner().exists().should.equal(false);
    });


    it('on closed TheList, focus at 0, Esc at 0.5, key-Down at 10: then ' +
       'shows TheSpinner, and hides it at 12 when TheList appears', () => {
      w = make({ initialValue: 'ab' }, {});
      _focus();
      clock.tick(50);
      _keyEsc();
      clock.tick(950);
      _keyDown();

      _spinner().exists().should.equal(true);
      _spinner().classes().should.contain('list-closed');

      clock.tick(199);
      _spinner().exists().should.equal(true);
      clock.tick(1);
      _spinner().exists().should.equal(false);
    });


    it('on closed TheList, focus at 0, Esc at 0.5, key-Down at 10, Esc at 11.5' +
       ': then hides TheSpinner, and keeps it hidden at 20 req-delay', () => {
      w = make({ initialValue: 'ab' }, {});
      _focus();
      clock.tick(50);
      _keyEsc();
      clock.tick(950);
      _keyDown();
      clock.tick(150);
      _keyEsc();

      _spinner().exists().should.equal(false);

      clock.tick(850);
      _spinner().exists().should.equal(false);
    });


    it('on closed TheList, focus at 0, Esc at 0.5, key-Down at 10, Esc at 10.5' +
       ', key-Down at 20: shows TheSpinner until TheList appears at 22', () => {
      w = make({ initialValue: 'ab' }, {});
      _focus();
      clock.tick(50);
      _keyEsc();
      clock.tick(950);
      _keyDown();
      clock.tick(50);  // Esc while only querying for matches, ..
      _keyEsc();       // ..will abort querying for dictInfos, and discard data.

      clock.tick(950);
      _keyDown();
      _spinner().exists().should.equal(true);
      _spinner().classes().should.contain('list-closed');

      clock.tick(199);
      _spinner().exists().should.equal(true);
      clock.tick(1);
      _spinner().exists().should.equal(false);
    });


    it('on closed TheList, focus at 0, Esc at 0.5, key-Down at 10, Esc at 11.5' +
       ', key-Down at 11.8: shows TheSpinner until TheList appears at 12', () => {
      w = make({ initialValue: 'ab' }, {});
      _focus();
      clock.tick(50);
      _keyEsc();
      clock.tick(950);
      _keyDown();
      clock.tick(150);  // Esc while query for dictInfos, after getting matches,..
      _keyEsc();        // ..won't discard data: it makes TheList, though closed.

      clock.tick(30);
      _keyDown();
      _spinner().exists().should.equal(true);
      _spinner().classes().should.contain('list-closed');

      clock.tick(20);
      _spinner().exists().should.equal(false);
    });


    it('on open TheList, and change TheInput: shows TheSpinner without ' +
       '\'list-closed\' class; and when data arrives, hides TheSpinner', () => {
      w = make({ initialValue: 'b' }, {});
      _focus();
      clock.tick(300);
      _list   ().exists().should.equal(true);
      _spinner().exists().should.equal(false);

      _setInput('ab');
      _spinner().exists().should.equal(true);
      _spinner().classes().should .not .contain('list-closed');

      clock.tick(199);
      _spinner().exists().should.equal(true);
      clock.tick(1);
      _spinner().exists().should.equal(false);
    });


    it('on open TheList, Esc-closed, change TheInput: shows TheSpinner with ' +
       '\'list-closed\' class; and when data arrives, hides TheSpinner', () => {
      w = make({ initialValue: 'b' }, {});
      _focus();
      clock.tick(300);
      _keyEsc();
      _list   ().exists().should.equal(false);
      _spinner().exists().should.equal(false);

      _setInput('ab');
      _spinner().exists().should.equal(true);
      _spinner().classes().should.contain('list-closed');

      clock.tick(199);
      _spinner().exists().should.equal(true);
      clock.tick(1);
      _spinner().exists().should.equal(false);
    });
  });



  describe('further events and concurrent event handling', () => {

    it(['if list is open, then Esc-closed, then key-Up/-Down, Enter or Click',
      'immediately open TheList, i.e. it makes no request for new data']
      .join(' '),
    () => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);

      _keyEsc();
      _listEx().should.equal(false);
      _keyDown();
      _listEx().should.equal(true);

      _keyEsc();
      _listEx().should.equal(false);
      _keyUp();
      _listEx().should.equal(true);

      _keyEsc();
      _listEx().should.equal(false);
      _keyEnter();
      _listEx().should.equal(true);

      _keyEsc();
      _listEx().should.equal(false);
      _input().trigger('click', { button: 0 });
      _listEx().should.equal(true);
    });


    it(['if list is open, then closed after blur, then reopened after focus:',
      'it immediately opens TheList, i.e. it makes no request for new data']
      .join(' '),
    () => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);

      _blur();
      _listEx().should.equal(false);

      _focus();
      _listEx().should.equal(true);
    });


    it(['if list is open and stale (=new searchStr queried but awaiting',
      'result): key-Up/-Down, Enter and Click on TheInput have no effect']
      .join(' '),
    () => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);
      _keyDown();
      _itemXIsActive(1);
      _setInput('ab');
      _itemXIsActive(1);
      clock.tick(50);

      _keyDown();
      _itemXIsActive(1);

      _keyUp();
      _itemXIsActive(1);

      _keyEnter();
      _itemXIsActive(1);

      _input().trigger('click', { button: 0 });
      _itemXIsActive(1);

      // Extra test: Esc closes TheList.
      _keyEsc();
      _listEx().should.equal(false);
    });


    it(['if list is open and stale: Hover or Click on ListItem/Literal',
      'have no effect']
      .join(' '),
    cb => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);

      vueTick(() => {
        _itemPST(0).should.equal('bc');                          // Sanity test.
        _itemL().exists().should.equal(true);                    // Sanity test.

        _keyDown();
        w.emitted('item-active-change').length.should.equal(2);  // Sanity test.

        _setInput('ab');
        clock.tick(50);  // TheList is now stale. And it has a ListItemLiteral.

        _item(3).trigger('mousemove');  // --Here is where the real tests begin.
        _itemXIsActive(1);

        _item(3).trigger('click', { button: 0 });
        _itemXIsActive(1);

        _itemL().trigger('mousemove');
        _itemXIsActive(1);

        _itemL().trigger('click', { button: 0 });
        _itemXIsActive(1);

        w.emitted('item-active-change').length.should.equal(2); // No new emits.

        // Extra test: when the new result arrives, it is processed as normal.
        vueTick(() => {
          clock.tick(250);
          _listEx  ().should.equal(true);
          _itemPST(0).should.equal('ab');
          cb();
        });
      });
    });


    it(['if list is open, then typing #1, then #2, then results for #1',
      '(=old search-str) arrive: then TheList does not change yet,',
      'and actions on it have no effect']
      .join(' '),
    () => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);
      _itemPST(0).should.equal('bc');
      _keyDown();
      _itemXIsActive(1);

      _setInput('ab');  // Typing #1 (= a user types something new in TheInput).
      clock.tick(50);

      _setInput('a');   // Typing #2.

      clock.tick(199);  // Ignored results for 'ab' arrived already, but not..
      _itemPST(0).should.equal('bc');              // ..yet any results for 'a'.

      _keyDown();
      _itemXIsActive(1);
      _keyUp();
      _itemXIsActive(1);
      _keyEnter();
      _itemXIsActive(1);
      _input().trigger('click', { button: 0 });
      _itemXIsActive(1);
      _item(0).trigger('mousemove');
      _itemXIsActive(1);
      _item(0).trigger('click', { button: 0 });
      _itemXIsActive(1);

      // Extra test: it updates as normal when results for 'a' arrive
      clock.tick(1);  // Now results for 'a' arrived.
      _itemPST(0).should.equal('a');
      _itemXIsActive(0);  // It reset the active item to 1.
      _keyDown();
      _itemXIsActive(1);  // The not-stale TheList is responsive again.
    });


    it(['if list is open, then typing #1, then #2, then results for #2',
      '(=new search-str) arrive: then TheList changes; and no change when',
      'stale results for #1 arrive']
      .join(' '),
    () => {
      // Make a test-Dictionary that responds slower for string 'ab' only.
      // + Note: we can not make e.g. a `class DictSlowAB extends VsmDict..`,
      //   because it would generate a babel/webpack error (: 'Class constructor
      //   ... cannot be invoked without 'new').
      // So we hook our custom `getEntryMatchesForString()` differently:
      var dict2 = makeDictionary({ delay: 100 });
      var origFunc = dict2.getEntryMatchesForString.bind(dict2);
      dict2.getEntryMatchesForString = function(str, options, cb) {
        setTimeout(
          () => origFunc(str, options, cb),
          str == 'ab' ? 500: 0 ); // 'ab' is delayed 500ms more, so 600ms total.
      };

      // First test our test-Dictionary.
      var called = false;
      dict2.getEntryMatchesForString('bc', {}, () => called = true);
      clock.tick(99);
      called.should.equal(false);
      clock.tick(1);
      called.should.equal(true);
      called = false;
      dict2.getEntryMatchesForString('ab', {}, () => called = true);
      clock.tick(599);
      called.should.equal(false);
      clock.tick(1);  // After 500ms, getEntryMatchesForString() responds.
      called.should.equal(true);

      // Now run the real test.
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);
      _itemPST(0).should.equal('bc');
      _keyDown();
      _itemXIsActive(1);  // Let's call 'now': time 0.

      _setInput('ab');  // Typing #1. This will arrive at time 700 (0+600+100).
      clock.tick(50);

      _setInput('a');   // Typing #2. This will arrive at time 250 (50+100+100).
      clock.tick(50);

      clock.tick(149);  // Move to time 249. (Result #1 hasn't arrived yet).
      _itemPST(0).should.equal('bc');  // No change yet.
      _keyDown();
      _itemXIsActive(1);               // Key-down has no effect.

      clock.tick(1);    // Move to time 250: result #2 arrived first.
      _itemPST(0).should.equal('a');   // It changed item 1.
      _itemXIsActive(0);               // It reset the active item.
      _keyDown();
      _itemXIsActive(1);               // Key-down has effect again now.

      clock.tick(1000);  // Move beyond time 700, where result #1 has arrived.
      _itemPST(0).should.equal('a');   // Stale result #1 did not change item 1.
      _itemXIsActive(1);  // The not-stale TheList is responsive again.
    });


    it(['if list is stale (=open, and results are expected), then Esc-closed:',
      'TheList stays closed when results arrive']
      .join(' '),
    () => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);

      _setInput('ab');
      clock.tick(50);
      _keyEsc();
      _listEx().should.equal(false);

      clock.tick(1000);  // Go to past when the results arrive.
      _listEx().should.equal(false);
    });


    it(['if list is stale, then Esc-closed, then key-Up/-Down/Enter/Click:',
      'TheList stays closed, until results arrive']
      .join(' '),
    () => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);

      _setInput('ab');
      clock.tick(50);
      _keyEsc();
      _listEx().should.equal(false);

      // Note: now = still halfway waiting for query-result-for-'b',
      //       so the below open-actions will not abort that query process,
      //       and all new TheList-data will arrive at 200 ms total.
      _keyUp();  // The open-TheList actions have no immediate effect, ..
      _listEx().should.equal(false);
      _keyDown();
      _listEx().should.equal(false);
      _keyEnter();
      _listEx().should.equal(false);
      _input().trigger('click', { button: 0 });
      _listEx().should.equal(false);
      clock.tick(149);
      _listEx().should.equal(false);

      clock.tick(1);  // ..but open TheList as soon as the new data arrives.
      _listEx().should.equal(true);
    });


    it(['if list is stale, then Esc-closed, then pause, then open-action:',
      'TheList stays closed, until results arrive']
      .join(' '),
    () => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);

      _setInput('ab');
      clock.tick(50);
      _keyEsc();
      _listEx().should.equal(false);
      clock.tick(1000);
      _listEx().should.equal(false);

      // Note: now = beyond where query-result-for-'b' gets discarded (and also
      //       no subsequent query for dictInfos),
      //       so the below open-action will start a new query process.
      _keyDown();  // Test only this list-opening action.
      _listEx().should.equal(false);
      clock.tick(199);
      _listEx().should.equal(false);

      clock.tick(1);  // Data arrives at 200ms after key-Down.
      _listEx().should.equal(true);
    });


    it(['if list is stale, with item 1 not the active item, then Esc-closed,',
      'then key-Down: TheList opens when results arrive, with item 1 active']
      .join(' '),
    () => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);
      _keyDown();
      _keyDown();
      _itemXIsActive(2);

      _setInput('ab');
      clock.tick(50);
      _keyEsc();
      _listEx().should.equal(false);

      clock.tick(25);   // A key-Down before the 'ab'-results arrive, ..
      _keyDown();       // ..does not cause discarding of data, ..
      _listEx().should.equal(false);

      clock.tick(125);  // ..so results still arrive at 200ms total.
      _listEx().should.equal(true);
      _itemXIsActive(0);  // It reset the active ListItem to be the first one.
    });


    it(['if list is stale, then Esc-closed, then key-Up/-Down/Enter/Click,',
      'then Esc again: TheList stays closed when results arrive']
      .join(' '),
    () => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);

      _listEx().should.equal(true);
      _setInput('ab');
      clock.tick(50);
      _keyEsc();
      _listEx().should.equal(false);

      _keyUp();
      _keyDown();
      _keyEnter();
      _input().trigger('click', { button: 0 });
      _listEx().should.equal(false);

      clock.tick(50);
      _keyEsc();

      clock.tick(1000);  // Go to past when the results arrive.
      _listEx().should.equal(false);
    });


    it(['if list is stale, and blur closes it during the string-query:',
      'it stays closed; and on focus later on: requeries, then opens']
      .join(' '),
    () => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);

      _listEx().should.equal(true);
      _itemPST(0).should.equal('bc');
      _setInput('ab');
      clock.tick(50);
      _blur();
      _listEx().should.equal(false);

      clock.tick(1000);  // Go to past arrival and discarding of results.
      _listEx().should.equal(false);

      _focus();  // On focus after a stale-list blur: it does not reopen..
      clock.tick(199);         // ..until after querying&getting new data.
      _listEx().should.equal(false);
      clock.tick(1);
      _listEx().should.equal(true);    // and then opens with new content.
      _itemPST(0).should.equal('ab');  // ..with new content.
    });


    it(['if list is stale, and blur closes it during the dictInfo-query:',
      'it stays closed; and on focus after results arrive: immediately opens']
      .join(' '),
    () => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);

      _listEx().should.equal(true);
      _itemPST(0).should.equal('bc');
      _setInput('ab');
      clock.tick(150);
      _blur();
      _listEx().should.equal(false);

      clock.tick(1000);  // Go to past when the results arrive.
      _listEx().should.equal(false);

      _focus();
      _listEx().should.equal(true);    // It immediately opens, ..
      _itemPST(0).should.equal('ab');  // ..with new content.
    });


    it(['if open list gets Esc-closed, then typing: then TheList opens only',
      'when the new data arrives']
      .join(' '),
    () => {
      w = make({ initialValue: 'b' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);
      _keyEsc();
      _listEx().should.equal(false);

      _setInput('ab');
      clock.tick(199);
      _listEx().should.equal(false);
      clock.tick(1);
      _listEx().should.equal(true);
    });


    it(['if open list, then typing #1, then typing #2 to undo #1: this makes',
      'TheList not stale anymore, so an immediated Enter has effect.']
      .join(' '),
    () => {
      w = make({ initialValue: 'a' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);

      _setInput('ab');
      clock.tick(50);

      _setInput('a');
      _keyEnter();
      _listEx().should.equal(false);
      _emitSel().id.should.equal(e1.id);
    });


    it(['(resets after selecting an item:)',
      'on selecting item #2 with Enter: TheList closes;',
      '\n        then on key-Down: TheList opens only after 2 request-delays,',
      'makes item #1 active again, and emits `item-active-change` for it']
      .join(' '),
    () => {
      w = make({ initialValue: 'a' });
      _focus();
      clock.tick(300);
      _listEx().should.equal(true);

      _keyDown();         // Make item #2 the active one.
      _itemXIsActive(1);

      _keyEnter();        // Enter-select item #2.
      _listEx().should.equal(false);
      _emitSel().id.should.equal(e2.id);

      _keyDown();         // Ask to reopen the list. This will now requery.
      clock.tick(199);
      _listEx().should.equal(false);
      clock.tick(1);
      _listEx().should.equal(true);
      _itemXIsActive(0);  // TheList is open, with item #1 the active one again.

      _emitIAC(0).id.should.equal(e1.id);  // Initial change-event for item #1.
      _emitIAC(1).id.should.equal(e2.id);  // Item #2.
      _emitIAC(2)   .should.equal(false);  // Change-event after closing TheList.
      _emitIAC(3).id.should.equal(e1.id);  // Item #1.
    });


    it(['if changing prop `queryOptions.idts` before a 1st `loadFixedTerms()`',
      'call finishes: it waits until both call 1&2 finish, before quering data']
      .join(' '),
    () => {
      var dict2 = makeDictionary({ delay: 100 });
      w = make({
        queryOptions: { idts: [{ id: 'B:03' }] },  // -> `e5`.
        vsmDictionary: dict2
      });
      _focus();

      // Note: we must give an entirely new `queryOptions`-Object prop, not just
      // the same Object with changed subprop `.idts`. This is required for
      // Vue's change-detection to work (and it would throw an error otherwise).
      clock.tick(50);
      w.setProps({ queryOptions: { idts: [{ id: 'B:02' }] } });  // -> `e4`.

      // There is no TheList yet at 349ms total. So it did not query yet for
      // matches after the first `loadFixedTerms()`-call finished.
      clock.tick(299);
      _listEx () .should.equal(false);

      clock.tick(1);
      _listEx () .should.equal(true);
      _itemPST(0).should.equal('bcd');
      Object.keys(dict2.fixedTermsCache).length.should.equal(2);
    });


    it(['if fixedTerms loaded, and prop `queryOptions.idts` is changed',
      'during query #1 for \'\' (=>query #2 for \'\' with new `idts`):',
      'and #1 arrives before #2, then discards #1']
      .join(' '),
    () => {
      w = make({ queryOptions: { idts: [{ id: 'B:03' }] } });
      _focus();
      clock.tick(150);  // FixedTerms #1 loaded, and query #1 awaits result.

      w.setProps({ queryOptions: { idts: [{ id: 'B:02' }] } });

      clock.tick(299);
      _listEx().should.equal(false); // No TheList; results #1 have long arrived.

      clock.tick(1);
      _listEx().should.equal(true);     // List opens when results #2 arrive.
      _itemPST(0).should.equal('bcd');  // It shows `e4`.
    });


    it(['if fixedTerms loaded, and prop `queryOptions.idts` is changed',
      'during query #1 for \'\' (=>query #2 for \'\' with new `idts`):',
      'and #1 arrives after #2, then discards #1']
      .join(' '),
    () => {
      // Make a test-Dictionary that responds slower for queryOptions #2.
      var dict2 = makeDictionary({ delay: 100 });
      var origFunc = dict2.loadFixedTerms.bind(dict2);
      dict2.loadFixedTerms = function(idts, options, cb) {
        setTimeout(
          () => origFunc(idts, options, cb),
          idts[0].id == 'B:02' ? 500: 0 );  // Delay it 500ms more: 600ms total.
      };

      // First test our test-Dictionary.
      var called = false;
      dict2.loadFixedTerms([{ id: 'B:03' }], {}, () => called = true);
      clock.tick(99);
      called.should.equal(false);
      clock.tick(1);
      called.should.equal(true);
      called = false;
      dict2.loadFixedTerms([{ id: 'B:02' }], {}, () => called = true);
      clock.tick(599);
      called.should.equal(false);
      clock.tick(1);  // After 500ms, loadFixedTerms() responds.
      called.should.equal(true);

      // Now run the real test.
      w = make({ queryOptions: { idts: [{ id: 'B:03' }] } });  // Matches `e5`.
      _focus();
      clock.tick(150);  // FixedTerms #1 loaded, and query #1 awaits result.

      w.setProps({ queryOptions: { idts: [{ id: 'B:02' }] } });  // Matches `e4`.

      clock.tick(299);
      _listEx().should.equal(false);
      clock.tick(1);
      _listEx().should.equal(true);     // TheList open when result #2 arrives.
      _itemPST(0).should.equal('bcd');  // It shows `e4`.

      clock.tick(1000);  // Move beyond time 800, when result #1 has arrived too.
      _itemPST(0).should.equal('bcd');  // Stale result #1 did not change item 1.
    });
  });

});
