import stringTrim from './stringTrim.js';


describe('sub/stringTrim()', function() {

  it('does not trim a short string', () => {
    stringTrim('abc', 3).should.equal('abc');
  });

  it('trims a longer string, ' +
     'and includes the ellipsis char in the allowed length', () => {
    stringTrim('abcd', 3).should.equal('ab…'); // Length is 3, including the '…'.
  });

});
