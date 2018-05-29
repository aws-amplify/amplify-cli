var specsSelectorExhaustive = function(context){
	specsSelectorExhaustiveOnTag(context, 'div');
	if (context.isXML(context.document)){
		specsSelectorExhaustiveOnTag(context, 'rect', 'http://www.w3.org/2000/svg');
	}
};

function specsSelectorExhaustiveOnTag(context, tag, ns){
	
	describe('CLASS on ' + tag, function(){
	
		var createElement = (ns && context.document.createElementNS) ? function(){
			return context.document.createElementNS(ns, tag);
		} : function(){
			return context.document.createElement(tag);
		};
		
		beforeEach(function(){
			testNodeOrphaned = createElement();
			testNode = createElement();
			bodyElement = context.document.getElementsByTagName('body')[0];
			bodyElement = bodyElement || context.document.documentElement;
			bodyElement.appendChild(testNode);
		});
		
		afterEach(function(){
			testNode && testNode.parentNode && testNode.parentNode.removeChild(testNode);
			testNode = null;
			testNodeOrphaned = null;
		});
		
		var it_should_select_classes = function(CLASSES){
			
			var testName = 'Should select element with class "'+ CLASSES.join(' ') +'"';
			var className = CLASSES.join(' ');
			if (className.indexOf('\\')+1) className += ' ' + CLASSES.join(' ').replace('\\','');
			
			it(testName + ' from the document root', function(){
				var tmpNode;
				tmpNode = createElement();tmpNode.setAttribute('class',className);tmpNode.setAttribute('className',className);testNode.appendChild(tmpNode);
				tmpNode = createElement();testNode.appendChild(tmpNode);
				tmpNode = createElement();testNode.appendChild(tmpNode);
				
				expect(context.SELECT || global.context.SELECT).toBeDefined();
				var result = (context.SELECT || global.context.SELECT)(testNode.ownerDocument, '.' + CLASSES.join('.'));
				expect( result.length ).toEqual( 1 );
				if (result.length){
				  expect( (typeof result[0].className == 'string') ? result[0].className : result[0].getAttribute('class') ).toMatch( CLASSES.join(' ') );
				}
			});
			
			it(testName + ' from the parent', function(){
				var tmpNode;
				tmpNode = createElement();tmpNode.setAttribute('class',className);tmpNode.setAttribute('className',className);testNode.appendChild(tmpNode);
				tmpNode = createElement();testNode.appendChild(tmpNode);
				tmpNode = createElement();testNode.appendChild(tmpNode);
				
				expect(context.SELECT || global.context.SELECT).toBeDefined();
				var result = (context.SELECT || global.context.SELECT)(testNode, '.' + CLASSES.join('.'));
				expect( result.length ).toEqual( 1 );
				expect( (typeof result[0].className == 'string') ? result[0].className : result[0].getAttribute('class') ).toMatch( CLASSES.join(' ') );
			});
			
			it(testName + ' orphaned', function(){
				var tmpNode;
				tmpNode = createElement();tmpNode.setAttribute('class',className);tmpNode.setAttribute('className',className);testNodeOrphaned.appendChild(tmpNode);
				tmpNode = createElement();testNodeOrphaned.appendChild(tmpNode);
				tmpNode = createElement();testNodeOrphaned.appendChild(tmpNode);
				
				expect(context.SELECT || global.context.SELECT).toBeDefined();
				var result = (context.SELECT || global.context.SELECT)(testNodeOrphaned, '.' + CLASSES.join('.'));
				expect( result.length ).toEqual( 1 );
				expect( (typeof result[0].className == 'string') ? result[0].className : result[0].getAttribute('class') ).toMatch( CLASSES.join(' ') );
			});
			
			// it should match this class as a second class
			if (CLASSES.length == 1) it_should_select_classes(['foo',CLASSES[0]]);
		};
		
		it_should_select_classes(CLASSES);
		
		for (var i=0; i < CLASSES.length; i++) it_should_select_classes([CLASSES[i]]);
		
	});
	
};
