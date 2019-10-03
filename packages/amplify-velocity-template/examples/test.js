const Velocity = require('../index');

const template = `
#set( $limit = 10 )
#return;
{
"version": "2017-02-28",
"operation": "Scan",
"filter":   #if( $context.args.filter )
"filterrrrr"
#else
null
#end,
"limit": $limit,
"nextToken":   #if( $context.args.nextToken )
"$context.args.nextToken"
#else
null
#end
}`;

var vm   = '#foreach($product in $products)$product.name#if($foreach.hasNext()),#end#end'
var data = {products: {product1: {name: "hanwen1"}, product2: {name: "hanwen2"}, product3: {name: "hanwen3"}}};
const ast = Velocity.parse(vm)
const compiler = new Velocity.Compile(ast);
const result = compiler.render(data);
console.log(result);