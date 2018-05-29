
var simulateEvent = function(type, args, callback){
	
	var called = false;
	
	args = Array.prototype.slice.call(args);
	args.push(function(){
		called = true;
	});
		
	Syn[type].apply(Syn, args);
	
	waitsFor(2, function(){
		return called;
	});
	
	runs(callback);

};

