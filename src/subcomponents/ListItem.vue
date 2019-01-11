<template>
  <div
    @mousemove="onHover"
    @mousedown.left.exact.prevent="onMousedown"
    @click.left.exact="onClick"
  >
    <span
      :title="strs.strTitle"
      class="item-part-str"
      v-html="strs.str"
    />
    <span
      v-if="!!strs.descr"
      :title="strs.descrTitle"
      class="item-part-descr"
      v-html="strs.descr"
    />
    <span
      v-if="!!strs.info"
      :title="strs.infoTitle"
      class="item-part-info"
      v-html="strs.info"
    />
    <span
      v-if="!!strs.extra"
      class="item-part-extra"
      v-html="strs.extra"
    />
  </div>
</template>


<script>
import stringStyleHtml from 'string-style-html';
import stringTrim from './stringTrim.js';
import sanitizeHtml from './sanitizeHtml.js';


export default {
  name: 'ListItem',

  props: {
    searchStr: {  // Only used by a `customItem()` function.
      type: String,
      default: ''
    },
    index: {
      type: Number,
      default: 0
    },
    item: {
      type: Object, // The given item is a match-object, see vsm-dictionary spec.
      required: true
    },
    maxStringLengths: {
      type: Object,
      required: true
    },
    queryOptions: {
      type: Object,
      default: () => ({})
    },
    customItem: {
      type: [Function, Boolean],
      default: false
    },
    dictInfo: {
      type: Object,
      default: undefined
    },
    vsmDictionary: {
      type: Object,
      default: () => ({})
    }
  },

  computed: {
    isNumberItem() {
      // Note: a number-string could also be returned as a non-'N'-type match,
      // if found in an existing subdictionary instead of being generated
      // by the VsmDictionary parent class.
      return this.item.type == 'N'  ||  (
        this.vsmDictionary  &&  this.vsmDictionary.numberMatchConfig  &&
        this.item.dictID == this.vsmDictionary.numberMatchConfig.dictID
      );
    },

    strs() {
      // 1.) `str`.
      var strOrig = this.item.str || '';

      var str =  stringStyleHtml(
        stringTrim(strOrig, this.maxStringLengths.str),
        this.item.style
      );
      var strOrigTooLong = strOrig.length > this.maxStringLengths.str;
      var strTitle = strOrigTooLong ? strOrig : '';

      var strTrimmedLen = Math.min(strOrig.length, this.maxStringLengths.str);

      // 2.) `descr`.
      var descrOrig = this.item.descr || '';

      var descr =  stringTrim(descrOrig,
        this.maxStringLengths.strAndDescr - strTrimmedLen
      );

      var descrOrigTooLong = strTrimmedLen + descrOrig.length >
        this.maxStringLengths.strAndDescr;
      var descrTitle = descrOrigTooLong ? descrOrig : '';

      // 3.) `info`.
      var info =
        this.isNumberItem ? this.uriTail(this.item.id) :
          this.item.type == 'R' ? '' :
            ( (this.dictInfo || {}).abbrev  ||  this.uriTail(this.item.dictID) );

      if (this.isNumberItem) {  // Remove prefix (e.g. '00:') of Number-IDs.
        var prefix =
          (this.vsmDictionary && this.vsmDictionary.numberMatchConfig) ?
            this.vsmDictionary.numberMatchConfig.conceptIDPrefix : '';
        info = info.replace(prefix, '');
      }

      var infoTitle = this.uriTail(this.item.id) +
        (this.dictInfo && this.dictInfo.name ?
          ` in ${ this.dictInfo.name }` : '');

      // 4.) `str`, `descr`, `info`, and `extra`; and their title-attributes.
      // Note: all `strs`-props are Strings, never false/undefined.
      var strs = {
        str, strTitle,
        descr, descrTitle,
        info, infoTitle,
        extra: ''
      };

      if (this.customItem)  strs = this.customItem({
        item: this.item,  searchStr: this.searchStr,
        maxStringLengths: this.maxStringLengths, queryOptions: this.queryOptions,
        dictInfo: this.dictInfo,  vsmDictionary: this.vsmDictionary,  strs
      });

      // Now we can make empty title-attrs `false`, so Vue won't add them.
      // Note: _Vue_ already sanitizes `:title`-attrs, by HTML-encoding quotes.
      if (!strs.strTitle  )  strs.strTitle   = false;
      if (!strs.descrTitle)  strs.descrTitle = false;
      if (!strs.infoTitle )  strs.infoTitle  = false;

      strs.str   = sanitizeHtml(strs.str);
      strs.descr = !strs.descr ? false :
        sanitizeHtml(
          this.isNumberItem ||  this.item.type == 'R' ?
            '[' + strs.descr + ']' : '(' + strs.descr + ')'
        );
      strs.info  = !strs.info  ? false : sanitizeHtml('(' + strs.info + ')');
      strs.extra = !strs.extra ? false : sanitizeHtml(strs.extra);

      return strs;
    }
  },

  methods: {
    onHover()     { this.$emit('hover', this.index) },
    onMousedown() { this.$emit('hover', this.index) },  // Ensure 'hover' b4 clk.
    onClick()     { this.$emit('click', this.index) },

    uriTail(s) {  // E.g. 'http://x.org/sub/DICT1' -> 'DICT1'.
      return (s || '').replace(/^.*\/([^/]*)$/,'$1');
    }
  }
};

</script>


<style scoped>
  .item-part-str {
    font-weight: bold;
  }
  .item-part-descr {
    padding-left: 4px;
  }
  .item-part-info {
    padding-left: 5px;
  }
  .item-part-extra {
    padding-left: 4px;
  }

  /* These `not:`-selectors will leave the item's text white when it's active */
  .item:not(.item-state-active) > .item-part-str {
    color: #3b5998;
  }
  .item:not(.item-state-active) > .item-part-descr {
    color: #222;
  }
  .item:not(.item-state-active) > .item-part-info {
    color: #aaa;
  }
</style>
