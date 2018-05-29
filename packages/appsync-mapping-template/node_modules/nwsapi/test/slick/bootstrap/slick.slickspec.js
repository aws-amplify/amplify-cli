var setupMethods = function(window){
	var Slick = window.Slick || global.Slick;
	
	window.SELECT = function(context, selector, append){
		return Slick.search(context, selector, append);
	};
	window.SELECT1 = function(context, selector){
		return Slick.find(context, selector);
	};
	window.MATCH = function(context, selector, root){
		return Slick.match(context, selector, root);
	};
	window.isXML = function(document){
		return Slick.isXML(document);
	};
	window.PARSE = function(selector){
		return Slick.parse(selector);
	};
	
	window.SELECTOR = Slick;
};

var verifySetupMethods = function(window){
	describe('Verify Setup', function(){
		it('should define SELECT', function(){
			expect( typeof window.SELECT ).toEqual('function');
			expect( window.SELECT(window.document, '*').length ).not.toEqual(0);
		});
		
		it('should define SELECT1', function(){
			expect( typeof window.SELECT1 ).toEqual('function');
			expect( window.SELECT1(window.document, '*') ).not.toBeNull();
		});
		
		it('should define MATCH', function(){
			expect( typeof window.MATCH ).toEqual('function');
			expect( window.MATCH(window.document.documentElement, '*') ).toEqual(true);
		});
		
		it('should define isXML', function(){
			expect( typeof window.isXML ).toEqual('function');
			expect( typeof window.isXML(window.document) ).toEqual('boolean');
		});
		
		it('should define PARSE', function(){
			expect( typeof window.PARSE ).toEqual('function');
			expect( typeof window.PARSE('*') ).toEqual('object');
			expect( window.PARSE('*').expressions.length ).toEqual(1);
			expect( window.PARSE('*').expressions[0].length ).toEqual(1);
		});
	});
};

var verifySetupContext = function(context){
	describe('Verify Context', function(){
		it('should set the context properly', function(){
			expect(context.document).toBeDefined();
			expect(context.document.nodeType).toEqual(9);
			var title = context.document.getElementsByTagName('title');
			for (var i=0, l=title.length; i < l; i++){
				if (title[i].firstChild)
					expect(title[i].firstChild.nodeValue).not.toMatch(404);
			}
		});
	});
};
