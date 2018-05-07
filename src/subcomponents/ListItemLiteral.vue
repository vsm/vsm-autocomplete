<template>
  <div
    v-if="itemLiteralContent"
    @mousemove="onHover"
    @mousedown.left.exact.prevent="onMousedown"
    @click.left.exact="onClick"
    v-html="itemLiteralContent(searchStrTrimmed)"
  />
  <div
    v-else
    :title="`Search for '${searchStr}'`"
    @mousemove="onHover"
    @mousedown.left.exact.prevent="onMousedown"
    @click.left.exact="onClick"
  >{{ searchStrTrimmed }}<span class="triangle">▸</span>
  </div>
</template>


<script>
import stringTrim from './stringTrim.js';


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
    itemLiteralContent: {
      type: [Function, Boolean],
      default: false
    }
  },

  computed: {
    searchStrTrimmed() {
      return stringTrim(this.searchStr, this.maxStringLengths.str);
    }
  },

  methods: {
    onHover()     { this.$emit('hover', this.index) },
    onMousedown() { this.$emit('hover', this.index) },  // Ensure 'hover' b4 clk.
    onClick()     { this.$emit('click', this.index) }
  }
};
</script>


<style scoped>
  .item-type-literal {
    padding-left: 11px;
    font-weight: bold;
  }
  .item:not(.item-state-active).item-type-literal {
    color: #3b5998;
  }
  .triangle {
    margin-left: 4px;
  }
</style>
