var specsMockTemplate = function(context){
	
	var makeSlickTestSearch = function(selector, count, disableQSA, subContext) {
		return function(){
			context.SELECTOR.disableQSA = !!disableQSA;
			var selectedArray = context.SELECT(subContext || context.document, selector);
			var selected = context.SELECT1(subContext || context.document, selector);
			expect( selectedArray.length ).toEqual( count );
			if (count){
				expect( selected ).not.toBeNull();
				expect( selected ).toEqual(selectedArray[0]);
				expect( context.MATCH(selectedArray[0], selector) ).toEqual( true );
			} else {
				expect( selected ).toBeNull();
			}
			delete context.SELECTOR.disableQSA;
		};
	};
	
	var it_should_find = function(count, selector, subContext){
		if (global.document.querySelectorAll && !global.cannotDisableQSA)
			it('should find '+count+' `'+selector+'` with    QSA', makeSlickTestSearch(selector, count, false, subContext));
		it('should find '+count+' `'+selector + (!global.cannotDisableQSA ? '` without QSA' : ''), makeSlickTestSearch(selector, count, true, subContext));
	};
	
	it_should_find(1, 'html');
	it_should_find(1, 'body');
	
	// removes 'tel:' 'a' tags that are just grabbed by iphone
	it_should_find(1814, 'body *:not([href^="tel:"])');
	
	it_should_find(1, 'html');
	it_should_find(1, 'body');
	it_should_find(1, 'head');
	it_should_find(59, 'div');
	
	it_should_find(43, '.example');
	it_should_find(14, '.note');
	it_should_find(5, '.fn');
	
	it_should_find(4, '.a1');
	it_should_find(2, '.a1 .a1');
	it_should_find(2, '.a1   .a1');
	it_should_find(2, '.a1 > .a1');
	it_should_find(0, '.a1 + .a1');
	
	it_should_find(12, '.a1   *');
	it_should_find(3, '.a1 > *');
	it_should_find(2, '.a1 + *');
	it_should_find(6, '.a1 ~ *');
	
/*
	it("should count '.a1 !  *'", function(){
		
		var result = {};
		
		var ancestors = [];
		var ancestors_length = 0;
		var things = context.SELECT(context.document,'.a1');
		var dad;
		for (var i=0; i < things.length; i++) {
			dad = things[i];
			while ((dad = dad.parentNode) && dad != context.document) ancestors.push(dad);
		}
		
		// 
		var dupes = [];
		var uniques = [];
		var results = ancestors;
		var dupe = false;
		
		for (var i=0; i < results.length; i++) {
			for (var u=0; u < uniques.length; u++) {
				if (results[i] == uniques[u]){
					dupe = true;
					break;
				}
			}
			
			if (dupe)
				dupes.push(results[i]);
			else
				uniques.push(results[i]);
			
			dupe = false;
		}
		
		expect( uniques.length ).toEqual( 7 );
		// expect( dupes.length ).toEqual( 0 );
		// 
	});
*/
	
  // Remove custom selectors (jddalton)
	// it_should_find(6, '.a1 !  *');
	// it_should_find(4, '.a1 !> *');
	// it_should_find(2, '.a4 !+ *');
	// it_should_find(4, '.a4 !~ *');
	
	it_should_find(4, '.a4');
	it_should_find(2, '.a4   .a4');
	it_should_find(2, '.a4 > .a4');
	it_should_find(0, '.a4 + .a4');
	
	
	it_should_find(324  , 'body [class]:not([href^="tel:"])');
	it_should_find(13   , 'body [title]:not([href^="tel:"])');
	it_should_find(1490 , 'body :not([class]):not([href^="tel:"])');
	it_should_find(1801 , 'body :not([title]):not([href^="tel:"])');
	;
	it_should_find(59  , 'body div');

/*
	it('should not return duplicates for "* *"', function(){
		context.SELECT.disableQSA = true;
		
		var dupes = [];
		var uniques = [];
		var results = context.SELECT(context.document,'* *');
		var dupe = false;
		
		var dupe_uids = [];
		
		for (var i=0; i < results.length; i++) {
			for (var u=0; u < uniques.length; u++) {
				if (results[i] == uniques[u]){
					dupe = true;
					break;
				}
			}
			
			if (dupe) {
				dupes.push(results[i]);
			}
			else
				uniques.push(results[i]);
			
			dupe = false;
		}
		expect( dupes.length ).toEqual( 0 );
		
		context.SELECT.disableQSA = false;
	});
	it('should not return duplicates for "* *[class]"', function(){
		context.SELECT.disableQSA = true;
		// console.log('should not return duplicates for "* *[class]"');
		// window['should not return duplicates for "* *[class]"'] = true;
		var dupes = [];
		var uniques = [];
		var results = context.SELECT(context.document,'* *[class]');
		var dupe = false;
		
		var dupe_uids = [];
		
		for (var i=0; i < results.length; i++) {
			for (var u=0; u < uniques.length; u++) {
				if (results[i] == uniques[u]){
					dupe = true;
					break;
				}
			}
			
			if (dupe) {
				dupes.push(results[i]);
			}
			else
				uniques.push(results[i]);
			
			dupe = false;
		}
		// expect( dupes.length ).toEqual( 0 );
		// window['should not return duplicates for "* *[class]"'] = false;
		// console.log('/should not return duplicates for "* *[class]"');
		
		context.SELECT.disableQSA = false;
	});
	it('should not return duplicates for "* *" manually', function(){
		context.SELECT.disableQSA = true;
		
		var dupes = [];
		var uniques = [];
		var results0 = context.document.getElementsByTagName('*');
		var results = [];
		for (var i=0; i < results0.length; i++) {
			results.concat( Array.prototype.slice.call(results0[i].getElementsByTagName('*')) );
		}
		var dupe = false;
		
		var dupe_uids = [];
		
		for (var i=0; i < results.length; i++) {
			for (var u=0; u < uniques.length; u++) {
				if (results[i] == uniques[u]){
					dupe = true;
					break;
				}
			}
			
			if (dupe) {
				dupes.push(results[i]);
			}
			else
				uniques.push(results[i]);
			
			dupe = false;
		}
		value_of( dupes.length ).should_be( 0 );
		
		context.SELECT.disableQSA = false;
	});
*/

	it('should not return duplicates for "div p"', function(){
		context.SELECT.disableQSA = true;
		
		var dupes = [];
		var uniques = [];
		var results = context.SELECT(context.document,'div p');
		var dupe = false;
		
		for (var i=0; i < results.length; i++) {
			for (var u=0; u < uniques.length; u++) {
				if (results[i] == uniques[u]){
					dupe = true;
					break;
				}
			}
			
			if (dupe)
				dupes.push(results[i]);
			else
				uniques.push(results[i]);
			
			dupe = false;
		}
		
		expect( dupes.length ).toEqual( 0 );
		expect( uniques.length ).toEqual( 140 );
		
		context.SELECT.disableQSA = false;
	});
	it_should_find(140 , 'div p');
	it_should_find(140 , 'div  p');

	it_should_find(134 , 'div > p');
	it_should_find(22  , 'div + p');
	it_should_find(183 , 'div ~ p');

	var div;
	div = context.document.getElementsByTagName('div')[2];
	it_should_find(3, 'p', div);
//	it_should_find(5, '> *', div);
//	it_should_find(3, '> p', div);
//	it_should_find(1, '+ *', div);
//	it_should_find(1, '+ p', div);
//	it_should_find(281, '~ *', div);
//	it_should_find(152, '~ p', div);

	it_should_find(43  , 'div[class^=exa][class$=mple]');
	it_should_find(12  , 'div p a:not([href^="tel:"])');
	it_should_find(683 , 'div,p,a:not([href^="tel:"])');

	it_should_find(43 , 'DIV.example');
	it_should_find(43 , 'DiV.example');
	it_should_find(12 , 'ul .tocline2');
	it_should_find(44 , 'div.example,div.note');

	it_should_find(1 , '#title');
	it_should_find(0 , '#theres_no_such_id');
	it_should_find(1 , 'h1#title');
	it_should_find(1 , 'body #title');

	it_should_find(12 , 'ul.toc li.tocline2');
	it_should_find(12 , 'ul.toc > li.tocline2');
	it_should_find(0  , 'h1#title + div > p');
	
	// it_should_find((function(){
	// 	var count = 0;
	// 	var elements = template.getElementsByTagName('h1');
	// 	for (var i=0; i < elements.length; i++) {
	// 		if (elements[i].id != null && elements[i].id != '')
	// 			if (/Selectors/.test(elements[i].innerText || elements[i].textContent)) count++;
	// 	}
	// 	return count;
	// })(), 'h1[id]:contains(Selectors)');
	
	// pseudos
	it_should_find(16,  'div:not(.example)');
	it_should_find(158, 'p:nth-child(even)');
	it_should_find(158, 'p:nth-child(2n)');
	it_should_find(166, 'p:nth-child(odd)');
	it_should_find(166, 'p:nth-child(2n+1)');
	it_should_find(324, 'p:nth-child(n)');
	it_should_find(3,   'p:only-child');
	it_should_find(19,  'p:last-child');
	it_should_find(54,  'p:first-child');
	
	it_should_find(1  , ':root');
	it_should_find(1  , 'html:root > head:first-child');
	it_should_find(0  , 'body:root');
	
	// Remove custom selector (jddalton)
	// it_should_find(1  , 'a ! :root');
	
	it_should_find(12 , ':root ul .tocline2');
	it_should_find(0  , 'body :root');
	
	// specs['":contains()" elements should actually contain the word'] = function(){
	// 	var els = context.SELECT(context.document,':contains(selectors)');
	// 	for (var i=0,el; el=els[i]; i++) value_of( el.innerHTML ).should_match( 'selectors' );
	// 	
	// 	els = context.SELECT(context.document,':contains(Selectors)');
	// 	for (i=0; el=els[i]; i++) value_of( el.innerHTML ).should_match( 'Selectors' );
	// };
	// 
	// it_should_find((function(){
	// 	var count = 0;
	// 	var elements = template.getElementsByTagName('h1');
	// 	for (var i=0; i < elements.length; i++) {
	// 		if (elements[i].id != null && elements[i].id != '')
	// 			if (/Selectors/.test(elements[i].innerText || elements[i].textContent)) count++;
	// 	}
	// 	return count;
	// })(),'h1[id]:contains("Selectors")');
	
	// Remove custom selectors (jddalton)
	// it_should_find(58,':contains(Selectors)');
	// it_should_find(58,":contains('Selectors')");
	// it_should_find(58,':contains("Selectors")');
	
	it_should_find(1,'[href][lang][class]');
	// it_should_find((function(){
	// 	var count = 0;
	// 	var elements = template.getElementsByTagName('*');
	// 	for (var i=0; i < elements.length; i++) {
	// 		if (elements[i].className != null && elements[i].className != '') count++;
	// 	}
	// 	return count;
	// })(),'[class]');
	it_should_find(43, '[class=example]');
	it_should_find(43, '[class^=exa]');
	it_should_find(44, '[class$=mple]');
	
	// Remove invalid selectors (jddalton)
	// it_should_find(0  , '[class^=]');
	// it_should_find(0  , '[class$=]');
	// it_should_find(0  , '[class*=]');
	
	it_should_find(0  , '[class^=""]');
	it_should_find(0  , '[class$=""]');
	it_should_find(0  , '[class*=""]');
	
	// it_should_find((function(){
	// 	var count = 0;
	// 	var elements = template.getElementsByTagName('*');
	// 	for (var i=0; i < elements.length; i++) {
	// 		if (elements[i].className != null && elements[i].className.match(/e/)) count++;
	// 	}
	// 	return count;
	// })(),'[class*=e]');
	
	it_should_find(1,'[lang|=tr]');
	it_should_find(324,'[class][class!=made_up]');
	it_should_find(43,'[class~=example]');
	
};
