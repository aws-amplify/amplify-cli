var specsMatch = function(context){

var nodes = [], testNode;

describe('Slick Match', function(){
	
	beforeEach(function() {
		testNode = document.createElement('div');
	});
	
	afterEach(function() {
		for (var i = nodes.length; i--;) {
			if (nodes[i] && nodes[i].parentNode) {
				nodes[i].parentNode.removeChild(nodes[i]);
			}
			nodes.splice(i, 1);
		}
	});
	
	it('node should match another node', function(){
		expect( context.MATCH(testNode, testNode) ).toEqual(true);
		expect( context.MATCH(testNode, document.createElement('div')) ).toEqual(false);
	});
	
	it('node should NOT match nothing', function(){
		expect( context.MATCH(testNode) ).toEqual(false);
		expect( context.MATCH(testNode, null) ).toEqual(false);
		expect( context.MATCH(testNode, undefined) ).toEqual(false);
		expect( context.MATCH(testNode, '') ).toEqual(false);
	});
	
	describe('attributes', function(){
		var nodes;
		var AttributeTests = [
			{ operator:'=',  value:'test you!', matchAgainst:'test you!', shouldBeTrue:true },
			{ operator:'=',  value:'test you!', matchAgainst:'test me!', shouldBeTrue:false },

			{ operator:'^=', value:'test', matchAgainst:'test you!', shouldBeTrue:true },
			{ operator:'^=', value:'test', matchAgainst:' test you!', shouldBeTrue:false },

			{ operator:'$=', value:'you!', matchAgainst:'test you!', shouldBeTrue:true },
			{ operator:'$=', value:'you!', matchAgainst:'test you! ', shouldBeTrue:false },

			{ operator:'!=', value:'test you!', matchAgainst:'test you?', shouldBeTrue:true },
			{ operator:'!=', value:'test you!', matchAgainst:'test you!', shouldBeTrue:false }
		];
		
		var makeAttributeTest = function(operator, value, matchAgainst, shouldBeTrue) {
			return function(){
				testNode.setAttribute('attr', matchAgainst);
				expect( context.MATCH(testNode, "[attr"+ operator +"'"+ value +"']") ).toEqual(shouldBeTrue ? true : false);
				testNode.removeAttribute('attr');
			};
		};
		
		for (var t=0,J; J=AttributeTests[t]; t++){
			it('"'+J.matchAgainst+'" should '+ (J.shouldBeTrue?'':'NOT') +" match \"[attr"+ J.operator +"'"+ String.escapeSingle(J.matchAgainst) +"']\"", 
				makeAttributeTest(J.operator, J.value, J.matchAgainst, J.shouldBeTrue)
			);
		}
	});
	
	describe('classes', function(){
		// it('should match all possible classes', TODO);
	});
	
	describe('pseudos', function(){
		// it('should match all standard pseudos', TODO);
	});
	
});


describe('Slick Deep Match', function(){
	
	beforeEach(function(){
		testNode = context.document.createElement('div');
		nodes.push(testNode);
		testNode.innerHTML = '\
			<b class="b b1" id="b2">\
				<a class="a"> lorem </a>\
			</b>\
			<b class="b b2" id="b2">\
				<a id="a_tag1" class="a">\
					lorem\
				</a>\
			</b>\
		';
		context.document.body.appendChild(testNode);
		nested_a = context.document.getElementById('a_tag1');
	});
	
	afterEach(function(){
		for (var i = nodes.length; i--;) {
			if (nodes[i] && nodes[i].parentNode) {
				nodes[i].parentNode.removeChild(nodes[i]);
			}
			nodes.splice(i, 1);
		}
	});
	
	var it_should_match_selector = function(node, selector, should_be){
		it('should match selector "' + selector + '"', function(){
			expect( context.MATCH(global[node], selector) ).toEqual(should_be);
		});
	};
	
	it_should_match_selector('nested_a', '*'             ,true  );
	it_should_match_selector('nested_a', 'a'             ,true  );
	it_should_match_selector('nested_a', ':not(a)'       ,false );
	it_should_match_selector('nested_a', 'del'           ,false );
	it_should_match_selector('nested_a', ':not(del)'     ,true  );
	it_should_match_selector('nested_a', '[id]'          ,true  );
	it_should_match_selector('nested_a', ':not([id])'    ,false );
	it_should_match_selector('nested_a', '[class]'       ,true  );
	it_should_match_selector('nested_a', ':not([class])' ,false );
	it_should_match_selector('nested_a', '.a'            ,true  );
	it_should_match_selector('nested_a', ':not(.a)'      ,false );

	it_should_match_selector('nested_a', '* *'             ,true  );
	it_should_match_selector('nested_a', '* > *'           ,true  );
	it_should_match_selector('nested_a', '* ~ *'           ,false );
	it_should_match_selector('nested_a', '* + *'           ,false );
	it_should_match_selector('nested_a', 'b a'             ,true  );
	it_should_match_selector('nested_a', 'b > a'           ,true  );
	it_should_match_selector('nested_a', 'div > b > a'     ,true  );
	it_should_match_selector('nested_a', 'div > b + b > a' ,true  );
	it_should_match_selector('nested_a', 'div > b ~ b > a' ,true  );
	it_should_match_selector('nested_a', 'div a'           ,true  );
	
	it_should_match_selector('nested_a', context.PARSE('div > b ~ b > a') , true );
	it_should_match_selector('nested_a', context.PARSE('div a')           , true );
	
	// it('should match a node outside the DOM', TODO);
	// it('should match a node on a different window/iframe', TODO);
	
});

};