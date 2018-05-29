// -*- Mode: JavaScript; tab-width: 4; -*-

var specsGoogleClosure = function(context){
	
	var makeSlickTestSearch = function(selector, count, disableQSA, rootNode, rootNodeId) {
		return function(){
			context.SELECTOR.disableQSA = !!disableQSA;
			var els = context.SELECT(rootNode, selector);
			var nFoundEls = els.length;
			expect( nFoundEls ).toEqual( count );
			if (nFoundEls && !rootNodeId) expect( context.MATCH(els[0], selector) ).toEqual( true );
			delete context.SELECTOR.disableQSA;
		};
	};
	
	var it_should_find = function(count, selector, rootNodeId){
		var rootNode = rootNodeId ? context.document.getElementById(rootNodeId) : context.document;
		if (global.document.querySelectorAll && !global.cannotDisableQSA)
			it('should find '+count+' `'+selector+'` with    QSA', makeSlickTestSearch(selector, count, false, rootNode, rootNodeId));
		it('should find '+count+' `'+selector + (!global.cannotDisableQSA ? '` without QSA' : ''), makeSlickTestSearch(selector, count, true, rootNode, rootNodeId));
	};

	describe('testBasicSelectors', function(){
		it_should_find(4, 'h3');
		it_should_find(1, 'h1:first-child');
		it_should_find(2, 'h3:first-child');
		it_should_find(1, '#t');
		it_should_find(1, '#bug');
		it_should_find(4, '#t h3');
		it_should_find(1, 'div#t');
		it_should_find(4, 'div#t h3');
		it_should_find(0, 'span#t');
		it_should_find(1, '#t div > h3');
		it_should_find(2, '.foo');
		it_should_find(1, '.foo.bar');
		it_should_find(2, '.baz');
		it_should_find(3, '#t > h3');
	});
	
/*
	describe('testSyntacticEquivalents', function(){
		// syntactic equivalents
		it_should_find(12, '#t > *');
		it_should_find(12, '#t >');
		it_should_find(3, '.foo > *');
		it_should_find(3, '.foo >');
	});
	
	describe('testWithARootById', function(){
		// with a root, by ID
		it_should_find(3, '> *', 'container');
		it_should_find(3, '> h3', 't');
	});
*/
	
	describe('testCompoundQueries', function(){
		// compound queries
		it_should_find(2, '.foo, .bar');
		it_should_find(2, '.foo,.bar');
	});
	
	describe('testMultipleClassAttributes', function(){
		// multiple class attribute
		it_should_find(1, '.foo.bar');
		it_should_find(2, '.foo');
		it_should_find(2, '.baz');
	});
	
	describe('testCaseSensitivity', function(){
		// case sensitivity
		it_should_find(1, 'span.baz');
		it_should_find(1, 'sPaN.baz');
		it_should_find(1, 'SPAN.baz');
		it_should_find(1, '[class = \"foo bar\"]');
		it_should_find(2, '[foo~=\"bar\"]');
		it_should_find(2, '[ foo ~= \"bar\" ]');
	});
	
	describe('testAttributes', function(){
		it_should_find(3, '[foo]');
		it_should_find(1, '[foo$=\"thud\"]');
		it_should_find(1, '[foo$=thud]');
		it_should_find(1, '[foo$=\"thudish\"]');
		it_should_find(1, '#t [foo$=thud]');
		it_should_find(1, '#t [ title $= thud ]');
		it_should_find(0, '#t span[ title $= thud ]');
		it_should_find(2, '[foo|=\"bar\"]');
		it_should_find(1, '[foo|=\"bar-baz\"]');
		it_should_find(0, '[foo|=\"baz\"]');
	});
	
/*
	describe('testDescendantSelectors', function(){
		it_should_find(3, '>', 'container');
		it_should_find(3, '> *', 'container');
		it_should_find(2, '> [qux]', 'container');
		// assertEquals('child1', context.SELECT('> [qux]', 'container')[0].id);
		// assertEquals('child3', context.SELECT('> [qux]', 'container')[1].id);
		it_should_find(3, '>', 'container');
		it_should_find(3, '> *', 'container');
	});
*/
	
	describe('testSiblingSelectors', function(){
//		it_should_find(1, '+', 'container');
//		it_should_find(3, '~', 'container');
		it_should_find(1, '.foo + span');
		it_should_find(4, '.foo ~ span');
		it_should_find(1, '#foo ~ *');
//		it_should_find(1, '#foo ~');
	});
	
	describe('testSubSelectors', function(){
		// sub-selector parsing
        // invalid sub-selector compound (dperini 20171009)
		// it_should_find(1, '#t span.foo:not(span:first-child)');
		it_should_find(1, '#t span.foo:not(:first-child)');
	});
	
	describe('testNthChild', function(){
		// assertEquals(goog.dom.$('_foo'), context.SELECT('.foo:nth-child(2)')[0]);
		it_should_find(2, '#t > h3:nth-child(odd)');
		it_should_find(3, '#t h3:nth-child(odd)');
		it_should_find(3, '#t h3:nth-child(2n+1)');
		it_should_find(1, '#t h3:nth-child(even)');
		it_should_find(1, '#t h3:nth-child(2n)');
		it_should_find(1, '#t h3:nth-child(2n+3)');
		it_should_find(2, '#t h3:nth-child(1)');
		it_should_find(1, '#t > h3:nth-child(1)');
		it_should_find(3, '#t :nth-child(3)');
		it_should_find(0, '#t > div:nth-child(1)');
		it_should_find(7, '#t span');
		it_should_find(3, '#t > *:nth-child(n+10)');
		it_should_find(1, '#t > *:nth-child(n+12)');
		it_should_find(10, '#t > *:nth-child(-n+10)');
		it_should_find(5, '#t > *:nth-child(-2n+10)');
		it_should_find(6, '#t > *:nth-child(2n+2)');
		it_should_find(5, '#t > *:nth-child(2n+4)');
		it_should_find(5, '#t > *:nth-child(2n+4)');
		it_should_find(12, '#t > *:nth-child(n-5)');
		it_should_find(6, '#t > *:nth-child(2n-5)');
	});
	
	describe('testEmptyPseudoSelector', function(){
		it_should_find(4, '#t > span:empty');
		it_should_find(6, '#t span:empty');
		it_should_find(0, 'h3 span:empty');
		it_should_find(1, 'h3 :not(:empty)');
	});
	
	describe('testIdsWithColons', function(){
		it_should_find(1, "[id = 'silly:id::with:colons']");
		it_should_find(1, "#silly\\:id\\:\\:with\\:colons");
	});
	
	describe('testOrder', function(){
		it('should return elements in source order', function(){
			var els = context.SELECT(context.document, '.myupperclass .myclass input');
			expect( els[0].id ).toEqual( 'myid1' );
			expect( els[1].id ).toEqual( 'myid2' );
		});
	});
	
	describe('testCorrectDocumentInFrame', function(){
		it('should testCorrectDocumentInFrame', function(){
			var frameDocument = context.window.frames['ifr'].document;
			frameDocument.body.innerHTML =
			context.document.getElementById('iframe-test').innerHTML;

			var els = context.SELECT(context.document, '#if1 .if2 div');
			var frameEls = context.SELECT(frameDocument, '#if1 .if2 div');

			expect( frameEls.length ).toEqual( els.length );
			expect( frameEls.length ).toEqual( 1 );
			expect( frameDocument.getElementById('if3') ).not.toEqual( context.document.getElementById('if3') );
		});
	});
	
	
};
