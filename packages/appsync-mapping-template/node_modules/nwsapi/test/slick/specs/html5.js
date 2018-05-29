var specsHTML5 = function(context){

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

describe('HTML5 new tags', function(){

	itShouldFind(2, 'section');
	itShouldFind(1, '#page header nav');
	itShouldFind(1, 'header[role="banner"]');
	
});

describe('HTML5 new input types', function(){

	itShouldFind(1, 'input[type="search"]');

});

};