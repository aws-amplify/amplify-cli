var specsAssetsTemplateXML = function(context){
	
	describe('SELECT Selector Engine on XML file', function(){
		
		var makeSlickTestSearch = function(selector, count, disableQSA) {
			return function(){
				context.SELECTOR.disableQSA = !!disableQSA;
				var els = context.SELECT(context.document, selector);
				var nFoundEls = els.length;
				expect( nFoundEls ).toEqual( count );
				//if (nFoundEls) expect( context.MATCH(els[0], selector, context.document) ).toEqual( true );
				delete context.SELECTOR.disableQSA;
			};
		};
		
		var it_should_find = function(count, selector){
			if (global.document.querySelectorAll && !global.cannotDisableQSA)
				it('should find '+count+' `'+selector+'` with    QSA', makeSlickTestSearch(selector, count, false));
			it('should find '+count+' `'+selector + (!global.cannotDisableQSA ? '` without QSA' : ''), makeSlickTestSearch(selector, count, true));
		};
		
		it_should_find(17 , '*');
		
		it_should_find(1  , 'HTML');
		it_should_find(1  , '#id_idnode');
		it_should_find(1  , '[id=id_idnode]');
		it_should_find(3  , '.class_classNode');
		it_should_find(3  , '[class=class_classNode]');
		it_should_find(0  , '[className=class_classNode]');
		it_should_find(3  , 'camelCasedTag');
		it_should_find(1  , '#node[style=border]');
		it_should_find(1  , '[href^="http://"]');
		
		it_should_find(1  , ':root');
		it_should_find(0  , 'html:root');
		it_should_find(1  , 'HTML:root');
		
		// Remove custom selectors (jddalton)
		// it_should_find(1  , 'camelCasedTag ! :root');
		// it_should_find(0  , ':root !>');
		
		it_should_find(3  , ':root camelCasedTag');
		
		it_should_find(3  , '[tabindex]');
		it_should_find(2  , 'el[tabindex="0"]');
		it_should_find(1  , 'el[tabindex="1"]');
		
	});
	
};
