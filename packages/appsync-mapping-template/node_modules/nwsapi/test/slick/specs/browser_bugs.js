var specsBrowserBugs = function(specs, context){
	
	var rootElement;
	var testNode, tmpNode, tmpNode1, tmpNode2, tmpNode3, tmpNode4, tmpNode5, tmpNode6, tmpNode7, tmpNode8, tmpNode9;
	var result, results, resultsArray;

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

	describe('getElementsByName', function(){
		
		beforeEach(setup);
		afterEach(teardown);
		
		it('getElementsByName Should match name attribute', function(){
			tmpNode2 = context.document.createElement('input');tmpNode2.setAttribute('id',  'getelementsbyname');tmpNode2.setAttribute('type','password');testNode.appendChild(tmpNode2);
			tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('name','getelementsbyname');tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
			
			results = tmpNode1.ownerDocument.getElementsByName('getelementsbyname');
			expect( results ).toContain(tmpNode1);
			
			teardown(); setup();
			
			tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('name','getelementsbyname');tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
			tmpNode2 = context.document.createElement('input');tmpNode2.setAttribute('id',  'getelementsbyname');tmpNode2.setAttribute('type','password');testNode.appendChild(tmpNode2);
			
			results = tmpNode1.ownerDocument.getElementsByName('getelementsbyname');
			expect( results ).toContain(tmpNode1);
		});
		
		it('getElementsByName Should NOT match id attribute',  function(){
			
			tmpNode2 = context.document.createElement('input');tmpNode2.setAttribute('id',  'getelementsbyname');tmpNode2.setAttribute('type','password');testNode.appendChild(tmpNode2);
			tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('name','getelementsbyname');tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
			
			results = tmpNode1.ownerDocument.getElementsByName('getelementsbyname');
			for (var i=0; i < results.length; i++) {
				expect( results[i] ).not.toEqual( tmpNode2 );
			}
			
			teardown();setup();
			
			tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('name','getelementsbyname');tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
			tmpNode2 = context.document.createElement('input');tmpNode2.setAttribute('id',  'getelementsbyname');tmpNode2.setAttribute('type','password');testNode.appendChild(tmpNode2);
			
			results = tmpNode1.ownerDocument.getElementsByName('getelementsbyname');
			for (var i=0; i < results.length; i++) {
				expect( results[i] ).not.toEqual( tmpNode2 );
			}
		});
		
		it('getElementsByName Should match name attribute, using innerHTML', function(){
			testNode.innerHTML = '<input id="getelementsbyname" type="password" /><input name="getelementsbyname" type="text" />';
			tmpNode2 = testNode.firstChild;
			tmpNode1 = testNode.lastChild;
			
			results = tmpNode1.ownerDocument.getElementsByName('getelementsbyname');
			expect( results ).toContain(tmpNode1);
			
			teardown();setup();
			
			testNode.innerHTML = '<input name="getelementsbyname" type="password" /><input id="getelementsbyname" type="text" />';
			tmpNode1 = testNode.firstChild;
			tmpNode2 = testNode.lastChild;
			
			results = tmpNode1.ownerDocument.getElementsByName('getelementsbyname');
			expect( results ).toContain(tmpNode1);
		});
		
	});
	
	describe('getElementById', function(){
		
		beforeEach(setup);
		afterEach(teardown);
		
		it('getElementById Should NOT match name attribute', function(){
			tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('name','getelementbyid');tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
			tmpNode2 = context.document.createElement('input');tmpNode2.setAttribute('id',  'getelementbyid');tmpNode2.setAttribute('type','password');testNode.appendChild(tmpNode2);
			
			results = tmpNode1.ownerDocument.getElementById('getelementbyid');
			expect( results ).not.toEqual(tmpNode1);
		});
		
		//it('getElementById Should NOT mask element[id] with element[name]',
		it('getElementById Should match id attribute', function(){
			tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('name','getelementbyid');tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
			tmpNode2 = context.document.createElement('input');tmpNode2.setAttribute('id',  'getelementbyid');tmpNode2.setAttribute('type','password');testNode.appendChild(tmpNode2);
			
			results = tmpNode1.ownerDocument.getElementById('getelementbyid');
			expect( results ).toEqual(tmpNode2);
		});
		
		it('getElementsById Should match id attribute, using innerHTML', function(){
			testNode.innerHTML = '<input name="getelementbyid" type="password" /><input id="getelementbyid" type="text" />';
			tmpNode1 = testNode.firstChild;
			tmpNode2 = testNode.lastChild;
			
			results = tmpNode1.ownerDocument.getElementById('getelementbyid');
			expect( results ).toEqual(tmpNode2);
		});
		
	});
	
	if(context.document.getElementsByClassName && context.document.documentElement.getElementsByClassName)
	describe('getElementsByClassName', function(){
		
		beforeEach(setup);
		afterEach(teardown);
		
		it('getElementsByClassName Should match second class name', function(){
			tmpNode1 = context.document.createElement('input');tmpNode1.className = 'getelementsbyclassname secondclass';tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
			
			results = testNode.getElementsByClassName('secondclass');
			expect( results ).toContain(tmpNode1);
		});
		
		it('getElementsByClassName Should match second class name, using innerHTML', function(){
			testNode.innerHTML = '<a class="getelementsbyclassname secondclass"></a>';
			tmpNode1 = testNode.firstChild;
			
			results = testNode.getElementsByClassName('secondclass');
			expect( results ).toContain(tmpNode1);
		});
		
		it('getElementsByClassName Should not cache results', function(){
			testNode.innerHTML = '<a class="f"></a><a class="b"></a>';
			testNode.getElementsByClassName('b').length; //accessing a property is important here
			testNode.firstChild.className = 'b';
			
			results = testNode.getElementsByClassName('b');
			expect( results.length ).toEqual(2);
		});
		
	});
	
	describe('getElementsByTagName',function(){
		
		beforeEach(setup);
		afterEach(teardown);
		
		it('getElementsByTagName Should not return comment nodes with * selector', function(){
			tmpNode1 = context.document.createComment('');testNode.appendChild(tmpNode1);
			
			result = testNode.getElementsByTagName('*');
			expect( result.length ).toEqual(0);
		});
		
		it('getElementsByTagName Should not return closed nodes', function(){
			testNode.innerHTML = 'foo</foo>';
			result = testNode.getElementsByTagName('*');
			
			expect( result.length ).toEqual(0);
		});
		
	});
	
	if (context.document.querySelector)
	describe('querySelector', function(){
		
		beforeEach(setup);
		afterEach(teardown);
		
		it('querySelector Should start finding nodes from the passed context', function(){
			tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('id', 'queryselectorall');tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
			result = testNode.querySelector('div #queryselectorall');
			expect( result ).not.toEqual( tmpNode1 );
		});
		
		it('querySelector Should not return a comment node with * selector', function(){
			tmpNode1 = context.document.createComment('');testNode.appendChild(tmpNode1);
			result = testNode.querySelector('*');
			expect( result ).toBeNull();
		});
		
		it('querySelector Should not return closed nodes', function(){
			testNode.innerHTML = 'foo</foo>';
			result = testNode.querySelector('*');
			expect( result ).toBeNull();
		});
		
	});
	
	if(context.document.querySelectorAll)
	describe('querySelectorAll', function(){
		
		beforeEach(setup);
		afterEach(teardown);
		
		it('querySelectorAll Should start finding nodes from the passed context', function(){
			tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('id', 'queryselectorall');tmpNode1.setAttribute('type','text');testNode.appendChild(tmpNode1);
			results = testNode.querySelectorAll('div #queryselectorall');
			for (var i=0; i < results.length; i++) {
				expect( results[i] ).not.toEqual( tmpNode1 );
			}
		});
		
		it('querySelectorAll Should not return comment nodes with * selector', function(){
			tmpNode1 = context.document.createComment('');testNode.appendChild(tmpNode1);
			result = testNode.querySelectorAll('*');
			expect( result.length ).toEqual(0);
		});
		
		it('querySelectorAll Should not return closed nodes', function(){
			testNode.innerHTML = 'foo</foo>';
			result = testNode.querySelectorAll('*');
			expect( result.length ).toEqual(0);
		});
		
	});
	
	describe('xpath', function(){

		beforeEach(setup);
		afterEach(teardown);
		
		it('should implement selectNodes', function(){
			
			context.document.setProperty("SelectionLanguage", "XPath");
			
			expect( testNode.selectNodes('//*').length ).not.toEqual(0);
			expect( testNode.selectNodes('./*').length ).toEqual(0);
			
			tmpNode1 = context.document.createElement('input');tmpNode1.setAttribute('name','getelementbyid');tmpNode1.setAttribute('type','text'    );tmpNode1.setAttribute('class','tmpNode1class bar');testNode.appendChild(tmpNode1);
			tmpNode2 = context.document.createElement('input');tmpNode2.setAttribute('id',  'getelementbyid');tmpNode2.setAttribute('type','password');tmpNode2.setAttribute('class','tmpNode2class foo bar');testNode.appendChild(tmpNode2);
			tmpNode3 = context.document.createElement('input');tmpNode3.setAttribute('id',  'getelementbyid');tmpNode3.setAttribute('type','password');tmpNode3.setAttribute('class','tmpNode3class foo baz');testNode.appendChild(tmpNode3);
			tmpNode4 = context.document.createElement('input');tmpNode4.setAttribute('id',  'getelementbyid');tmpNode4.setAttribute('type','password');tmpNode4.setAttribute('class','tmpNode4class baz');testNode.appendChild(tmpNode4);
			
			expect( testNode.selectNodes('./*').length ).toEqual(4);
			
			var classes,children;
			
			classes = ['foo'];
			children = testNode.selectNodes(['./','input','[@class]'].join(''));
			expect( children.length ).toEqual( 4 );
			
			classes = ['foo','bar'];
			children = testNode.selectNodes(['./','input','[contains(concat(" ", @class, " "), " ',classes.join(' ")]'+'[contains(concat(" ", @class, " "), " '),' ")]'].join(''));
			expect( children.length ).toEqual( 1 );
			
			classes = ['baz','bar'];
			children = testNode.selectNodes(['./','input','[contains(concat(" ", @class, " "), " ',classes.join(' ")]'+'[contains(concat(" ", @class, " "), " '),' ")]'].join(''));
			expect( children.length ).toEqual( 0 );
			
			classes = ['baz','tmpNode3class','foo'];
			children = testNode.selectNodes(['./','input','[contains(concat(" ", @class, " "), " ',classes.join(' ")]'+'[contains(concat(" ", @class, " "), " '),' ")]'].join(''));
			expect( children.length ).toEqual( 1 );
			
			expect( context.document.documentElement.selectNodes('//*') ).toBeDefined();
			expect( context.document.selectNodes('//*') ).toBeDefined();
		});
		
	});
	//describe('matchesSelector', function(){});
	
};

//specsBrowserBugs({}, this);
//new Mock('', specsBrowserBugs);

