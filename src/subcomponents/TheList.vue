<template>
  <div
    class="list"
    @mousedown.left.exact.prevent="x => x"
    @click.left.exact="onClick"
  >
    <!-- Here we add the css-style that determines items' background; while
         in `ListItem`, we add css that determines their text-color/etc -->
    <list-item
      v-for="(item, index) in items"
      :search-str="searchStr"
      :index="index"
      :item="item"
      :key="item.id + item.str"
      :max-string-lengths="maxStringLengths"
      :query-options="queryOptions"
      :custom-item="customItem"
      :dict-info="dictInfos[item.dictID]"
      :vsm-dictionary="vsmDictionary"
      :class="[
        'item',
        {
          'item-pos-first': index == 0,
          'item-pos-last': index == items.length - 1,
          'item-type-number': item.type == 'N',
          'item-type-ref': item.type == 'R',
          'item-type-fixed': item.type == 'F' || item.type == 'G',
          'item-type-fixed-last': index == indexLastFixedItem,
          'item-state-active': isActive(index)
        }
      ]"
      unselectable="on"
      @hover="onItemHover"
      @click="onItemClick"
    />
    <!-- The literal item is not part of `items` (=returned by VsmDictionary) -->
    <list-item-literal
      v-if="hasItemLiteral"
      :search-str="searchStr"
      :index="items.length"
      :max-string-lengths="maxStringLengths"
      :custom-item-literal="customItemLiteral"
      :class="[
        'item',
        'item-type-literal',
        { 'item-state-active': isActive(items.length) }
      ]"
      unselectable="on"
      @hover="onItemHover"
      @click="onItemClick"
    />
  </div>
</template>


<script>
import ListItem from './ListItem.vue';
import ListItemLiteral from './ListItemLiteral.vue';

export default {
  name: 'TheList',

  components: {
    ListItem,
    ListItemLiteral
  },

  props: {
    searchStr: {
      type: String,
      default: ''
    },
    items: {
      type: Array,
      required: true
    },
    maxStringLengths: {  // Default value is defined in VsmAutocomplete.vue.
      type: Object,
      required: true
    },
    queryOptions: {
      type: Object,
      default: () => ({})
    },
    // Note: TheList receives `dictInfos` as an ID-based Map, {id: {id:, name:}},
    // not as an Array that is returned by a VsmDictionary.
    dictInfos: {
      type: Object,
      required: true
    },
    hasItemLiteral: {
      type: Boolean,
      default: false
    },
    customItemLiteral: {
      type: [Function, Boolean],
      default: false
    },
    customItem: {
      type: [Function, Boolean],
      default: false
    },
    activeIndex: {
      type: Number,
      default: 0
    },
    vsmDictionary: {
      type: Object,
      default: () => ({})
    }
  },

  computed: {
    indexLastFixedItem() {
      return this.items.reduce((index, item, i) =>
        item.type == 'F' || item.type == 'G' ? i : index,  -1);
    }
  },

  methods: {
    isActive(index) {
      return index == this.activeIndex;
    },

    /**
     * Handles clicks on TheList itself, e.g. on the space between the
     * last ListItem and the ListItemLiteral.
     */
    onClick() {
      this.onItemClick(this.activeIndex);
    },

    onItemHover(index) { this.$emit('item-hover', index) },
    onItemClick(index) { this.$emit('item-click', index) }
  }
};
</script>


<style scoped>
  .list {
    position: absolute;
    z-index: 2;
    display: block;
    min-width: 320px;
    margin: 4px 0 0 -4px;
    line-height: 14px;  /* Prevents special chars from making ListItems higher. */
    cursor: default;
    background-color: #fff;
    border: 1px solid #c4c4c4;
  }
  .item {
    padding: 2px 3px 3px 4px;
    -moz-user-select: none;
    -khtml-user-select: none;
    -webkit-user-select: none;
    -o-user-select: none;
    -ms-user-select: none;
    user-select: none;
    border: 0 solid #fff;
    border-width: 1px 0;
  }

  .item-pos-first {
    margin-top: 2px;
  }
  .item-pos-last {
    margin-bottom: 2px;
  }

  .item-type-number,
  .item-type-ref,
  .item-type-fixed,
  .item-type-fixed-last {
    background-color: #f4f4f4;
    border-color: #f4f4f4;
  }
  .item-type-number,
  .item-type-ref,
  .item-type-fixed-last {
    border-bottom-color: #ddd;
  }
  .item-type-literal {
    background-color: #f2f2f2;
    border-top-color: #ddd;
    border-bottom-color: #f2f2f2;
  }

  .item-state-active {
    background-color: #e3e8f3;
    border-color: #ced6ea;
  }

  .item-type-literal.item-state-active {
    background-color: #dce3f0;
    border-top-color: #c9d1e7;
    border-bottom-color: #dce3f0;
  }
</style>
