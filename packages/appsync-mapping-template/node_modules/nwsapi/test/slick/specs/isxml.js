var specsIsXML = function(context){

	describe('is XML',function(){
		it('should be XML', function(){
			expect( context.document.nodeType ).toEqual(9);
			expect( context.document ).not.toEqual( global.document );
			expect(context.isXML(context.document)).toEqual(true);
		});
	});

};


var specsIsNotXML = function(context){

	describe('is not XML',function(){
		it('should not be XML', function(){
			expect( context.document.nodeType ).toEqual(9);
			expect( context.document ).not.toEqual( global.document );
			expect(context.isXML(context.document)).toEqual(false);
		});
	});
	
};