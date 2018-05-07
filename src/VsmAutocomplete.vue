<template>
  <div class="vsm-autocomplete">
    <the-input
      v-model="inputStr"
      :placeholder="placeholder"
      :autofocus="autofocus"
      :show-error="showError"
      @focus="onInputFocus"
      @blur="onInputBlur"
      @key-ctrl-enter="onKeyCtrlEnter"
      @key-up="onKeyUp"
      @key-down="onKeyDown"
      @key-esc="onKeyEsc"
      @key-enter="onKeyEnter"
      @key-bksp="onKeyBksp"
      @key-tab="onKeyTab"
      @click="onInputClick"
      @dblclick="onInputDblclick"
    />
    <the-list
      v-if="isListOpen"
      :search-str="activeSearchStr || ''"
      :items="matches"
      :max-string-lengths="sanitizedMaxStringLengths"
      :dict-infos="dictInfos"
      :has-item-literal="hasItemLiteral"
      :item-literal-content="itemLiteralContent"
      :active-index="activeIndex"
      :vsm-dictionary="vsmDictionary"
      @item-hover="onItemHover"
      @item-click="onItemClick"
    />
    <the-spinner
      v-if="isSpinnerShown"
      :class="{ 'list-closed': !isListOpen }"
    />
  </div>
</template>


<script>
import TheInput from './subcomponents/TheInput.vue';
import TheList from './subcomponents/TheList.vue';
import TheSpinner from './subcomponents/TheSpinner.vue';
import stringCodeConvert from './stringCodeConvert.js';

export default {
  name: 'VsmAutocomplete',

  components: {
    TheInput,
    TheList,
    TheSpinner
  },

  props: {
    vsmDictionary: {
      type: Object,  // This allows 'class' too.
      required: true
    },
    autofocus: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: [String, Boolean],  // When false, no placeholder text is added.
      default: false
    },
    initialValue: {
      type: String,
      default: ''
    },
    queryOptions: {
      type: Object,
      default: () => ({
        perPage: 20  // (includes S/T-type items only, not N/R/F/G/literal ones).
      })
    },
    maxStringLengths: {  // Limits the length of matches's `str` and `descr`..
      type: Object,      // ..strings, in number of characters.
      default: () => ({
        str: 40,
        strAndDescr: 70  // Max length of a trimmed-`str` plus its `descr`.
      })
    },
    itemLiteralContent: {
      type: [Function, Boolean],  // `function(searchStr) {}`, or `false`.
      default: false              // If false, the default item-literal is used.
    }
  },


  data: function() { return ({
    inputStr: this.initialValue, // (1/3): This holds TheInput's current content.
    activeSearchStr: false,  // (3/3): This resulted in currently shown TheList.
    fixedTermsLoaded: false,
    showError: false,
    mayListOpen: false,  // Is `true` when loading, before receiving list-data.
    listClosedHard: false,  // Helps keep list closed on refocus after Esc-press.
    matches: [],   // The list of currently shown match-objects.
    dictInfos: {}, // DictID-key-based Map of dictInfos that appear in `matches`.
    activeIndex: 0
  }); },


  computed: {
    searchStr() {  // (2/3): This is a trimmed version of `inputStr`.
      return this.inputStr.trim();
    },
    hasItemLiteral() {
      // TheList only gets a special 'item-literal' at the end,
      // if this vsm-autocomplete got an attached 'item-literal-select'-listener,
      // and if the search-string currently associated with TheList is not empty.
      return this.$listeners && this.$listeners['item-literal-select']
        && !!this.activeSearchStr;  // ('!!': in order to return a Boolean).
    },

    listLength() { // The nr. of matchObject-items, plus a possible item-literal.
      return this.matches.length + (this.hasItemLiteral ? 1 : 0);
    },

    isListOpen() {  // Determines the current visibility of TheList.
      return this.mayListOpen  &&  this.listLength > 0; // Length incls item-lit.
    },

    isListStale() {  // Helps prevent actions on a list that'll be replaced soon.
      return this.searchStr !== this.activeSearchStr;
    },

    isSpinnerShown() {
      return this.mayListOpen && this.isListStale;  // Part 2 is true at start.
    },

    hasKeyTabListener() {
      return this.$listeners && this.$listeners['key-tab'];
    },

    hasItemActiveListener() {
      return this.$listeners && this.$listeners['item-active-change'];
    },


    /**
     * We maintain this only for `watch`ing (below) when the active item changes.
     * + The active item is: 1) either none (if TheList is closed), 2) or the
     *   item-literal, 3) or a normal item (representing a match-object).
     * + Ideally, we could represent 'no item' as `false`,
     *   item-literal as a String, and a normal item as an Object.
     * + But Vue has trouble with deep-watching changes on these three.
     * + So, we represent 'no item' as `false`, and the other two as a String.
     *   + The item-literal is represented by '-' + the active search-string.
     *     + The '-' helps to distinguish it from a normal items String.
     *   + A normal item is repr. by its list-index + the matchObj's id + str.
     *     + The list-index enables us to easily access the full match-object,
     *       in the `watch` below.
     *     + The id+str enables Vue to detect a change, even if the list-index
     *       would stay 0 while TheList's content changes.
     */
    activeItemKey() {
      if (!this.hasItemActiveListener)  return;  // Only calc. this if needed.

      if (!this.isListOpen) {
        return false;  // -> No active item.
      }
      else if (this.hasItemLiteral && this.activeIndex == this.listLength - 1) {
        return '-' + this.activeSearchStr;  // -> The item-literal.
      }
      else {  // -> A normal item.
        var match = this.matches[this.activeIndex];
        return this.activeIndex + ',' +  match.id + match.str;
      }
    },

    sanitizedMaxStringLengths() {  // Fills in missing `maxStringLengths`-props.
      var max = Number.POSITIVE_INFINITY;
      return Object.assign(
        { str: max, strAndDescr: max }, this.maxStringLengths);
    },
  },


  watch: {
    searchStr: function() {  // A change-watcher is more precise..
      this.onInputChange();  // ..than listening to TheInput's '@input' event.
      this.$emit('input-change', this.searchStr);  // Also note: not `inputStr`.
    },
    isListOpen: function(value) {
      this.$emit('list-' + (value ? 'open' : 'close'));
    },
    activeItemKey: function(key) {
      // See the computed property's comment (above), for what different values
      // of `key` mean.  Here we translate this `key` in order to emit values:
      // - No item => false
      // - Item-literal => its literal String.
      // - Normal item => its full match-Object.
      this.$emit('item-active-change',
        !key ? false :
          key.startsWith('-') ? key.substr(1) :
            this.matches[ +key.replace(/^(\d+),.*$/, '$1') ] // (Extracts index).
      );
    }
  },


  mounted: function() {
    this.loadFixedTermsMaybe(
      () => {
        // Ignore any fixed-term loading errors. So no `err` argument.
        // Because they would be available as normal match-objects anyway.
        ///DEBUG//console.log('FT');
        this.fixedTermsLoaded = true;
        this.requestListDataMaybe();  // In case we already need to show TheList.
      }
    );
  },


  methods: {
    loadFixedTermsMaybe(cb) {  // Preloads data for fixedTerms, if any are given.
      if (this.queryOptions.idts) {
        this.vsmDictionary.loadFixedTerms(
          this.queryOptions.idts, this.queryOptions, cb);
      }
      else cb(null);
    },

    onInputChange() {
      if (!this.isListOpen)  this.resetList();  // Prevent flashing old results.
      this.openList();
    },

    onKeyCtrlEnter() {
      this.inputStr = stringCodeConvert(this.inputStr);
    },

    onInputFocus() {  // Opens the list on initial focus; but not later, after..
      this.openList(false);  // .. user-interaction had already closed the list.
      this.$emit('focus');
    },
    onInputBlur() {
      ///// Prevent list-open after initial focus, if blurred before gotten data.
      ///if (!this.isListOpen) this.closeList(false);
      this.closeList(false);
      this.$emit('blur');
    },

    openList(openHard = true) {  // This only tells that TheList *may* open now.
      // Don't open for a focus-event after the user manually(='hard')-closed it.
      if (this.listClosedHard && !openHard)  return;  // " .
      this.listClosedHard = false;                    // " .
      this.mayListOpen = true;
      this.requestListDataMaybe();  // Request data when ready. After that, open.
    },
    closeList(closeHard = true) {
      this.mayListOpen = false;
      if (closeHard)  this.listClosedHard = true;
    },
    resetList() {
      this.matches = [];
      this.activeIndex = 0;
      this.activeSearchStr = false;
    },

    /**
     * This function (in cooperation with its callers) manages three conditions
     * before really calling `requestListData()`:
     * 1. No matter what, always postpone requesting list-data, until fixedTerms
     *    are loaded.  And when the fixedTerms arrive, then request list-data
     *    if the user is waiting for it.
     * 2. When TheInput reports a 'focus' event, it should request list-data
     *    for the current searchStr, as soon as fixedTerm-loading is done.
     *     + (Note: a request for the empty string can still return fixedTerms!)
     * 3. Only request new list-data, if none was loaded yet or after
     *    the TheInput's `searchStr` changed.
     */
    requestListDataMaybe() {
      if (this.fixedTermsLoaded &&  // -> Ensures that fixedTerms are available.
          this.mayListOpen &&   // -> Only requests data when the user needs it.
          this.isListStale  // -> True at mount and on input.
      ) {
        this.requestListData();
      }
    },

    requestListData() {
      ///DEBUG//console.log(this.searchStr, '->');
      this.vsmDictionary.getMatchesForString(
        this.searchStr,
        this.queryOptions,
        this.newMatchesArrived.bind(this, this.searchStr)
      );
    },

    newMatchesArrived(queryStr, err, res) {
      // Don't show matches that came in too late.
      if (queryStr !== this.searchStr  ||  !this.mayListOpen)  return;
      ///DEBUG//console.log(queryStr, this.searchStr);

      var matches = err ? [] : res.items;
      var next = this.newDictInfosArrived.bind(this, queryStr, matches);

      if (err)  return next(err);  // On error, skip getting DictInfos.

      // 'Step 2': Get `dictInfos` for all dictIDs that appear in the match-objs.
      var dictIDs = [...new Set(matches.map(m => m.dictID))];  // Deduplicate.
      if (!dictIDs.length)  return next(null, { items: [] });
      this.vsmDictionary.getDictInfos({ filter: { id: dictIDs } }, next);
    },

    newDictInfosArrived(queryStr, matches, err, res) {
      if (queryStr !== this.searchStr  ||  !this.mayListOpen)  return;
      ///DEBUG//console.log(queryStr, matches.length);

      if (!err) {
        // - We convert the result Array to an easier-to-use,
        //   dictID-key based Map.
        // - But first, add any extra dictInfos from VsmDictionary.
        //   (The child class's results may still override these afterwards).
        this.dictInfos = {};
        [this.vsmDictionary.getExtraDictInfos(), res.items] .forEach(arr => {
          this.dictInfos = arr.reduce((dictInfos, dictInfo) => {
            dictInfos[dictInfo.id] = dictInfo;
            return dictInfos;
          }, this.dictInfos);
        });
      }

      // Reset activeIndex, but only if we got matches for a different searchStr
      // than for which TheList is currently shown.
      if (this.isListStale)  this.activeIndex = 0;

      this.matches = err ? [] : matches;  // This updates TheList.
      this.activeSearchStr = queryStr;    // This stops TheSpinner.

      this.showError = !!err;
    },

    onKeyUp() {
      if (this.isListOpen) {
        if (!this.isListStale) {
          this.activeIndex--;
          if (this.activeIndex < 0)  this.activeIndex = this.listLength - 1;
        }
      }
      this.openList();
    },

    onKeyDown() {
      if (this.isListOpen) {
        if (!this.isListStale) {
          this.activeIndex++;
          if (this.activeIndex >= this.listLength)  this.activeIndex = 0;
        }
      }
      this.openList();
    },

    onKeyEsc() {
      if (!this.isListOpen) { // Only emit 'Esc-press' if list is closed already.
        this.$emit('key-esc');
      }
      this.closeList(); // Also prevents reopening on any late-incoming listdata.
    },

    onKeyEnter() {
      if (!this.isListOpen)  return this.openList();
      this.selectItem(this.activeIndex);
    },

    onKeyBksp() {
      if (!this.inputStr) {
        this.$emit('key-bksp');
        this.closeList();
      }
    },

    onKeyTab(modifierKey, event) {
      // Only if a 'key-tab' listener is attached, do we emit this event
      // _and_ do we prevent letting the focus move away from TheInput.
      // Because a key-tab-listener means that custom code controls the Tab.
      if (this.hasKeyTabListener) {
        this.$emit('key-tab', modifierKey);
        event.preventDefault();
      }
    },

    onInputClick() {
      this.openList();
    },
    onInputDblclick() {
      this.closeList();
      this.$emit('double-click');
    },

    onItemHover(index) {
      if (!this.isListStale)  this.activeIndex = index;
    },
    onItemClick(index) {
      this.selectItem(index);
    },

    selectItem(index) {
      if (this.isListStale)  return; // No action on a list that'll be replaced.
      this.closeList();

      if (this.hasItemLiteral  &&  index == this.listLength - 1) {
        this.$emit('item-literal-select', this.searchStr);
      }
      else {
        this.$emit('item-select', this.matches[index]);
      }

      this.resetList();
    }
  }
};
</script>


<style scoped>
  .vsm-autocomplete {
    overflow: hidden;
    font-size: 11px;
  }
  .vsm-autocomplete,
  .input {
    font-family: "lucida grande", tahoma, verdana, arial, sans-serif;
  }
</style>
