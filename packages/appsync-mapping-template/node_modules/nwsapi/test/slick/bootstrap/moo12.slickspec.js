var setupMethods = function(specs, window){
	var Element = window.Element || global.Element;
	global.disableNegNth = true;
	global.cannotDisableQSA = true;
	
	window.SELECT = function(context, selector, append){
		return Element.getElements(context, selector);
	};
	window.SELECT1 = function(context, selector){
		return Element.getElement(context, selector);
	};
	window.MATCH = function(context, selector){
		return Element.match(context, selector);
	};
	// window.isXML = function(document){
	// 	return Slick.isXML(document);
	// };
	// window.PARSE = function(selector){
	// 	return Slick.parse(selector);
	// };
}

var verifySetupMethods = function(specs, window){
	describe('Verify Setup',function(){
		it('should define SELECT', function(){
			expect( typeof window.SELECT ).toEqual('function');
			expect( window.SELECT(window.document, '*').length ).not.toEqual(0);
		});
		it('should define MATCH', function(){
			expect( typeof window.MATCH ).toEqual('function');
			expect( window.MATCH(window.document.documentElement, '*') ).toEqual(true);
		});
		// it('should define isXML', function(){
		// 	expect( typeof window.isXML ).toEqual('function');
		// 	expect( typeof window.isXML(window.document) ).toEqual('boolean');
		// });
	});
};

var verifySetupContext = function(specs, context){
	describe('Verify Context',function(){

		it('should set the context properly', function(){
			expect(context.document).toBeDefined();
			expect(context.document.nodeType).toEqual(9);
			
			var title = context.document.getElementsByTagName('title');
			for (var i=0, l=title.length; i < l; i++)
				if (title[i].firstChild)
					expect(title[i].firstChild.nodeValue).not.toMatch(404);
			
		});

	});
};
