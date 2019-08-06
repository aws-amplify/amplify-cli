'use strict';

var Velocity = require('../src/velocity');
var render = Velocity.render;

describe('stop', function() {
  it('should support #stop', function() {
    var str = `hello #stop('hello') world`;
    render(str).trim().should.eql('hello');
  });

  it('should support #stop in loop', function() {
    var str = `
      <ul>
        #foreach( $product in $items )
        #if ($product == 'world') #stop() #end
        <li>$product</li>
        #end
      </ul>
    `;
    var ret = render(str, { items: ['hello', 'world']}).trim();
    ret.should.containEql('<li>hello</li>');
    ret.should.not.containEql('<li>world</li>');
  });
});
