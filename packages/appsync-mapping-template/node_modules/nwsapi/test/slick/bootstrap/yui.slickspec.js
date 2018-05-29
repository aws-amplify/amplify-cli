var setupMethods = function(specs, window){
	global.cannotDisableQSA = true;
	
	var YAHOO_util_Selector = (window.YAHOO || global.YAHOO).util.Selector;
	
	window.SELECT = function(context, selector, append){
		return YAHOO_util_Selector.query(selector, context);
	};
	window.SELECT1 = function(context, selector){
		return YAHOO_util_Selector.query(selector, context, true);
	};
	window.MATCH = function(context, selector){
		return YAHOO_util_Selector.test(context, selector);
	};
	window.isXML = TODO;
};

var verifySetupMethods = function(specs, window){
	describe('Verify Setup',function(){
		it('should define SELECT', function(){
			expect( typeof window.SELECT ).toEqual('function');
			expect( window.SELECT(window.document, '*').length ).not.toEqual(0);
		});
		it('should define SELECT1', function(){
			expect( typeof window.SELECT1 ).toEqual('function');
			expect( window.SELECT1(window.document, '*').length ).not.toEqual(0);
		});
		it('should define MATCH', function(){
			expect( typeof window.MATCH ).toEqual('function');
			expect( window.MATCH(window.document.documentElement, '*') ).toEqual(true);
		});
		it('should define isXML', function(){
			expect( typeof window.isXML ).toEqual('function');
		});
	});
};
