var specsDojo = function(context){
	var should = '';
	var doh = context.doh = global.doh = {};
	
	it('should exist', function(){
		expect( context.SELECT ).toBeDefined();
	});
	
	doh.is = function(expected, actual){
		expect( actual ).toEqual( expected );
	};
	
	doh.register = function(name, tests){
		for (var i=0, test; test = tests[i]; i++){
			if (!test) continue;
			it(should + test, new Function(test));
		}
	};
	
	var dojo = context.dojo = global.dojo = {};
	
	dojo.query = function(selector, contextNode){
		if (contextNode === undefined) contextNode = context.document;
		return context.SELECT(dojo.byId(contextNode), selector);
	};
	
	dojo.byId = function(id){
		if (id.nodeType) return id;
		return context.document.getElementById(id);
	};

	doh.register("t", 
		[
			// "doh.t(false, 'howdy!')",
			// "doh.f(true, 'howdy!')",
			// "doh.e(Error, window, function(){ throw new Error(); })",

			// basic sanity checks
			"doh.is(4, (dojo.query('h3')).length);",
			"doh.is(1, (dojo.query('h1:first-child')).length);",
			"doh.is(2, (dojo.query('h3:first-child')).length);",
			"doh.is(1, (dojo.query('#t')).length);",
			"doh.is(1, (dojo.query('#bug')).length);",
			"doh.is(4, (dojo.query('#t h3')).length);",
			"doh.is(1, (dojo.query('div#t')).length);",
			"doh.is(4, (dojo.query('div#t h3')).length);",
			"doh.is(0, (dojo.query('span#t')).length);",
			"doh.is(0, (dojo.query('.bogus')).length);",
			"doh.is(0, (dojo.query('.bogus', dojo.byId('container'))).length);",
			"doh.is(0, (dojo.query('#bogus')).length);",
			"doh.is(0, (dojo.query('#bogus', dojo.byId('container'))).length);",
			"doh.is(1, (dojo.query('#t div > h3')).length);",
			"doh.is(2, (dojo.query('.foo')).length);",
			"doh.is(1, (dojo.query('.foo.bar')).length);",
			"doh.is(2, (dojo.query('.baz')).length);",
			"doh.is(3, (dojo.query('#t > h3')).length);",

			"doh.is(2, (dojo.query('#baz,#foo,#t')).length);",

			// classnames aren't case sensitive, only attribute selectors and xml tagnames, this spec is invalid
			// modified from `1` to `2` because the element classname property is case insensitive (dperini)
			"doh.is(2, dojo.query('.fooBar').length);",

			// modified from `1` to `2` because classes from the class attribute of HTML elements in documents
			// that are in quirks mode must be treated as ASCII case-insensitive. (jddalton)
			// document is not in quirks mode, tested compatMode to be CSS1Compat (dperini)
			// http://www.whatwg.org/specs/web-apps/current-work/#selectors
			"doh.is(1, dojo.query('[class~=foobar]').length);",
			"doh.is(1, dojo.query('[class~=fooBar]').length);",

			// syntactic equivalents
			"doh.is(12, (dojo.query('#t > *')).length);",
//			"doh.is(12, (dojo.query('#t >')).length);",
//			"doh.is(3, (dojo.query('.foo >')).length);",
			"doh.is(3, (dojo.query('.foo > *')).length);",

			// with a root, by ID
//			"doh.is(3, (dojo.query('> *', 'container')).length);",
//			"doh.is(3, (dojo.query('> h3', 't')).length);",

			// compound queries
			"doh.is(2, (dojo.query('.foo, .bar')).length);",
			"doh.is(2, (dojo.query('.foo,.bar')).length);",

			// multiple class attribute
			"doh.is(1, (dojo.query('.foo.bar')).length);",
			"doh.is(2, (dojo.query('.foo')).length);",
			"doh.is(2, (dojo.query('.baz')).length);",

			// case sensitivity
			"doh.is(1, (dojo.query('span.baz')).length);",
			"doh.is(1, (dojo.query('sPaN.baz')).length);",
			"doh.is(1, (dojo.query('SPAN.baz')).length);",
			"doh.is(1, (dojo.query('[class = \"foo bar\"]')).length);",
			"doh.is(2, (dojo.query('[foo~=\"bar\"]')).length);",
			"doh.is(2, (dojo.query('[ foo ~= \"bar\" ]')).length);",

			// "t.is(0, (dojo.query('[ foo ~= \"\\'bar\\'\" ]')).length);",
			"doh.is(3, (dojo.query('[foo]')).length);",
			"doh.is(1, (dojo.query('[foo$=\"thud\"]')).length);",
			"doh.is(1, (dojo.query('[foo$=thud]')).length);",
			"doh.is(1, (dojo.query('[foo$=\"thudish\"]')).length);",
			"doh.is(1, (dojo.query('#t [foo$=thud]')).length);",
			"doh.is(1, (dojo.query('#t [ title $= thud ]')).length);",
			"doh.is(0, (dojo.query('#t span[ title $= thud ]')).length);",
			// The mock source has two elements that match
			// "doh.is(1, (dojo.query('[foo|=\"bar\"]')).length);",
			"doh.is(1, (dojo.query('[foo|=\"bar-baz\"]')).length);",
			"doh.is(0, (dojo.query('[foo|=\"baz\"]')).length);",
			"doh.is(dojo.byId('_foo'), dojo.query('.foo:nth-child(2)')[0]);",
			"doh.is(dojo.query('style')[0], dojo.query(':nth-child(2)')[0]);",

			// descendant selectors
//			"doh.is(3, dojo.query('>', 'container').length);",
//			"doh.is(3, dojo.query('> *', 'container').length);",
//			"doh.is(2, dojo.query('> [qux]', 'container').length);",
//			"doh.is('child1', dojo.query('> [qux]', 'container')[0].id);",
//			"doh.is('child3', dojo.query('> [qux]', 'container')[1].id);",
//			"doh.is(3, dojo.query('>', 'container').length);",
//			"doh.is(3, dojo.query('> *', 'container').length);",
			"doh.is('passed', dojo.query('#bug')[0].value);",

			// bug 9071
			"doh.is(2, (dojo.query('a', 't4')).length);",
			"doh.is(2, (dojo.query('p a', 't4')).length);",
			"doh.is(2, (dojo.query('div p', 't4')).length);",
			"doh.is(2, (dojo.query('div p a', 't4')).length);",
			"doh.is(2, (dojo.query('.subA', 't4')).length);",
			"doh.is(2, (dojo.query('.subP .subA', 't4')).length);",
			"doh.is(2, (dojo.query('.subDiv .subP', 't4')).length);",
			"doh.is(2, (dojo.query('.subDiv .subP .subA', 't4')).length);",


			// failed scope arg
			"doh.is(0, (dojo.query('div#foo').length));",

			// Removed as this is specific to Dojo API (jddalton)
			//"doh.is(0, (dojo.query('*', 'thinger')).length);",

			// sibling selectors
//			"doh.is(1, dojo.query('+', 'container').length);",
//			"doh.is(3, dojo.query('~', 'container').length);",
			"doh.is(1, (dojo.query('.foo + span')).length);",
			"doh.is(4, (dojo.query('.foo ~ span')).length);",
			"doh.is(1, (dojo.query('#foo ~ *')).length);",
//			"doh.is(1, (dojo.query('#foo ~')).length);",

			// sub-selector parsing
			// invalid sub-selector compound (dperini)
//			"doh.is(1, dojo.query('#t span.foo:not(span:first-child)').length);",
			"doh.is(1, dojo.query('#t span.foo:not(:first-child)').length);",

			// nth-child tests
			"doh.is(2, dojo.query('#t > h3:nth-child(odd)').length);",
			"doh.is(3, dojo.query('#t h3:nth-child(odd)').length);",
			"doh.is(3, dojo.query('#t h3:nth-child(2n+1)').length);",
			"doh.is(1, dojo.query('#t h3:nth-child(even)').length);",
			"doh.is(1, dojo.query('#t h3:nth-child(2n)').length);",
			"doh.is(1, dojo.query('#t h3:nth-child(2n+3)').length);",
			"doh.is(2, dojo.query('#t h3:nth-child(1)').length);",
			"doh.is(1, dojo.query('#t > h3:nth-child(1)').length);",
			"doh.is(3, dojo.query('#t :nth-child(3)').length);",
			"doh.is(0, dojo.query('#t > div:nth-child(1)').length);",
			"doh.is(7, dojo.query('#t span').length);",
			"doh.is(3, dojo.query('#t > *:nth-child(n+10)').length);",
			"doh.is(1, dojo.query('#t > *:nth-child(n+12)').length);",
			"doh.is(10, dojo.query('#t > *:nth-child(-n+10)').length);",
			"doh.is(5, dojo.query('#t > *:nth-child(-2n+10)').length);",
			"doh.is(6, dojo.query('#t > *:nth-child(2n+2)').length);",
			"doh.is(5, dojo.query('#t > *:nth-child(2n+4)').length);",
			"doh.is(5, dojo.query('#t > *:nth-child(2n+4)').length);",
			"doh.is(12, dojo.query('#t > *:nth-child(n-5)').length);",
			"doh.is(6, dojo.query('#t > *:nth-child(2n-5)').length);",
			
			// :checked pseudo-selector
			"doh.is(2, dojo.query('#t2 > :checked').length);",
			"doh.is(dojo.byId('checkbox2'), dojo.query('#t2 > input[type=checkbox]:checked')[0]);",
			"doh.is(dojo.byId('radio2'), dojo.query('#t2 > input[type=radio]:checked')[0]);",
			"doh.is(2, dojo.query('#t2select option:checked').length);",

			// cross-document queries
/*
			{

				name: "crossDocumentQuery",
				setUp: function(){
					dojo.require("dojo.io.iframe");
					this.t3 = window.frames["t3"];
					this.doc = dojo.io.iframe.doc(t3);
					this.doc.open();
					this.doc.write([
						"<html><head>",
						"<title>inner document</title>",
						"</head>",
						"<body>",
						"<div id='st1'><h3>h3 <span>span <span> inner <span>inner-inner</span></span></span> endh3 </h3></div>",
						"</body>",
						"</html>"
					].join(""));
				},
				runTest: function(){
					doh.is(1, dojo.query('h3', dojo.byId("st1", this.doc)).length);
					// use a long query to force a test of the XPath system on FF. see bug #7075
					doh.is(1, dojo.query('h3 > span > span > span', dojo.byId("st1", this.doc)).length);
					doh.is(1, dojo.query('h3 > span > span > span', this.doc.body.firstChild).length);
				}
			},
*/

			// :empty pseudo-selector
			"doh.is(4, dojo.query('#t > span:empty').length);",
			"doh.is(6, dojo.query('#t span:empty').length);",
			"doh.is(0, dojo.query('h3 span:empty').length);",
			"doh.is(1, dojo.query('h3 :not(:empty)').length);"

/*
			// escaping of ":" chars inside an ID
			function silly_IDs1(){
				doh.t(document.getElementById("silly:id::with:colons"));
				doh.is(1, dojo.query("#silly\\:id\\:\\:with\\:colons").length);
			},
			function NodeList_identity(){
				var foo = new dojo.NodeList([dojo.byId("container")]);
				doh.is(foo, dojo.query(foo));
			},
			function xml(){
				var doc = createDocument([
					"<ResultSet>",
						"<Result>One</Result>",
						"<RESULT>Two</RESULT>",
						"<result>Three</result>",
						"<result>Four</result>",
					"</ResultSet>"
				].join("")
				);
				var de = doc.documentElement;

				doh.is(2, dojo.query("result", de).length, "all lower");
				doh.is(1, dojo.query("Result", de).length, "mixed case");
				doh.is(1, dojo.query("RESULT", de).length, "all upper");
				doh.is(0, dojo.query("resulT", de).length, "no match");
				doh.is(0, dojo.query("rEsulT", de).length, "no match");
			},
			function xml_attrs(){
				var doc = createDocument([
					"<ResultSet>",
						"<RESULT thinger='blah'>Two</RESULT>",
						"<RESULT thinger='gadzooks'>Two</RESULT>",
					"</ResultSet>"
				].join(""));
				var de = doc.documentElement;

				doh.is(2, dojo.query("RESULT", de).length, "result elements");
				doh.is(0, dojo.query("RESULT[THINGER]", de).length, "result elements with attrs (wrong)");
				doh.is(2, dojo.query("RESULT[thinger]", de).length, "result elements with attrs");
				doh.is(1, dojo.query("RESULT[thinger=blah]", de).length, "result elements with attr value");
			},
			function sort(){
				var i = dojo.query("div");
				// smoke test
				i.sort(function(a,b){ return 1; })
			}
*/
		]
	);

};
