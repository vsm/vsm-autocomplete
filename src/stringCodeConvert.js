var codes = [
  ['α','alpha'], ['β','beta'], ['γ','gamma'], ['δ','delta'], ['ε','epsilon'],
  ['ζ','zeta'], ['η','eta'], ['θ','theta'], ['ι','iota'], ['κ','kappa'],
  ['λ','lambda'], ['μ','mu'], ['ν','nu'], ['ξ','xi'], ['ο','omicron'],
  ['π','pi'], ['ρ','rho'], ['σ','sigma'], ['τ','tau'], ['υ','upsilon'],
  ['φ','phi'], ['χ','chi'], ['ψ','psi'], ['ω','omega'],

  ['∀','forall'], ['∃','exist'],
  ['∧','and'], ['∨','or'], ['¬','not'],
  ['∏','prod'], ['∑','sum'], ['µ','micro'],

  /*
  ['à','agrave'], ['á','aacute'], ['â','acirc'], ['ã','atilde'], ['ä','auml'],
  ['å','aring'], ['æ','aelig'], ['ç','ccedil'], ['è','egrave'], ['é','eacute'],
  ['ê','ecirc'], ['ë','euml'], ['ì','igrave'], ['í','iacute'], ['î','icirc'],
  ['ï','iuml'], ['ð','eth'], ['ñ','ntilde'], ['ò','ograve'], ['ó','oacute'],
  ['ô','ocirc'], ['õ','otilde'], ['ö','ouml'], ['ø','oslash'], ['ù','ugrave'],
  ['ú','uacute'], ['û','ucirc'], ['ü','uuml'], ['þ','thorn'], ['ý','yacute'],
  ['ÿ','yuml']
  ['À','Agrave'], ['Á','Aacute'], ['Â','Acirc'], ['Ã','Atilde'], ['Ä','Auml'],
  ['Å','Aring'], ['Æ','AElig'], ['Ç','Ccedil'], ['È','Egrave'], ['É','Eacute'],
  ['Ê','Ecirc'], ['Ë','Euml'], ['Ì','Igrave'], ['Í','Iacute'], ['Î','Icirc'],
  ['Ï','Iuml'], ['Ð','ETH'], ['Ñ','Ntilde'], ['Ò','Ograve'], ['Ó','Oacute'],
  ['Ô','Ocirc'], ['Õ','Otilde'], ['Ö','Ouml'], ['Ø','Oslash'], ['Ù','Ugrave'],
  ['Ú','Uacute'], ['Û','Ucirc'], ['Ü','Uuml'], ['Þ','THORN'], ['Ý','Yacute'],
  ['ß','szlig'],
  ['¢','cent'], ['£','pound'], ['¥','yen'], ['€','euro'], ['¤','curren'],
  ['¦','brvbar'], ['§','sect'], ['ª','ordf'], ['º','ordm'], ['©','copy'],
  ['®','reg'], ['™','trade'], ['°','deg'], ['±','plusmn'], ['´','acute'],
  ['¶','para'], ['·','middot'], ['×','times'], ['÷','divide'],
  ['∂','part'], ['∅','empty'], ['∇','nabla'],
  ['∈','isin'], ['∉','notin'], ['∋','ni'],
  ['−','minus'], ['∗','lowast'], ['√','radic'], ['∝','prop'], ['∞','infin'],
  ['∠','ang'], ['∩','cap'], ['∪','cup'], ['∫','int'],
  ['∴','there4'], ['∼','sim'], ['≅','cong'], ['≈','asymp'], ['≠','ne'],
  ['≡','equiv'], ['≤','le'], ['≥','ge'], ['⊂','sub'], ['⊃','sup'],
  ['⊄','nsub'], ['⊆','sube'], ['⊇','supe'], ['⊕','oplus'], ['⊗','otimes'],
  ['⊥','perp'], ['⋅','sdot'], ['Œ','OElig'], ['œ','oelig'], ['Š','Scaron'],
  ['š','scaron'], ['Ÿ','Yuml'], ['ƒ','fnof'], ['ˆ','circ'], ['˜','tilde'],
  ['–','ndash'], ['—','mdash'], ['‘','lsquo'], ['’','rsquo'], ['‚','sbquo'],
  ['“','ldquo'], ['”','rdquo'], ['„','bdquo'], ['†','dagger'], ['‡','Dagger'],
  ['•','bull'], ['…','hellip'], ['‰','permil'], ['′','prime'], ['″','Prime'],
  ['←','larr'], ['↑','uarr'], ['→','rarr'], ['↓','darr'], ['↔','harr'],
  ['↵','crarr'], ['⌈','lceil'], ['⌉','rceil'], ['⌊','lfloor'], ['⌋','rfloor'],
  */
];


/**
 * Finds any backslash-or-forwardslash plus one of the recognized codes in `str`,
 * and replaces them with the special character that the code represent.
 * E.g. converts '\beta-abc-/beta' to 'β-abc-β', and '/Gamma-/gamma' to 'Γ-γ'.
 */
export default function stringCodeConvert(str) {
  return codes.reduce(
    (str, code) => str
      // First convert exact lowercase match:
      .replace(new RegExp('[\\\\/]' + code[1], 'g' ), code[0])
      // Then convert case-insensitive (->uppercase-incl) code to uppercase char.
      .replace(new RegExp('[\\\\/]' + code[1], 'gi'), code[0].toUpperCase()),
    str
  );
}
