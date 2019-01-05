# vsm-autocomplete


<br>

## Intro

`vsm-autocomplete` is a web-page component for looking up **terms** that are
**linked to identifiers**. These are fetched from a given
[`vsm-dictionary`](https://github.com/vsmjs/vsm-dictionary).

Its main purpose is to be a subcomponent of
[`vsm-box`](https://github.com/vsmjs/vsm-box).
But it can also be used in other applications that need an input-field
with term+ID lookup.


<br>

## Main functionality

+ `vsm-autocomplete` is a [Vue.js](https://vuejs.org/)-based
  **input field component**,
  that a web&nbsp;developer can embed inside one of these:
  - A larger Vue component. This is the use-case of
    [`vsm-box`](https://github.com/vsmjs/vsm-box).
  - A project that bundles it with a particular vsm-dictionary.  
    E.g. one could make:
    `vsm-autocomplete` + `vsm-dictionary-bioportal` (to-develop) + a webpack
    [setup](https://github.com/stcruy/building-a-reusable-vue-web-component),  
    to create a standalone web-component: `vsm-autocomplete-bioportal`.
  - A full Vue application.<br><br>
+ It makes a _new HTML-tag_ available: '`<vsm-autocomplete>`', which
  requires at least a '`vsm-dictionary="..."`' attribute.  
  This attribute points to an object of type 'VsmDictionary', which is
  an interface module that connects to a particular database server,
  in order to get terms and identifiers. 
  The particular interface module could query e.g.
  [BioPortal](https://bioportal.bioontology.org/ontologies)
  or [PubDictionaries](http://pubdictionaries.org/).<br><br>
+ When a user starts typing, the component queries the vsm-dictionary for
  matching terms,  
  and shows them in a **selection panel** underneath the input.<br><br>
+ When the user selects a term (e.g. clicks on a selection-panel _item_),
  an `item-select` signal is emitted, together with the term, ID,
  and other info.  
  This can be picked up with an event listener, as in the example below.<br><br>
+ Terms, IDs, and styles:  
  For being useful in biological domains
  (as explained on the [VSM-pages](http://scicura.org/vsm/vsm.html)), 
  `vsm-autocomplete` supports what `vsm-dictionary` supports too, a.o.:
  - there can be multiple terms (synonyms) per ID. &mdash;
    These would get shown as separate autocomplete-items
    (different terms, same ID).
  - any term can have multiple IDs. &mdash;
    These would get shown as separate autocomplete-items
    (same term, different IDs). (Think e.g. of gene names).
  - there can be "fixed terms". These are 'preferred matches' that result in
    matching items that appear on top of the selection-panel (also for an empty
    search string).
  - terms can include any special character (like '&beta;-carotene').
  - terms can have some HTML-styling. E.g. italic style for human gene names,
    or parts in superscript for charged ions
    (see [`string-style-html`](https://github.com/vsmjs/string-style-html)).


<br>

## Demo

To see an interactive demo (that uses example dictionary-data), run:

```sh
git clone git@github.com:vsmjs/vsm-autocomplete.git
cd vsm-autocomplete
npm install
npm start
```

<br>

## Example use

Here we embed it in another Vue component, e.g. in a `MyComp.vue`:

```js
<template>
  <div class="my-comp">
    <vsm-autocomplete
      :vsm-dictionary="vsmDictionary"
      :autofocus="true"
      initial-str="a"
      @item-select="onItemSelect"
    />
  </div>
</template>


<script>
// 1.) Create a VsmDictionary data source.
import VsmAutocomplete from 'vsm-autocomplete';
import VsmDictionaryLocal from 'vsm-dictionary-local';  // Or any other one.
import cacher from 'vsm-dictionary-cacher';        // Recommended for speed.

var CachedVsmDictionaryLocal = cacher(VsmDictionaryLocal);
var dict = new CachedVsmDictionaryLocal({      // Initialize with demo data:
  dictData: [
    { id: 'Dict1',
      name: 'Example subdictionary 1',
      entries: [
        { id: 'D1:001', terms: ['aaa', 'aasynonym'], descr: 'description' },
        { id: 'D1:002', terms: 'aab', descr: 'descr2' },
        { id: 'D1:003', terms: 'abc', descr: 'descr3' },
        { id: 'D1:004', terms: [{ str: 'acd', style:'i' }], descr: 'descr4' }
      ]
    }
  ]
});

// 2.) Create a parent component 'MyComp' that embeds a VsmAutocomplete.
export default {
  name: 'MyComp',

  components: {
    'vsm-autocomplete': VsmAutocomplete  // Use it as a sub-component of MyComp.
  },

  data: function() {
    return {
      vsmDictionary: dict
    };
  },

  methods: {
    onItemSelect(match) {
      console.log(match.id, match.str, match.descr, JSON.stringify(match.terms));
    }
  }
};
</script>


<style scoped>  /* Add CSS-styling around the vsm-autocomplete */
.my-comp {
  width: 200px;
  border: 1px solid #ddd;
}
</style>
```

<br>The example shows that the `<vsm-autocomplete>` HTML-tag accepts
two types of attributes:
- **props**:  
  These insert information, settings, or functions, into the component.  
  Here: `:vsm-dictionary="..."`, `:autofocus="..."`, and `initial-str="..."`.
- **event-listeners**:  
  These listen to 'event' signals and information, that come out of the component.  
  Here: `@item-select="..."`.


<br>

## About the 'item-literal'

An extra 'item-literal' can be shown at the bottom of the
autocomplete selection-list.
- This list-item is only visible if a `@item-literal-select` event-listener
  is attached.
- When the user selects the 'item-literal',
  a parent component (e.g. `vsm-box`) can interpret this as a signal that
  the user wants **to access some more advanced term-search** dialog window.
- It does not represent a match-object from the VsmDictionary, so it has no ID.  
  - It represents the input-field's literal string.
  - It has its own CSS-style to make it visually distinct.
  - One can generate custom content for it, via the `:custom-item-literal` prop.


<br>

## Available props

| Prop                 | Type              | Required | Default | Description |
|----------------------|-------------------|----------|---------|-------------|
| vsm-dictionary       | Object            | true     |         | A subclass of [VsmDictionary](https://github.com/vsmjs/vsm-dictionary): an interface to a<br>provider of terms, IDs, styling info, subdictionary info, refTerms and fixedTerms |
| autofocus            | Boolean           |          | false   | When `true`, automatically focuses the input-field at page load |
| placeholder          | String\|Boolean   |          | false   | &bull; String: shows this placeholder message in an empty input-field \|<br>&bull; false/absent: adds none |
| initial-value        | String            |          | ''      | The initial content for the input-field |
| query-options        | Object            |          | { perPage: 20 } | This is sent along with calls to `vsmDictionary.getMatchesForString()` |
| max-string-lengths   | Object            |          | { str: 40, strAndDescr: 70 } | Limits the length of matches' `str` and `descr` shown in  list-items<br>(in number of characters) |
| custom-item          | Function\|Boolean |          | false   | &bull; Function: returns HTML-content for each part of normal list-items (see below) \|<br>&bull; false/absent: default content is used |
| custom-item-literal  | Function\|Boolean |          | false   | &bull; Function: returns HTML-content (see below) for the item-literal \|<br>&bull; false/absent: the default item-literal is used |

<br>Notes:
- The `placeholder` is hidden when the input-field is focused.
- The `query-options`'s `perPage` sets the length of the selection-list.  
  + This includes S/T-type items only,
    while N/R/F/G-type items (see VsmDictionary's spec)
    and a item-literal may get added in addition.
- The `query-options`'s `idts` specifies a list of fixedTerms (see
  vsm-dictionary's spec), only if this autocomplete component should use any.  
- In the selection-panel, N/R/F/G-type items get CSS-styling
  that makes them visually distinct.
- The `max-string-lengths`'s `strAndDescr` sets the maximum length
  of an already length-trimmed `str`, plus its `descr`.
- The `custom-item` and `custom-item-literal` functions are described in the
  "Customized content" section, further below.

<br>

## Available events

| Event               | Output | Description (-&gt; output) |
|---------------------|--------|----------------------------|
| focus               |        | When the input-field gets the page focus |
| blur                |        | When the input-field loses the focus |
| input-change        | String | When the input-field's content changes, _after trimming_ (-&gt; the latest value, trimmed) |
| input               | String | When the input-field's content changes (-&gt; the latest value) |
| key-esc             |        | When `Esc` is pressed, _while the selection-list is closed_ |
| key-bksp            |        | When `Backspace` is pressed, _while the input-field is empty_ |
| key-ctrl-enter      |        | When `Ctrl+Enter` is pressed, _while the input-field has no string-codes_ |
| key-shift-enter     |        | When `Shift+Enter` is pressed |
| key-tab             | String | When `Tab` or `Shift+Tab` is pressed (-&gt; modifier key: `''` or `'shift'`) |
| dblclick            |        | When the input-field gets double-clicked |
| list-open           |        | When the selection-list opens |
| list-close          |        | When the selection-list closes |
| item-active-change  | false\|Object\|String | When the active item in the selection-list changes<br>-&gt; &bull; false: none (on list-close) \|<br>&bull; Object: a match-object from VsmDictionary \|<br>&bull; String: the literal input string (for item-literal) |
| item-select         | Object | When an item is selected (-&gt; a match-object from VsmDictionary) |
| item-literal-select | String | When the item-literal is selected (-&gt; the literal input string) |

<br>Notes:
- When a `@key-tab` listener is attached,
  vsm-autocomplete prevents the default behaviour:  
  i.e. it does not let the focus move away from the input-field.  
  Because in that case it means that a parent component
  wants to decide what happens on Tab / Shift-Tab.  
- Please note the conditions stated above for `@key-esc`, `@key-bksp`,
  and `@key-ctrl-enter`.
- The user can press `Ctrl+Enter` to convert certain string-codes in the input
  (if any) to special characters, e.g. '\beta' to &beta;.  
  Only if no codes were replaced, it emits `key-ctrl-enter`, which an external
  listener may act upon.
- `@item-select` is likely the most important event.


<br>

## Various info

<br>

### Subcomponents: tree overview

This is the architecture of `vsm-autocomplete` in terms of its own subcomponents:

```
VsmAutocomplete
├── TheInput
├─┬ TheList
│ ├── ListItem       (multiple items)
│ └── ListItemLiteral  (only 1, or 0)
└── TheSpinner
```


<br>

### FixedTerms pre-loading

If this autocomplete component should take into account some fixedTerms, i.e.
if it is given some `queryOptions.idts[]` (see vsm-dictionary's spec) as prop,  
then it makes sure that this fixedTerm data is pre-loaded in the given
`vsmDictionary`, before making any requests for matching strings to it.

<br>

### Interactivity specification

See the tests for details.  
They are easiest to read in the following, bottom-up order:  
- subcomponents/**TheInput**.test.js
- subcomponents/**ListItem**.test.js
- subcomponents/**ListItemLiteral**.test.js
- subcomponents/**TheList**.test.js
- (there are no tests for the subcomponents/**TheSpinner**,
  as it contains no logic)
- **VsmAutocomplete**.test.js


<br>

## Customized content

<br>

### Custom content for ListItems

The selection-panel items are given a default content like:  
&nbsp; &nbsp; _`match-string (description) (dictionary-ID)`_,  
and each of the three parts may show extra info when the user mouse-hovers it;
e.g. if "(descri...)" was cut short, then hovering shows the full description.

Any of these parts can be customized by giving a customizing function as the
**`custom-item`** prop.  
&nbsp;&bull; E.g.: for items that represent a match from a Human Genes
subdictionary, it could insert a list of gene-name synonyms in the description
part.  
&nbsp;&bull; Or: for a list of items representing a mix of matches
from a Human Genes and a Mouse Genes subdictionary resp.,
it could add an image of the species so that users can
more quickly distinguish between identically named matches.<br><br>

`customItem()` (if given) is called during the construction of each ListItem.  
It is called with one argument: an Object with useful properties, representing
all possible information needed for building a ListItem:
`customItem(data)`:  
- `data`: {Object}:
  - `item`: the complete 'match'-object that this ListItem represents.
    (The 'match' data-type is described in VsmDictionary's
    [spec](https://github.com/vsmjs/vsm-dictionary/blob/master/Dictionary.spec.md)).
  - `searchStr`: the string that the user typed to find this match.
  - `maxStringLengths`: the `max-string-lengths` prop that was set
    on this `<vsm-autocomplete>`.
  - `dictInfo`: the info-object of the subdictionary
    from which this match came (which contains `customItem()`).
  - `vsmDictionary`: the VsmDictionary instance being used.  
    (It can not be used for queries, as customItem() is synchronous. But it may
    be used for accessing e.g. `vsmDictionary.numberMatchConfig` details).
  - `strs`: the default content for the different parts of the ListItem.  
    It is an Object with properties (Strings) that represent the different parts.  
    The parts may contain HTML tags, but will most commonly be just text.  
    All properties are guaranteed to be of type {String}.  
    This default content will be used if `customItem()` does not change it.
    - `str`: the match's term-string, which is `matchObj.str`,  
      but trimmed in length according to `maxStringLengths.str`,  
      and with `matchObj.style`'s custom CSS-styling already applied.
    - `descr`: the match's description, which is `matchObj.descr`,  
      but trimmed in length according to `maxStringLengths.strAndDescr`.
    - `info`: the dictionary-ID, which is `matchObj.dictID`;  
      (or for number-string matches: the number-ID; or for refTerms: empty).
    - `strTitle`: the `str`-part's HTML `'title=".."'` attribute,  
      which appears on mouse-hover.  
      (If `str` was length-trimmed, then this is `matchObj.str`, else empty).
    - `descrTitle`: the `descr`-part's HTML `'title=".."'` attribute.  
      (If `descr` was length-trimmed, then this is `matchObj.descr`, else empty).
    - `infoTitle`: the `info`-part's HTML `'title=".."'` attribute.  
      (This is a text with `matchObj.id` and `dictInfo.name`).
    - `extra`: an extra part that is added at the end of the ListItem,
      and which is empty by default.<br><br>

`customItem()` must return an Object like its argument `data.strs`.  
It may simply return the given `strs` object, after directly modifying just
those properties it needs to.  
- E.g. `customItem: data => { if (data.item.dictID == 'X')  data.strs.descr += '!';  return data.strs; }`  
  would add a "!" to the description-part of each ListItem from
  subdictionary 'X' (only), and leave these ListItems' other parts unchanged. 
- If any part is empty, it will be left out of the ListItem.


<br>

### Custom content for the ListItemLiteral

The item-literal can be customized by giving a customizing function as the
**`custom-item-literal`** prop.  

`customItemLiteral()` (if given) is called during the construction of a
ListItemLiteral.  
It is called with one argument: an Object with useful properties:  
`customItemLiteral(data)`:  
- `data`: {Object}:
  - `searchStr`: the string that the user typed in TheInput.
  - `maxStringLengths`: the `max-string-lengths` prop that was set
    on this `<vsm-autocomplete>`.
  - `strs`: the default content for the different parts of the ListItemLiteral
    (similar to `customItem`'s `data.strs`):
    - `str`: the default (text/HTML) content for the ListItemLiteral, which is:  
      the content of the input-field, trimmed in length according
      to `max-string-lengths`.
    - `strTitle`: its HTML-element's 'title=".."' attribute,
      which appears on mouse-hover.

`customItemLiteral()` must return an Object like its argument `data.strs`.  
It may simply return the given `strs` object, after directly modifying just
those properties it needs to.  
- E.g. `customItemLiteral: data => { data.strs.strTitle = ''; return data.strs }`  
  would only remove the item-literal's 'title' attribute.

<br>

### Custom CSS

One can change the look of a `<vsm-autocomplete>` component by overriding
its CSS-classes.  
As an example, the following 'CSS skin' makes everything a bit larger:
[`vsm-autocomplete-large.css`](src/vsm-autocomplete-large.css).
