var Moo = {
	
	defined: function(obj){
		return (obj != undefined);
	},
	
	type: function(obj){
		if (obj == null) return false;
		if (!Moo.defined(obj)) return false;
		var type = typeof obj;
		if (type == 'object' && obj.nodeName){
			switch(obj.nodeType){
				case 1: return 'element';
				case 3: return (/\S/).test(obj.nodeValue) ? 'textnode' : 'whitespace';
			}
		}
		if (type == 'object' || type == 'function'){
			switch(obj.constructor){
				case Array: return 'array';
				case RegExp: return 'regexp';
			}
			if (typeof obj.length == 'number'){
				if (obj.item) return 'collection';
				if (obj.callee) return 'arguments';
			}
		}
		return type;
	}
	
};

Moo.Client = {
	Engine: {'name': 'unknown', 'version': ''},
	Platform: {},
	Features: {}
};
Moo.Client.Features.xhr = !!(window.XMLHttpRequest);
Moo.Client.Features.xpath = !!(document.evaluate);

if (window.opera) Moo.Client.Engine.name = 'opera';
else if (window.ActiveXObject) Moo.Client.Engine = {'name': 'ie', 'version': (Moo.Client.Features.xhr) ? 7 : 6};
else if (!navigator.taintEnabled) Moo.Client.Engine = {'name': 'webkit', 'version': (Moo.Client.Features.xpath) ? 420 : 419};
else if (document.getBoxObjectFor != null) Moo.Client.Engine.name = 'gecko';
Moo.Client.Engine[Moo.Client.Engine.name] = Moo.Client.Engine[Moo.Client.Engine.name + Moo.Client.Engine.version] = true;

Moo.Client.Platform.name = navigator.platform.match(/(mac)|(win)|(linux)|(nix)/i) || ['Other'];
Moo.Client.Platform.name = Moo.Client.Platform.name[0].toLowerCase();
Moo.Client.Platform[Moo.Client.Platform.name] = true;

Moo.ViewPort = {

	getWidth: function(){
		if (Moo.Client.Engine.webkit419) return window.innerWidth;
		if (Moo.Client.Engine.opera) return document.body.clientWidth;
		return document.documentElement.clientWidth;
	},

	getHeight: function(){
		if (Moo.Client.Engine.webkit419) return window.innerHeight;
		if (Moo.Client.Engine.opera) return document.body.clientHeight;
		return document.documentElement.clientHeight;
	},

	getScrollWidth: function(){
		if (Moo.Client.Engine.ie) return Math.max(document.documentElement.offsetWidth, document.documentElement.scrollWidth);
		if (Moo.Client.Engine.webkit) return document.body.scrollWidth;
		return document.documentElement.scrollWidth;
	},

	getScrollHeight: function(){
		if (Moo.Client.Engine.ie) return Math.max(document.documentElement.offsetHeight, document.documentElement.scrollHeight);
		if (Moo.Client.Engine.webkit) return document.body.scrollHeight;
		return document.documentElement.scrollHeight;
	},

	getScrollLeft: function(){
		return window.pageXOffset || document.documentElement.scrollLeft;
	},

	getScrollTop: function(){
		return window.pageYOffset || document.documentElement.scrollTop;
	}

};

Moo.Element = {
	
	addEvent: function(element, type, fn){
		if (element.addEventListener) element.addEventListener(type, fn, false);
		else element.attachEvent('on' + type, fn);
	},

	removeEvent: function(item, type, fn){
		if (item.removeEventListener) item.removeEventListener(type, fn, false);
		else item.detachEvent('on' + type, fn);
	},
	
	remove: function(item){
		if (!item || !item.parentNode) return;
		item.parentNode.removeChild(item);
	}

};

Moo.Array = {

	forEach: function(items, fn, bind){
		for (var i = 0, j = items.length; i < j; i++) fn.call(bind, items[i], i, items);
	}

};

Moo.String = {
	
	contains: function(item, string, s){
		return (s) ? (s + item + s).indexOf(s + string + s) > -1 : item.indexOf(string) > -1;
	}
	
};

Moo.Object = {

	add: function(item, properties){
		var i = 0;
		for (var property in properties){
			item[property] = properties[property];
			if (i++ > 10) break;
		}
	}

};

var debug = debug || {};
debug.queue = [];
debug.methods = ['log', 'time', 'timeEnd', 'group', 'groupEnd', 'warn', 'info', 'error'];

Moo.Array.forEach(debug.methods, function(name){
	debug[name] = function(){
		debug.queue.push({'name': name, 'arguments': arguments});
	};
});

Moo.Debugger = {
	
	load: function(){
		
		document.documentElement.className = document.documentElement.className + ' moobugger';
		
		debug.spacer = document.createElement('div');
		debug.spacer.className = 'debug-spacer';
		document.body.appendChild(debug.spacer);

		debug.iFrame = document.createElement('iframe');
		
		debug.iFrame.frameBorder = 0;

		Moo.Object.add(debug.iFrame.style, {
			'border': 'none',
			'padding': 0,
			'margin': 0,
			'width': '100%',
			'position': 'fixed',
			'bottom': 0,
			'left': 0,
			'zIndex': 999999
		});
		
		if (Moo.Client.Engine.ie) debug.iFrame.style.position = 'absolute';

		debug.iFrame.id = debug.iFrame.name = 'debugger';
		debug.iFrame.src = (debug.local) ? debug.path + 'debugger.html' : 'javascript:parent.debug.htmlString';
		
		
		document.body.appendChild(debug.iFrame);
		
		Moo.Element.addEvent(debug.iFrame, 'load', Moo.Debugger.onFrameLoaded);
	},
	
	getPath: function(){
		var path = '';
		Moo.Array.forEach(document.getElementsByTagName('script'), function(script){
			if (!path && Moo.String.contains(script.src, '/') && Moo.String.contains(script.src, 'debugger.js')) path = script.src.substr(0, script.src.lastIndexOf('/'));
		});
		return path + '/';
	},
	
	onFrameLoaded: function(){
		debug.frame = window.frames['debugger'];
		
		Moo.Array.forEach(debug.methods, function(name){
			debug[name] = debug.frame.debug[name];
		});
		
		Moo.Element.addEvent(window, 'resize', Moo.Debugger.reposition);
		Moo.Element.addEvent(window, 'scroll', Moo.Debugger.reposition);
		
		Moo.Debugger.reposition();
	},
	
	reposition: function(){
		debug.spacer.style.height = debug.iFrame.offsetHeight + 'px';
		var top = Moo.ViewPort.getHeight() - debug.iFrame.offsetHeight;
		if (top < 0) return;
		if (Moo.Client.Engine.ie6){
			top = Moo.ViewPort.getScrollTop() + top;
			debug.iFrame.style.top = top + 'px';
		}
	},
	
	unload: function(){
		debug.queue = [];
		document.documentElement.className = document.documentElement.className.replace(/ ?moobugger ?/,' ');
		Moo.Element.remove(debug.iFrame);
		Moo.Element.remove(debug.spacer);
		Moo.Element.remove(document.getElementById('debug-bookmarklet'));
	},
	
	evaluate: function(value){
		try {
			var evaluation = value;
			if (typeof value == 'string')
				evaluation = eval(value);
			if (evaluation !== debug.frame.debug.$nil){
				if (evaluation == window) evaluation = {'window': '[native code]'};
				if (evaluation.nodeType === 9) evaluation = {'document': '[native code]'};
				debug.frame.debug.$parse([evaluation]);
			}
		} catch(err){
			debug.frame.debug.error(err);
		}
	}

};

window.$ = window.$ || function(id){
	return document.getElementById(id);
};

window.$$ = window.$$ || function(tag){
	return document.getElementsByTagName(tag);
};

if (!debug.path) debug.local = true;

debug.path = debug.path || Moo.Debugger.getPath();

debug.htmlString = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"> \
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en"> \
<head> \
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/> \
	<title>debugger</title> \
	<link rel="stylesheet" type="text/css" media="screen" href="' + debug.path + 'debugger.css"> \
	<script type="text/javascript" src="' + debug.path + 'mootools.js"></script> \
	<script type="text/javascript" src="' + debug.path + 'debugger-iframe.js"></script> \
</head> \
<body> \
<div id="debug"> \
	<div id="debug-header"> \
		<a target="_blank" href="http://mootools.net" title="mootools.net" id="debug-mootools-net"></a> \
		<span id="debug-button-close" title="close"></span> \
		<span id="debug-button-max" title="maximize"></span> \
		<span id="debug-button-min" title="minimize"></span> \
		<b></b> \
	</div> \
	<div id="debug-messages"></div> \
	<div id="debug-input-area"> \
		<input type="text" id="debug-input" /> \
	</div> \
</div> \
</body> \
</html>';

if (!window.console || !console.group){
	window.console = debug;
	if (!debug.local) Moo.Debugger.load();
	else Moo.Element.addEvent(window, 'load', Moo.Debugger.load);
}

if (!window.onerror)
window.onerror = function(error, url, line){
	console.error({error:error, url:url, line:line});
	return true;
}

