/**
 * Protects a string that will be used literally in `v-html` props,
 * against <script> and other injection attacks.
 * + Note: some strings from `f_aci()` are put into such `v-html` props,
 *   because they must be allowed to contain HTML-code.
 *   So this function must be used to make them safe for use.
 */
export default function sanitizeHtml(str) {
  return str.replace(/<(\s*(script|iframe|style|textarea)\W)/g, '&lt;$1');
}
