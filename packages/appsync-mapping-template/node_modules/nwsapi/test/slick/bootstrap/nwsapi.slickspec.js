var setupMethods = function(window){
	var NW = window.NW || global.NW;
	
	NW.Dom.configure({
		'CACHING': false,
		'ESCAPECHR': true,
		'NON_ASCII': true,
		'UNICODE16': true,
		'SIMPLENOT': false,
		'SHORTCUTS': true,
		'USE_HTML5': true
	});
	

    // V1.x
//	NW.Dom.registerOperator('!=', 'n!="%m"');

    // V2.x
	NW.Dom.registerOperator('!=', { p1: '^', p2: '$', p3: 'false' });
	
	window.SELECT = function(from, selector, data) {
//		NW.Dom.configure({ 'USE_QSAPI': !window.SELECT.disableQSA });
		if (data) {
			NW.Dom.select(selector, from, function(element) { data.push(element); });
			return data;
		}
		return NW.Dom.select(selector, from);
	};
	
	window.SELECT1 = function(from, selector){
//		NW.Dom.configure({ 'USE_QSAPI': !window.SELECT.disableQSA });
		return NW.Dom.select(selector, from)[0] || null;
	};
	
	window.MATCH = function(context, selector, root){
//		NW.Dom.configure({ 'USE_QSAPI': !window.SELECT.disableQSA });
		return NW.Dom.match(selector, context, root);
	};
	
	window.isXML = function(element){
		var ownerDocument = element.ownerDocument || element;
		return !('body' in ownerDocument) || !('innerHTML' in ownerDocument.documentElement) ||
			ownerDocument.createElement('DiV').nodeName == 'DiV';
	};
	
	window.SELECTOR = window.SELECT;
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