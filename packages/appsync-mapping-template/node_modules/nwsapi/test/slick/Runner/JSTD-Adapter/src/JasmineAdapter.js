/**
 * @fileoverview Jasmine JsTestDriver Adapter.
 * @author ibolmo@gmail.com (Olmo Maldonado)
 * @author misko@hevery.com (Misko Hevery)
 */

(function(describe, it, beforeEach, afterEach, addResult){

var frame = function(parent, name){
	var caseName = '';
	if (parent && parent.caseName) caseName = parent.caseName + ' ';
	if (name) caseName += name;

	var before = [],
		after = [];

	return {
		name: name,
		caseName: caseName,
		parent: parent,
		testCase: TestCase(caseName),
		before: before,
		after: after,
		runBefore: function(){
			if (parent) parent.runBefore.apply(this);
			for (var i = 0, l = before.length; i < l; i++) before[i].apply(this);
		},
		runAfter: function(){
			for (var i = 0, l = after.length; i < l; i++) after[i].apply(this);
			if (parent) parent.runAfter.apply(this);
		}
	};
};

var currentFrame = frame(null, null);

jasmine.Env.prototype.describe = function(description, context){
	currentFrame = frame(currentFrame, description);
	var result = describe.call(this, description, context);
	currentFrame = currentFrame.parent;
	return result;
};
  
jasmine.Env.prototype.it = function(description, closure){
	var result = it.call(this, description, closure),
		currentSpec = this.currentSpec,
		frame = this.jstdFrame = currentFrame,
		name = 'test that it ' + description;

	if (this.jstdFrame.testCase.prototype[name])
		throw "Spec with name '" + description + "' already exists.";
	
	this.jstdFrame.testCase.prototype[name] = function(){
		jasmine.getEnv().currentSpec = currentSpec;
		frame.runBefore.apply(currentSpec);
		try {
			currentSpec.queue.start();
		} catch(e){}
		frame.runAfter.apply(currentSpec);
	};
	return result;
};

jasmine.Env.prototype.beforeEach = function(closure) {
	beforeEach.call(this, closure);
	currentFrame.before.push(closure);
};

jasmine.Env.prototype.afterEach = function(closure) {
	afterEach.call(this, closure);
	currentFrame.after.push(closure);
};

jasmine.NestedResults.prototype.addResult = function(result) {
	addResult.call(this, result);
	if (result.type != 'MessageResult' && !result.passed()) fail(result.message);
};

// Reset environment with overriden methods.
jasmine.currentEnv_ = null;
jasmine.getEnv();

})(jasmine.Env.prototype.describe, jasmine.Env.prototype.it, jasmine.Env.prototype.beforeEach, jasmine.Env.prototype.afterEach, jasmine.NestedResults.prototype.addResult);
