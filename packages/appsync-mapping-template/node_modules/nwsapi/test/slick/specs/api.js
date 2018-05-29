var specsSlickAPI = function(context){
	
	describe('Select Inputs', function(){
		
		var SELECT = (context.SELECT || global.SELECT);
		
		describe('append', function(){
			
			it('should append results to an existing array if passed in', function(){
				var append = [];
				expect( SELECT(context.document, '*', append) === append ).toEqual(true);
			});
			
			it('should append results to an existing array-like-thing if passed in',  function(){
				var append = {
					length: 0,
					push: function(item){
						this[this.length++] = item;
					}
				};
				expect( SELECT(context.document, '*', append) ).toEqual( append );
			});
			
			if (document.querySelectorAll)
			it('should not fail when using QSA is enabled', function(){
				context.Slick && (context.Slick.disableQSA = false);
				expect( typeof SELECT(context.document, '*').length ).toEqual('number');
				expect( SELECT(context.document, '*').length ).not.toEqual(0);
			});
			
		});
		
		describe('context', function(){
			var SELECT = (context.SELECT || global.SELECT);
			
			it('must accept a document', function(){
				expect( SELECT(context.document, '*', []) ).not.toEqual( [] );
			});
			
			it('must accept a node', function(){
				expect( SELECT(context.document.documentElement, '*', []).length ).not.toEqual( 0 );
			});
			
			it('must accept any node',  function(){
				expect( SELECT(context.document.documentElement, '*', []).length ).not.toEqual( 0 );
				var timedLog;
				var elements = context.document.getElementsByTagName('*');
				for (var i=0, l=elements.length; i < l; i++) {
					if (elements[i].nodeType != 1) continue;
					
					if (global.console && global.console.log)
					timedLog = setTimeout(function(){
						console.log(elements[i]);
					}, 100);
					
					if (elements[i].getElementsByTagName('*').length)
						expect( SELECT(elements[i], '*', []).length ).not.toEqual( 0 );
					else
						expect( SELECT(elements[i], '*', []).length ).toEqual( 0 );
					
					clearTimeout(timedLog);
				}
			});
			
			it('must accept a window', function(){
				expect( SELECT(global.window, '*', []).length ).not.toEqual( 0 );
				if (context.window && !context.window.fake)
					expect( SELECT(context.window, '*', []).length ).not.toEqual( 0 );
			});
			
			it('must reject null', function(){ expect( SELECT(null, '*', []).length ).toEqual( 0 ); });
			it('must reject Number', function(){ expect( SELECT(1234567891011, '*', []).length ).toEqual( 0 ); });
			it('must reject Array ', function(){ expect( SELECT([1,2,3,4,5,6], '*', []).length ).toEqual( 0 ); });
			it('must reject String', function(){ expect( SELECT("string here", '*', []).length ).toEqual( 0 ); });
			it('must reject Object',  function(){ expect( SELECT({ foo:'bar' }, '*', []).length ).toEqual( 0 ); });
			
		});
		
	});
	
	/*
	describe('uniques', function(){
		var Slick = (context.Slick || global.Slick);
		
		it('should return uniques from `search` with append', function(){
			var append = [];
			var l1 = Slick.search(document, '*', append);
			expect( l1.length ).toEqual( append.length );
			expect( l1.length ).toEqual( Slick.uniques(append).length );
			
			// Should not add any more elements to append
			var l2 = Slick.search(document, '*', append);
			expect( l2.length ).toEqual( Slick.uniques(append).length );
			
			// expect( l2 ).toEqual( Slick.uniques(append).length );
			// expect( l1 ).toEqual( l2 );
		});
		
		it('should not recurse context with context == append', function(){
			var append = Slick.search(document, '*');
			
			var l1 = Slick.search(append, '*', Slick.search(document, ':root')).length;
			
			Slick.search(append, '*', append);
			var l2 = append.length;
			
			expect( l1 ).toEqual( l2 );
		});
		
		it('should support multiple contexts', function(){
			var l1 = Slick.search(document, '* *').length;
			
			var append = Slick.search(document, '*');
			var l2 = Slick.search(append, '*').length;
			
			expect( l1 ).toEqual( l2 );
		});
		
		it('should return uniques from `uniques` with append', function(){
			console.group('search');
			var append = Slick.search(document, '*');
			console.groupEnd('search');
			var append_length = append.length;
			var duplicates = append.concat(append);
			
			console.group('search with append');
			console.log(append.length);
			var results = Slick.search(document, 'a', append);
			console.log(results.length);
			console.groupEnd('search with append');
			
			
			expect( results ).toEqual( append );
			expect( append.length ).toEqual( append_length );
			
			expect( Slick.uniques(results).length ).toEqual( append_length );
			
			// expect(Slick.uniques(duplicates).length).not.toEqual(duplicates.length);
			// 
			// expect(
			// 	Slick.uniques(duplicates, append).length
			// ).toEqual(
			// 	append.length
			// );
			// 
			// expect(
			// 	Slick.uniques(duplicates, append).length
			// ).toEqual(
			// 	Slick.uniques(duplicates).length
			// );
			
		});
		
		it('should add results to append', function(){
			var append;
			
			append = [];
			Slick.search(document, '*', append);
			expect( append.length ).toEqual( Slick.search(document, '*').length );
			
			append = [];
			Slick.search(document, '*', append);
			expect( append.length ).toEqual( Slick.search(document, '*').length );
		});
	});
	*/
};
