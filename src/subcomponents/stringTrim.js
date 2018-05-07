export default function stringTrim(str, maxLen) {
  return str.length <= maxLen ? str :
    (str.substr(0, maxLen - 1) + '…');  // -1: because we add a '…' char again.
}
