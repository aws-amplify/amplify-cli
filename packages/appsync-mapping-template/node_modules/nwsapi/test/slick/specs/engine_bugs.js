var specsSelectorEngineBugs = function(context){
	
	describe('Bugs', function(){
		var rootElement;
		var testNode;
		var isXML = !isHTML(context.document);//context.isXML(context.document);
		
		var setup = function(){
			testNode = context.document.createElement('div');
			rootElement = context.document.getElementsByTagName('body')[0];
			rootElement = rootElement || context.document.documentElement;
			if (rootElement)
				rootElement.appendChild(testNode);
		}; 
		beforeEach(setup);
		
		var teardown = function(){
			testNode && testNode.parentNode && testNode.parentNode.removeChild(testNode);
			testNode = null;
		};
		afterEach(teardown);
		
		it('document should have a documentElement', function(){
			expect( context.document.documentElement ).toBeDefined();
			expect( context.document.documentElement.childNodes.length ).toBeDefined();
		});
	
		it('document should have nodes', function(){
			expect( context.document.getElementsByTagName('*').length ).not.toEqual( 0 );
		});
	
		it('should not return not-nodes', function(){
			var results = context.SELECT(context.document,'*');
		
			for (var i=0; i < results.length; i++) {
				expect( results[i] ).toBeDefined();
				expect( results[i].nodeName ).toBeDefined();
			}
		});
	
		it('should not return close nodes', function(){
			var results = context.SELECT(context.document,'*');
		
			for (var i=0; i < results.length; i++) {
				expect( results[i].nodeName ).not.toMatch(/^\//);
			}
		});
	
		var starIncludesClosedNodes = !!$try(function(){
			return context.document.createElement('/foo').nodeName.substring(0, 1) == '/';
		});
	
		if (starIncludesClosedNodes && context.document && context.document.querySelectorAll && !global.cannotDisableQSA)
		it('should not return closed nodes with QSA', function(){
			teardown();setup();
			testNode.innerHTML = 'foo</foo>';
			var results = context.SELECT(testNode,'*');
		
			for (var i=0; i < results.length; i++) {
				expect( results[i].nodeName ).toMatch(/^\w+$/);
			}
		});
	
		if (starIncludesClosedNodes)
		it('should not return closed nodes ' + (!global.cannotDisableQSA ? '` without QSA' : ''), function(){
			teardown();setup();
			var tmpNode;
			tmpNode = context.document.createElement('/foo');testNode.appendChild(tmpNode);
			expect( tmpNode.nodeName ).toEqual('/foo');
		
			context.SELECT.disableQSA = true;
			var results = context.SELECT(testNode,'*');
			context.SELECT.disableQSA = false;
		
			for (var i=0; i < results.length; i++) {
				expect( results[i].nodeName ).toMatch(/^\w+$/);
			}
		});
	
		//it('should not return closed nodes2', function(){
		//testNode.innerHTML = '<foo>foo</foo> <bar>bar</bar> <baz>baz</baz>';
		//
		//var results = context.SELECT(testNode, '*');
		//	expect( results.length ).toEqual(3);
		//});
	
		it('should not return comment nodes', function(){
			var results = context.SELECT(context.document,'*');
		
			for (var i=0; i < results.length; i++) {
				expect( results[i].nodeName ).not.toMatch(/^#/);
			}
		});
	
		it('should return an element with the second class defined to it', function(){
			teardown();setup();
			
			var className = 'class1 class2';
			var tmpNode;
			tmpNode = context.document.createElement('span');
			tmpNode.setAttribute('class',className);
			tmpNode.setAttribute('className',className);
			testNode.appendChild(tmpNode);
		
			// expect( tmpNode.getAttribute('class') ).toEqual( className );
			// expect( testNode.childNodes.length ).toEqual( 1 );
			// expect( testNode.firstChild ).toEqual( tmpNode );
			// 
			// expect( testNode.className || tmpNode.getAttribute('class') ).toMatch( new RegExp('(^|\\s)' + Slick.parse.escapeRegExp(className.split(' ')[0]) + '(\\s|$)') );
			// expect( testNode.className || tmpNode.getAttribute('class') ).toMatch( new RegExp('(^|\\s)' + Slick.parse.escapeRegExp(className.split(' ')[1]) + '(\\s|$)') );
		
			// if (!tmpNode.className){
			// 	for (var mockName in global.mocks) {
			// 		if (context == global.mocks[mockName]) alert(mockName);
			// 	}
			// }
		
			// expect( tmpNode.className ).toMatch( new RegExp('(^|\\s)' + Slick.parse.escapeRegExp(className.split(' ')[0]) + '(\\s|$)') );
			// expect( tmpNode.className ).toMatch( new RegExp('(^|\\s)' + Slick.parse.escapeRegExp(className.split(' ')[1]) + '(\\s|$)') );
		
			// if (!test) test = function(value){
			// 	return value && regexp.test(value);
			// }
			// new RegExp('(^|\\s)' + Slick.parse.escapeRegExp(className) + '(\\s|$)');
		
			var results = context.SELECT(testNode, '.class2');
			expect( results[0] ).toEqual(tmpNode);
		});
	
		it('should return the elements with passed class', function(){
			teardown();setup();
			var results;
		
			var tmpNode1; tmpNode1 = context.document.createElement('span'); tmpNode1.setAttribute('class','b'); tmpNode1.setAttribute('className','b'); testNode.appendChild(tmpNode1);
			var tmpNode2; tmpNode2 = context.document.createElement('span'); tmpNode2.setAttribute('class','b'); tmpNode2.setAttribute('className','b'); testNode.appendChild(tmpNode2);
		
		
			expect( context.SELECT(testNode, '.b', []).length ).toEqual(2);
//			expect( context.SELECT(testNode, '.f', []).length ).toEqual(0);
			expect( context.SELECT(testNode, '[class|=b]', []).length ).toEqual(2);
			expect( context.SELECT(testNode, '[class=b]', []).length ).toEqual(2);
		
			expect( context.SELECT(testNode, '.b', []).length ).not.toEqual(0);
//			expect( context.SELECT(testNode, '.f', []).length ).toEqual(0);
		
			results = context.SELECT(testNode, '.b');
			expect( results.length ).toEqual(2);
		
			expect( tmpNode1.getAttribute('class') ).toEqual('b');
		
			tmpNode1.removeAttribute('class');
			tmpNode1.removeAttribute('className');
			expect( tmpNode1.getAttribute('class') ).toBeNull();
		
			tmpNode1.setAttribute('class','f');
			tmpNode1.setAttribute('className','f');
		
			expect( tmpNode1.getAttribute('class') ).toEqual('f');
			expect( context.SELECT(tmpNode1, '.b', []).length ).toEqual(0);
			expect( context.SELECT(testNode, '.f', [])[0] ).toEqual(tmpNode1);
		
			expect( context.SELECT(testNode, '.b', []).length ).toEqual(1);
			expect( context.SELECT(testNode, '.f', []).length ).toEqual(1);
		
			results = context.SELECT(testNode, '.b');
			expect( results.length ).toEqual(1);
		
			tmpNode1.removeAttribute('class');
			tmpNode1.removeAttribute('className');
			tmpNode1.setAttribute('class','b');
			tmpNode1.setAttribute('className','b');
		
			results = context.SELECT(testNode, '.b');
			expect( results.length ).toEqual(2);
		});
	
		it('should return the element with passed id even if the context is not in the DOM', function(){
			teardown();setup();
			testNode.parentNode.removeChild(testNode);
			tmpNode = context.document.createElement('input');tmpNode.setAttribute('id', 'someuniqueid');tmpNode.setAttribute('type','text');testNode.appendChild(tmpNode);
		
			var results = context.SELECT(testNode, '#someuniqueid');
			expect( results.length ).toEqual(1);
			expect( results[0].tagName ).toMatch(/INPUT/i);
			expect( results[0].getAttribute('type') ).toEqual('text');
		});
	
	});
};


var specsBrowserBugsFixed = function(context){
	
	describe('Bugs Fixed', function(){

		var rootElement;
		var testNode, tmpNode, tmpNode1, tmpNode2, tmpNode3, tmpNode4, tmpNode5, tmpNode6, tmpNode7, tmpNode8, tmpNode9;
		var isXML = !isHTML(context.document);
		var results, resultsArray;
		var setup = function(){
			testNode = context.document.createElement('div');
			rootElement = context.document.getElementsByTagName('body')[0];
			rootElement = rootElement || context.document.documentElement;
			rootElement.appendChild(testNode);
		};
		var teardown = function(){
			testNode && testNode.parentNode && testNode.parentNode.removeChild(testNode);
			testNode = null;
		};

		describe('SELECT [name]', function(){
		
			beforeEach(setup);
			afterEach(teardown);
	
			it('Should match name attribute', function(){
				teardown();setup();
		
				tmpNode2 = context.document.createElement('input');tmpNode2.setAttribute('id',  'getelementsbyname');tmpNode2.setAttribute('type','password');testNode.appendChild(tmpNode2);
				tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('name','getelementsbyname');tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
		
				results = context.SELECT(testNode,'[name=getelementsbyname]',[]);
				expect( results ).toContain(tmpNode1);
		
				teardown();setup();
		
				tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('name','getelementsbyname');tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
				tmpNode2 = context.document.createElement('input');tmpNode2.setAttribute('id',  'getelementsbyname');tmpNode2.setAttribute('type','password');testNode.appendChild(tmpNode2);
		
				results = context.SELECT(testNode,'[name=getelementsbyname]',[]);
				expect( results ).toContain(tmpNode1);
			});
	
			it('Should NOT match id attribute', function(){
				teardown();setup();
		
				tmpNode2 = context.document.createElement('input');tmpNode2.setAttribute('id',  'getelementsbyname');tmpNode2.setAttribute('type','password');testNode.appendChild(tmpNode2);
				tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('name','getelementsbyname');tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
		
				results = context.SELECT(testNode,'[name=getelementsbyname]');
				for (var i=0; i < results.length; i++) {
					// expect( results[i] ).not.toEqual( tmpNode2 );
					expect( results[i] == tmpNode2 ).toEqual(false);
				}
		
				teardown();setup();
		
				tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('name','getelementsbyname');tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
				tmpNode2 = context.document.createElement('input');tmpNode2.setAttribute('id',  'getelementsbyname');tmpNode2.setAttribute('type','password');testNode.appendChild(tmpNode2);
		
				results = context.SELECT(testNode,'[name=getelementsbyname]');
				for (var i=0; i < results.length; i++) {
					// expect( results[i] ).not.toEqual( tmpNode2 );
					expect( results[i] == tmpNode2 ).toEqual(false);
				}
			});
	
		});

		describe('SELECT #', function(){
	
			beforeEach(setup);
			afterEach(teardown);
	
			it('Should NOT match name attribute', function(){
				teardown();setup();
		
				tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('name','getelementbyid');tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
				tmpNode2 = context.document.createElement('input');tmpNode2.setAttribute('id',  'getelementbyid');tmpNode2.setAttribute('type','password');testNode.appendChild(tmpNode2);
		
				results = context.SELECT(testNode,'#getelementbyid',[]);
				expect( results[0] == tmpNode1).toEqual(false);
				// expect( results ).not.toEqual([tmpNode1]);
				// expect( results[0] ).not.toEqual(tmpNode1);
			});
	
			if( !isXML )
			it('Should NOT match name attribute, using innerHTML', function(){
				teardown();setup();
		
				testNode.innerHTML = '<input name="getelementbyid" type="text" /><input id="getelementbyid" type="password" />';
				tmpNode1 = testNode.firstChild;
				tmpNode2 = testNode.lastChild;
		
				results = context.SELECT(testNode,'#getelementbyid',[]);
				expect( results[0] == tmpNode1).toEqual(false);
			});
	
			it('Should match id attribute, even when another element has that [name]', function(){
				teardown();setup();
		
				tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('name','getelementbyid');tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
				tmpNode2 = context.document.createElement('input');tmpNode2.setAttribute('id',  'getelementbyid');tmpNode2.setAttribute('type','password');testNode.appendChild(tmpNode2);
				tmpNode3 = context.document.createElement('input');tmpNode3.setAttribute('name','getelementbyid');tmpNode3.setAttribute('type','text');testNode.appendChild(tmpNode3);
		
				results = context.SELECT(testNode,'#getelementbyid',[]);
				// expect( results ).toEqual([tmpNode2]);
				// expect( results[0] ).toEqual(tmpNode2);
				expect( results[0] == tmpNode2).toEqual(true);
			});
	
			if( !isXML )
			it('Should match id attribute, even when another element has that [name], using innerHTML', function(){
				teardown();setup();
		
				testNode.innerHTML = '<input name="getelementbyid" type="text" /><input id="getelementbyid" type="password" /><input name="getelementbyid" type="text" />';
				tmpNode1 = testNode.childNodes[0];
				tmpNode2 = testNode.childNodes[1];
				tmpNode3 = testNode.childNodes[2];
		
				results = context.SELECT(testNode,'#getelementbyid',[]);
				// expect( results ).toEqual([tmpNode2]);
				// expect( results[0] ).toEqual(tmpNode2);
				expect( results[0] == tmpNode2).toEqual(true);
			});

			if( !isXML )
			it('Should get just the first matched element with passed id, using innerHTML', function(){
				teardown();setup();
		
				testNode.innerHTML = '<input name="getelementbyid" type="text" /><input id="getelementbyid" type="password" /><input name="getelementbyid" type="text" /><input id="getelementbyid" type="text" />';
				tmpNode1 = testNode.childNodes[0];
				tmpNode2 = testNode.childNodes[1];
				tmpNode3 = testNode.childNodes[2];
				tmpNode4 = testNode.childNodes[3];
		
				results = context.SELECT(testNode,'#getelementbyid',[]);
				// expect( results ).toEqual([tmpNode2]);
				// expect( results[0] ).toEqual(tmpNode2);
				expect( results[0] == tmpNode2 ).toEqual(true);
				expect( results.length ).toEqual(1);
			});
	
			if( !isXML )
			it('Should get just the first matched element with passed id, using innerHTML, changing nodes orders', function(){
				teardown();setup();
		
				testNode.innerHTML = '<input id="getelementbyid" type="password" /><input name="getelementbyid" type="text" /><input name="getelementbyid" type="text" /><input id="getelementbyid" type="text" />';
				tmpNode1 = testNode.childNodes[0];
				tmpNode2 = testNode.childNodes[1];
				tmpNode3 = testNode.childNodes[2];
				tmpNode4 = testNode.childNodes[3];
		
				results = context.SELECT(testNode,'#getelementbyid',[]);
				// expect( results ).toEqual([tmpNode2]);
				// expect( results[0] ).toEqual(tmpNode2);
				expect( results[0] == tmpNode1 ).toEqual(true);
				expect( results.length ).toEqual(1);
			});
	
		});

		describe('SELECT :selected', function(){
	
			beforeEach(setup);
			afterEach(teardown);
	
			if( !isXML )
			it('Should match the selected option', function(){
				teardown();setup();
		
				testNode.innerHTML = '<select><option value="1">opt1</option><option value="2">opt2</option></select>';
				tmpNode1 = testNode.firstChild;
				tmpNode2 = tmpNode1.firstChild;
				tmpNode3 = tmpNode1.lastChild;
		
				results = context.SELECT(testNode, ':selected');
				expect(results.length).toEqual(1);
				expect(results[0] === tmpNode2).toEqual(true);
			});
	
			if( !isXML )
			it('Should not match the first element from a multiple select', function(){
				teardown();setup();
		
				testNode.innerHTML = '<select multiple="multiple"><option value="1">opt1</option><option value="2" selected="selected">opt2</option></select>';
				tmpNode1 = testNode.firstChild;
				tmpNode2 = tmpNode1.firstChild;
				tmpNode3 = tmpNode1.lastChild;
		
				results = context.SELECT(testNode, ':selected');
				expect(results.length).toEqual(1);
				expect(results[0] === tmpNode3).toEqual(true);
			});

		});
	});
};
