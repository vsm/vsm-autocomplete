<template>
  <div
    :title="strs.strTitle"
    @mousemove="onHover"
    @mousedown.left.exact.prevent="onMousedown"
    @click.left.exact="onClick"
    v-html="strs.str"
  />
</template>


<script>
import stringTrim from './stringTrim.js';
import sanitizeHtml from './sanitizeHtml.js';


export default {
  name: 'ListItemLiteral',

  props: {
    searchStr: {
      type: String,
      default: ''
    },
    index: {
      type: Number,
      default: 0
    },
    maxStringLengths: {
      type: Object,
      required: true
    },
    customItemLiteral: {
      type: [Function, Boolean],
      default: false
    }
  },

  computed: {
    strs() {
      var strs = {
        str: stringTrim(this.searchStr, this.maxStringLengths.str),
        strTitle: `Search for '${ this.searchStr }'`
      };

      if (this.customItemLiteral)  strs = this.customItemLiteral({
        searchStr: this.searchStr,  maxStringLengths: this.maxStringLengths,
        strs
      });

      strs.str = sanitizeHtml(strs.str);
      return strs;
    }
  },

  methods: {
    onHover()     { this.$emit('hover', this.index) },
    onMousedown() { this.$emit('hover', this.index) },  // Ensure 'hover' b4 clk.
    onClick()     { this.$emit('click', this.index) },
  }
};
</script>


<style scoped>
  .item-type-literal {
    padding-left: 11px;
    font-weight: bold;
  }
  .item.item-type-literal {
    color: #929292;
  }
  .item-type-literal::after {
    margin-left: 4px;
    content: "▸";
  }
</style>
