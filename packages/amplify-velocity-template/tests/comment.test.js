var Velocity = require('../src/velocity')

describe('comment render', function() {
  it('fix #66', function() {
    Velocity.render('##').should.eql('');
  });
});
