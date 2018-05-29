var specsSlickHtml = function(context){

var makeSlickTestSearch = function(selector, count, disableQSA) {
	return function(){
		context.SELECTOR.disableQSA = !!disableQSA;
		var selectedArray = context.SELECT(context.document, selector);
		var selected = context.SELECT1(context.document, selector);
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

var itShouldFind = function(count, selector){
	if (global.document.querySelectorAll && !global.cannotDisableQSA)
		it('should find '+count+' `'+selector+'` with    QSA', makeSlickTestSearch(selector, count, false));
	it('should find '+count+' `'+selector + (!global.cannotDisableQSA ? '` without QSA' : ''), makeSlickTestSearch(selector, count, true));
};

describe('Slick', function(){

	itShouldFind(1, 'body a[tabindex="0"]');
	itShouldFind(1, 'body a[tabindex="1"]');
	itShouldFind(2, 'body a[tabindex]');
	itShouldFind(2, 'body [tabindex="0"]');
	itShouldFind(2, 'body [tabindex="1"]');
	itShouldFind(4, 'body [tabindex]');

/*
	describe('Combinators', function(){

		it('should find `~`', function(){
			expect(context.SELECT1(context.document.getElementById('one'), '~')).not.toBeNull();
		});
		it('should find `~div`', function(){
			expect(context.SELECT1(context.document.getElementById('one'), '~div')).not.toBeNull();
		});
		it('should find `> i`', function(){
			expect(context.SELECT1(context.document.getElementById('one'), '> i')).not.toBeNull();
		});
		it('should find `+`', function(){
			expect(context.SELECT1(context.document.getElementById('one'), '+')).not.toBeNull();
		});
		it('should find `+div`', function(){
			expect(context.SELECT1(context.document.getElementById('one'), '+div')).not.toBeNull();
		});

	});
*/


});

};
