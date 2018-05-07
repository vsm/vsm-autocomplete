import stringCodeConvert from './stringCodeConvert.js';


describe('stringCodeConvert()', function() {

  it('converts both \'\\beta\' and \'/beta\' in a string to \'β\'', () => {
    stringCodeConvert('\\beta-abc-/beta').should.equal('β-abc-β');
  });

  it('converts both \'/Gamma\' and \'/GAMMA\' to \'Γ\', ' +
    'but \'/gamma\' to \'γ\'', () => {
    stringCodeConvert('/Gamma-/GAMMA-/gamma').should.equal('Γ-Γ-γ');
  });

  it('converts codes for all Greek letters', () => {
    var codes = '/alpha/beta/gamma/delta/epsilon/zeta/eta/theta/iota/kappa' +
      '/lambda/mu/nu/xi/omicron/pi/rho/sigma/tau/upsilon/phi/chi/psi/omega.' +
      '/Alpha/Beta/Gamma/Delta/Epsilon/Zeta/Eta/Theta/Iota/Kappa' +
      '/Lambda/Mu/Nu/Xi/Omicron/Pi/Rho/Sigma/Tau/Upsilon/Phi/Chi/Psi/Omega';
    var chars = 'αβγδεζηθικλμνξοπρστυφχψω.ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
    stringCodeConvert(codes).should.equal(chars);
  });

  it('converts other recognized codes to symbols', () => {
    var codes = '/forall/exist/and/or/not/prod/sum/micro';
    var chars = '∀∃∧∨¬∏∑µ';
    stringCodeConvert(codes).should.equal(chars);
  });

});
