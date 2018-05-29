describe = (function(original){
	var each = 'before each',
		all = 'before all',
		after = 'after all';

	return function(name, object){
		if (object instanceof Function){
			original(name, object);
			return;
		}

		original(name, function(){
			var beforeAll = object[all],
				bfEach = object[each],
				aAll = object[after];

			beforeEach(function(){
				if (beforeAll){
					beforeAll();
					beforeAll = null;
				}

				if (bfEach) bfEach();
			});

			delete object[all];
			delete object[each];
			delete object[after];

			for (var key in object)
				it(key, object[key]);

			if (aAll) it('cleans up', aAll);
		});
	};
})(describe);
