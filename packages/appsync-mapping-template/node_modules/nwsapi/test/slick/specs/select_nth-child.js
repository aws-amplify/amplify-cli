var specsSelectNthChild = function(context){
	
	describe('nth-child', function(){

		var document = context.document;
		var parent = document.createElement('div');
		
		for (var i = 1, el; i <= 10; i++){
			el = document.createElement('div');
			el.appendChild(document.createTextNode(i));
			parent.appendChild(el);
		};
		
		var shouldSelect = function(selector, items){
			var result = context.SELECT(parent, selector);
			expect(result.length).toEqual(items.length);
			for (var i = 0; i < result.length; i++){
				expect(result[i].firstChild.nodeValue).toEqual('' + items[i]);
			}
		};
		
		it('should match by index', function(){
			shouldSelect(':nth-child(0)', []);
			shouldSelect(':nth-child(1)', [1]);
			shouldSelect(':nth-child(10)', [10]);
			shouldSelect(':nth-child(11)', []);
		});
		if (!global.disableNegNth)
		it('should match by index with negative', function(){
			shouldSelect(':nth-child(-1)', []);
		});
		it('should match even', function(){
			shouldSelect(':nth-child(even)', [2, 4, 6, 8, 10]);
		});
		it('should match odd', function(){
			shouldSelect(':nth-child(odd)', [1, 3, 5, 7, 9]);
		});
		it('should select no elements', function(){
			shouldSelect(':nth-child(-n)', []);
			shouldSelect(':nth-child(4n+100)', []);
		});
		it('should select all elements', function(){
			shouldSelect(':nth-child(n)', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
			shouldSelect(':nth-child(-n+100)', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		});
		it('should skip a number of first elements', function(){
			shouldSelect(':nth-child(2n+5)', [5, 7, 9]);
			shouldSelect(':nth-child(n+8)', [8, 9, 10]);
		});
		if (!global.disableNegNth)
		it('should skip a number of last elements', function(){
			shouldSelect(':nth-child(-2n+5)', [1, 3, 5]);
			shouldSelect(':nth-child(-4n+2)', [2]);
			shouldSelect(':nth-child(-n+2)', [1, 2]);
		});
		it('should work with multiple nth-child selectors', function(){
			shouldSelect(':nth-child(2n):nth-child(3n+1)', [4, 10]);
			shouldSelect(':nth-child(n+3):nth-child(-n+5)', [3, 4, 5]);
		});
		it('should work with both nth-child and nth-last-child', function(){
			shouldSelect(':nth-child(odd):nth-last-child(odd)', []);
		});
	});
};
