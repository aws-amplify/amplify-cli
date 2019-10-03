'use strict';

var Velocity = require('../src/velocity')
var assert = require("assert")
var render = Velocity.render;

describe('Loops', function() {

  it('#foreach', function() {
    var vm = '#foreach( $product in $allProducts )<li>$product</li>#end'
    var data = {allProducts: ["book", "phone"]}
    assert.equal('<li>book</li><li>phone</li>', render(vm, data))
  })

  it('#foreach with map', function() {
    var vm   = '#foreach($key in $products) name => $products.name #end'
    var data = {products: {name: "hanwen"}}
    assert.equal(' name => hanwen ', render(vm, data))
  })

  it('#foreach with map hasNext', function() {
    var vm   = '#foreach($product in $products)$product.name#if($foreach.hasNext),#end#end'
    var data = {products: {product1: {name: "hanwen1"}, product2: {name: "hanwen2"}, product3: {name: "hanwen3"}}};
    assert.equal('hanwen1,hanwen2,hanwen3', render(vm, data))
  })

  it('#foreach with map hasNext as method', function() {
    var vm   = '#foreach($product in $products)$product.name#if($foreach.hasNext()),#end#end'
    var data = {products: {product1: {name: "hanwen1"}, product2: {name: "hanwen2"}, product3: {name: "hanwen3"}}};
    assert.equal('hanwen1,hanwen2,hanwen3', render(vm, data))
  })

  it('#foreach with map keySet', function() {
    var vm = '#foreach($key in $products.keySet())' +
    ' $key => $products.get($key) #end'
    var data = {products: {name: "hanwen"}}
    assert.equal(' name => hanwen ', render(vm, data))
  })

  it('#foreach with nest foreach', function() {
    var vm = '#foreach($i in [1..2])${velocityCount}' +
    '#foreach($j in [2..3])${velocityCount}#end#end'
    assert.equal('112212', render(vm))
    var vm = '#foreach($i in [5..2])$i#end'
    assert.equal('5432', render(vm))
  })

  it('#foreach with nest non-empty foreach', function() {
    var vm = '#foreach($i in [1..2])' +
    '[#foreach($j in [1..2])$j#if($foreach.hasNext),#end#end]' +
    '#if($foreach.hasNext),#end#end'
    assert.equal('[1,2],[1,2]', render(vm))
  })

  it('#foreach with nest empty foreach', function() {
    var vm = '#foreach($i in [1..2])' +
    '[#foreach($j in [])$j#if($foreach.hasNext),#end#end]' +
    '#if($foreach.hasNext),#end#end'
    assert.equal('[],[]', render(vm))
  })

  it('#foreach with map entrySet', function() {
    var vm = '' +
    '#set($js_file = {\n' +
    '  "js_arale":"build/js/arale.js?t=20110608",\n' +
    '  "js_ma_template":"build/js/ma/template.js?t=20110608",\n' +
    '  "js_pa_pa":"build/js/pa/pa.js?t=20110608",\n' +
    '  "js_swiff":"build/js/app/swiff.js?t=20110608",\n' +
    '  "js_alieditControl":"build/js/pa/alieditcontrol-update.js?"\n' +
    '})\n' +
    '#foreach($_item in $js_file.entrySet())' +
    '$_item.key = $staticServer.getURI("/${_item.value}")\n' +
    '#end'

    var ret = 'js_arale = /path/build/js/arale.js?t=20110608\n' +
    'js_ma_template = /path/build/js/ma/template.js?t=20110608\n' +
    'js_pa_pa = /path/build/js/pa/pa.js?t=20110608\n' +
    'js_swiff = /path/build/js/app/swiff.js?t=20110608\n' +
    'js_alieditControl = /path/build/js/pa/alieditcontrol-update.js?\n'

    var data = {
      staticServer: {
        getURI: function(url) {
          return '/path' + url
        }
      }
    }

    assert.equal(ret.trim(), render(vm, data).trim())

  })

  it('#foreach with #macro, $velocityCount should work, #25', function() {
    var vm = '#macro(local) #end ' +
    '#foreach ($one in [1,2,4]) #local() $velocityCount #end'
    var ret = render(vm).replace(/\s+/g, '')
    assert.equal('123', ret)
  })

  it('#break', function() {
    var vm = '#foreach($num in [1..6])' +
    ' #if($foreach.count > 3) #break #end $num #end'
    assert.equal('  1   2   3     4 ', render(vm))
  })

  it('#break for map', function() {
    var vm = '#foreach($item in $map)' +
    ' #if($foreach.count > 2) #break #end $item #end'
    var data = {map: {item1: '1', item2: '2', item3: '3', item4: '4'}}
    assert.equal('  1   2     3 ', render(vm, data))
  })

  it('foreach for null', function() {
    var vm = '#foreach($num in $bar) #end';
    assert.equal('', render(vm))
  })

  it('support #foreach(${itemData} in ${defaultData})', function() {
    const vm = `#set($allProducts = [1, 2, 3])
        #foreach(\${product} in \${allProducts}) <li>$product</li> #end`;
    const html = render(vm)
    html.should.containEql('<li>1</li>');
    html.should.containEql('<li>2</li>');
  });

  it('issue 100', function() {
    const vm = `
      #set($records = [[1], [2], [3]])
      #foreach($rec in $records)
        #set($match = true)
        #foreach($val in $rec)
            #if($val % 2 != 0)
                #set($match = false)
                #break
            #end
        #end
        #if($match == true)
            matched: "$rec"
        #end
      #end
    `;
    const context = {
      records: [[1], [2], [3]]
    };
    const ret = render(vm, context);
    ret.replace(/\s+/g, '').should.equal('matched:"[2]"');
  });
})
