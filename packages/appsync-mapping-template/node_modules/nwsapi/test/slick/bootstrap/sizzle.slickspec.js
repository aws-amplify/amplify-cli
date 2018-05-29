var setupMethods = function(specs, window){
	global.cannotDisableQSA = true;
	
	var jQuery = window.jQuery || global.jQuery || function(){};
	var Sizzle = window.Sizzle || global.Sizzle || jQuery() && function(selector, context, append, seed){
		if (seed) return Array.prototype.slice.call(jQuery(seed).filter(selector).get());
		return Array.prototype.slice.call(jQuery(append || []).add(selector, context).get());
	};
	
	var isXML = jQuery.isXMLDoc || function(elem){
		return elem.nodeType === 9 && elem.documentElement.nodeName !== "HTML" ||
			!!elem.ownerDocument && isXML( elem.ownerDocument );
	};
	
	window.SELECT = function(context, selector, append){
		return Sizzle(selector, context, append);
	};
	window.SELECT1 = function(context, selector){
		return Sizzle(selector + ':first', context)[0];
	};
	window.MATCH = function(context, selector, root){
		return !!Sizzle(selector, null, null, [context]).length;
	};
	window.isXML = function(document){
		return isXML(document);
	};
};

var verifySetupMethods = function(specs, window){
	describe('Verify Setup',function(){
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
