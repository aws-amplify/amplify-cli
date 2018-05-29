var unitTests = function(){

	describe('Simple Selector Regex', function(){
		
		// TODO: how could i access this regex from here?
		var reSimpleSelector = /^([#.]?)((?:[\w-]+|\*))$/;
		
		beforeEach(function(){
			this.addMatchers({
				toBeSimpleSelector: function(){
					return reSimpleSelector.test(this.actual);
				}
			});
		});
		
		it('should match simple tag selectors', function(){
			expect('div').toBeSimpleSelector();
			expect('span').toBeSimpleSelector();
			expect('header').toBeSimpleSelector();
			expect('*').toBeSimpleSelector();
			expect('.a-more_complex-tag').toBeSimpleSelector();
		});
		
		it('should match simple id selectors', function(){
			expect('#id').toBeSimpleSelector();
			expect('#a-more_complex-id').toBeSimpleSelector();
		});
		
		it('should match simple class selectors', function(){
			expect('.class').toBeSimpleSelector();
			expect('.a-more_complex-class').toBeSimpleSelector();
		});
		
		it('should NOT match names with non-wordy chars', function(){
			expect('#dsdßå∂').not.toBeSimpleSelector();
			expect('.dsdßå∂').not.toBeSimpleSelector();
			expect('dsdß†¨∂ƒ').not.toBeSimpleSelector();
			expect('***').not.toBeSimpleSelector();
		});

		it('should NOT match attr selectors', function(){
			expect('[attr]').not.toBeSimpleSelector();
			expect('[attr=value]').not.toBeSimpleSelector();
			expect('[attr="value"]').not.toBeSimpleSelector();
			expect('[attr*="value"]').not.toBeSimpleSelector();
		});

		it('should NOT match pseudo-class selectors', function(){
			expect(':check').not.toBeSimpleSelector();
			expect(':custom').not.toBeSimpleSelector();
		});
		
		it('should NOT match complex selectors', function(){
			expect('div .class').not.toBeSimpleSelector();
			expect('div>.class').not.toBeSimpleSelector();
			expect('div #id .class').not.toBeSimpleSelector();
		});
		
	});

	describe('Empty Attribute Regex', function(){
		var reEmptyAttribute = /\[.+[*$^]=(?:""|'')?\]/;
		
		beforeEach(function(){
			this.addMatchers({
				toBeEmptyAtributeSelector: function(){
					return reEmptyAttribute.test(this.actual);
				}
			});
		});
		
		it('should match empty attribute selectors', function(){
			expect('[attr*=""]').toBeEmptyAtributeSelector();
			expect('[attr$=""]').toBeEmptyAtributeSelector();
			expect('[attr^=""]').toBeEmptyAtributeSelector();
			expect("[attr*='']").toBeEmptyAtributeSelector();
			expect("[attr$='']").toBeEmptyAtributeSelector();
			expect("[attr^='']").toBeEmptyAtributeSelector();
			expect('[attr*=]').toBeEmptyAtributeSelector();
			expect('[attr$=]').toBeEmptyAtributeSelector();
			expect('[attr^=]').toBeEmptyAtributeSelector();
			expect('#some .class [attr^=]').toBeEmptyAtributeSelector();
		});
	});
	
};

