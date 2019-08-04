<template>
  <div class="input-and-label">
    <input
      ref="input"
      v-model="str"
      :autofocus="autofocus"
      :class="['input', {
        'error': showError
      }]"
      spellcheck="false"
      @focus="onFocus"
      @blur="onBlur"
      @keydown.up.exact="onKeyUp"
      @keydown.down.exact="onKeyDown"
      @keydown.esc.exact.prevent="onKeyEsc"
      @keydown.enter.exact="onKeyEnter"
      @keydown.8.exact="onKeyBksp"
      @keydown.tab.exact="onKeyTab"
      @keydown.tab.shift.exact="onKeyShiftTab"
      @keydown.enter.ctrl.exact="onKeyCtrlEnter"
      @keydown.enter.shift.exact="onKeyShiftEnter"
      @click.left.exact="onClick"
      @dblclick.left.exact="onDblclick"
    >
    <span
      :class="['label', {
        'focus': hasFocus,
        'hidden': !showPlaceholder
      }]"
    >{{ placeholder || '' }}</span>
  </div>
</template>


<script>
/*
  The content of our '<input>' element is made accessible to the
  parent component VsmAutocomplete, via two-way binding.

  But because this 'TheInput' component adds a layer in between them,
  (i.e.: VsmAutocomplete <--> TheInput <--> <input>),
  this TheInput has to mediate by connecting these two two-way-bindings:

  - TheInput uses the variable `str`, bound to the <input>'s `v-model`,
    which is already two-way bound. So that's OK.
  - It also uses the prop `value`, which is the default prop that is linked to
    the `v-model` that the parent component uses for two-way communication
    with this TheInput component.
    + (Note that props on TheInput shouldn't be changed from inside TheInput, so
      we can't directly use `value` for the input v-model. Or Vue gives warnings).

  So we manage the `value` <--> `str` connection explicitly:
  - in `data`:    prop `value`'s initial value goes into `str`;
  - in `watch`:   if prop `value` would ever change, then we update `str` too.
  - in `methods`: if `str` changes, we `$emit()` an 'input' event,
    to make the parent's v-model's `value` get automatically updated
    with the input's value too.
*/
export default {
  name: 'TheInput',

  props: {
    placeholder: {
      type: [String, Boolean],
      default: false
    },
    autofocus: {
      type: Boolean,
      default: false
    },
    showError: {
      type: Boolean,
      default: false
    },
    value: {
      type: String,
      default: ''
    }
  },

  data: function() {
    return ({
      input: null,
      str: this.value,  // This places an initial string in '<input>'.
      hasFocus: false
    });
  },

  computed: {
    showPlaceholder() {
      return this.placeholder && !this.str;
    }
  },

  watch: {
    value: function(newVal) {
      this.str = newVal;
    },

    str: function(newVal) {
      this.$emit('input', newVal);  // Makes the component work with v-model.
    }
  },

  mounted: function() {
    this.input = this.$refs.input;
  },

  methods: {
    onFocus() {
      this.cursorToEnd();
      this.hasFocus = true;
      this.$emit('focus');
    },

    onBlur() {
      this.hasFocus = false;
      this.$emit('blur');
    },

    cursorToEnd() {
      setTimeout(() => {                          // Un-select the input text:
        this.input.selectionStart = this.input.selectionEnd = this.str.length;
      }, 0);  // `setTimeout` makes it work with Tab / Shift-Tab too.
    },

    onKeyUp   () { this.$emit('key-up'   ) },
    onKeyDown () { this.$emit('key-down' ) },
    onKeyEsc  () { this.$emit('key-esc'  ) },
    onKeyEnter() { this.$emit('key-enter') },
    onKeyBksp    (event) { this.$emit('key-bksp',         event) },
    onKeyTab     (event) { this.$emit('key-tab', '',      event) },
    onKeyShiftTab(event) { this.$emit('key-tab', 'shift', event) },
    onKeyCtrlEnter()     { this.$emit('key-ctrl-enter') },
    onKeyShiftEnter()    { this.$emit('key-shift-enter') },

    onClick() {
      this.hasFocus = true;
      this.$emit('click');
    },

    onDblclick() {
      this.cursorToEnd();
      this.hasFocus = true;
      this.$emit('dblclick');
    }
  }
};
</script>


<style scoped>
  .input-and-label {
    position: relative;
  }
  .input-and-label,
  .input {  /* The $-marked ones undo the automatic 'user agent stylesheets' */
    width: 100%;
    height: 100%;
    padding: 0;        /* $ */
    font: inherit;     /* $ */
    font-size: 13px;   /* Larger than the ListItems. */
    color: #000;
    cursor: text;
    background-color: #fff;
    border: 0;         /* $ */
    outline: none;     /* $ */
    box-shadow: none;  /* $ */
  }
  .label {
    position: absolute;
    top: 0;
    left: 0;
    color: #aaa;
    pointer-events: none;
    transition: 0.2s ease all;
  }
  .label.focus {
    top: -2px;
    left: 2px;
    font-size: 10px;
    color: #ccc;
    opacity: 1;
  }
  .label.hidden {
    display: none;
  }
  .error {
    background-color: #ffe8e8;
  }
</style>
