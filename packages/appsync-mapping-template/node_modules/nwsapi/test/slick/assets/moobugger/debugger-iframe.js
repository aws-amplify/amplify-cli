/*
Script: Debugger.js
	Creates Firebug <http://www.getfirebug.com> style debugger for browsers without Firebug.

License:
	MIT-style license.
*/

var FOR_IN_MAX = 20;

var debug = {

	$nil: Function.empty,
	
	$init: function(){
		debug.loaded = false;
		debug.$groups = {'keys': [], 'values': []};
		debug.$timers = {};
	},

	$register: function(text){
		debug.$messages.remove(text);
		debug.$messages.push(text);
		debug.$midx = debug.$messages.length;
		var toCookie = debug.$messages.join('|||').replace(/;/g, '%%%');
		if (toCookie.length >= 4096) toCookie = toCookie.substring(2048, 4049);
		Cookie.set('mootools-debugger-history', toCookie, {duration: 10});
	},

	$parse: function(args, separator, to_e, klass){
		separator = $pick(separator, ' ');
		var chunks = [];
		for (var i = 0, l = args.length; i < l; i++){
			if (args[i] === undefined){
				chunks.push({'type': 'undefined', 'value': 'undefined'});
				continue;
			}
			var argument = args[i];
			var type = parent.Moo.type(argument);
			if (['boolean', false].contains(type)) argument = String(argument);
			else if (type == 'collection') type = 'array';
			chunks.push({'type': type.toString(), 'value': argument});
		}
		var holder = new Element('span');
		chunks.each(function(chunk, i){
			switch(chunk.type){
				case 'element': holder.adopt(debug.$element(chunk.value)); break;
				case 'array': holder.adopt(new Element('span').setHTML('['), debug.$parse(chunk.value, ', ', true), new Element('span').setHTML(']')); break;
				case 'object':
					try{
						holder.adopt(new Element('span').setHTML('{'));
						var x = 0;
						var length = 0;
						
						for (var len in chunk.value) length++;
						for (var key in chunk.value){
							x++;
							holder.adopt(new Element('span').setHTML('<span class="key">', key, '</span>', ': '), debug.$parse([chunk.value[key]], '', true));
							if (x != length) holder.adopt(new Element('span').setHTML(', '));
							if (x > FOR_IN_MAX){
								holder.adopt(new Element('span').setHTML('and '+ (length - x) +' more properties…'));
								break;
							}
						}
						holder.adopt(new Element('span').setHTML('}'));
					}catch(e){
						new Element('span').addClass(chunk.type).appendText(chunk.value).inject(holder);
					}
					break;
				default: new Element('span').addClass(chunk.type).appendText(chunk.value).inject(holder);
			}
			if (i != (chunks.length - 1)) holder.adopt(new Element('span').setHTML(separator));
		});
		if (to_e){
			return holder;
		} else {
			debug.$pre(holder, klass);
			return debug.$nil;
		}
	},

	$element: function(el){
		var el_style = el.style;
		if (!el_style) el_style = {};
		
		var oldbg = el_style.backgroundColor;
		var oldfg = el_style.color;
		
		var link = new Element('a', {'href': '#'}).addEvents({

			mouseenter: function(){
				el_style.backgroundColor = '#DBEAF0';
				el_style.color = '#757E8A';
			},
			
			mouseleave: function(){
				el_style.backgroundColor = oldbg;
				el_style.color = oldfg;
			},
			
			click: function(){
				return false;
			}

		});
		var htm = ['&lt;' + '<span class="tag">' + Element.getTag(el) + '</span>'];
		['id', 'className', 'name', 'href', 'title', 'rel', 'type'].each(function(attr){
			if (el[attr]) htm.push(attr + '="' + '<span class="string">' + el[attr] + '</span>' + '"');
		});
		return link.setHTML(htm.join(' '), '&gt;');
	},
	
	$pre: function(content, klass){
		var pre = new Element('pre', {'class': klass || 'message'});
		if ($type(content) == "string") pre.appendText(content);
		else pre.adopt(content);
		pre.inject(debug.$groups.values.getLast());
		if (debug.loaded) debug._scroll.toBottom();
		return pre;
	},
	
	$log: function(args, separator, klass){
		separator = $pick(separator, ', ');
		var sRegExp = /%[sdifo]/gi;
		if ($type(args[0]) == 'string' && args[0].test(sRegExp)){
			separator = '';
			var logCollection = [], lastIndex = 0;
			sRegExp.lastIndex = 0;
			var token;
			for (var i = 1; (i < args.length) && (token = sRegExp.exec(args[0])); i++){
				logCollection.push(args[0].substring(lastIndex, token.index), args[i]);
				lastIndex = sRegExp.lastIndex;
			}
			sRegExp.lastIndex = 0;
			if (!lastIndex) return debug.$parse(args);
			logCollection.push(args[0].substring(lastIndex));
			args = logCollection;
		}
		debug.$parse(args, separator, false, klass);
		return debug.$nil;
	},
	
	$special: function(obj, klass){
		if (obj.length == 1){
			var one = obj[0];
			var type = $type(one);
			if ((type == 'object' && one.name && one.message) || (type == 'string')){
				var name, message;
				
				if (type == 'object'){
					name = one.name;
					message = one.message;
				} else if (type == 'string'){
					name = klass.capitalize();
					message = one;
				}
				
				return debug.$pre(name + ': ' + message, klass);
			}
		}
		return debug.$log([klass.capitalize() + ':'].concat(obj), ' ', klass);
	},

	$load: function(){
		debug.loaded = true;
		debug.$messages = Cookie.get('mootools-debugger-history') || [];
		debug.$messages = debug.$messages.length ? debug.$messages.replace(/%%%/g, ';').split('|||') : [];
		debug.$midx = debug.$messages.length;
		
		debug._body = $('debug').setStyle('display', 'block');
		debug._messages = $('debug-messages');
		
		debug.$groups.keys.push('$main$');
		debug.$groups.values.push(debug._messages);
		
		debug._input = $('debug-input');
		
		debug._scroll = new Fx.Scroll(debug._messages, {duration: 300, wait: false});
		
		debug._input.addEvent('keydown', debug.$key);

		debug._max = $('debug-button-max').addEvent('click', debug.$max);

		debug._min = $('debug-button-min').addEvent('click', debug.$min);
		
		debug._close = $('debug-button-close').addEvent('click', debug.$unload);
		
		debug._maxValue = 132;
		debug._minValue = 18;
		
		var state = Cookie.get('mootools-debugger-state');
		if (state) debug[state]();
		else debug.$max();
		
		for (var i = 0, l = parent.debug.queue.length; i < l; i++){
			var kue = parent.debug.queue[i];
			debug[kue.name].apply(debug, kue.arguments);
		}

		debug._scroll.toBottom();
	},

	$max: function(){
		Cookie.set('mootools-debugger-state', '$max', {duration: 10});
		debug._messages.setStyles({
			'height': debug._maxValue,
			'overflow': 'auto'
		});
		debug._max.setStyle('display', 'none');
		debug._min.setStyle('display', 'block');
		debug.$pad();
	},
	
	$min: function(){
		Cookie.set('mootools-debugger-state', '$min', {duration: 10});
		debug._messages.setStyles({
			'height': debug._minValue,
			'overflow': 'hidden'
		});
		debug._max.setStyle('display', 'block');
		debug._min.setStyle('display', 'none');
		debug.$pad();
	},
	
	$pad: function(){
		parent.debug.iFrame.style.height = debug._body.offsetHeight + 'px';
		debug._messages.scrollTop = debug._messages.scrollHeight - debug._messages.offsetHeight;
		parent.Moo.Debugger.reposition();
	},
	
	$unload: function(){
		if (!debug.loaded) return;
		debug.$init();
		parent.Moo.Debugger.unload();
	},
	
	$focus: function(){
		debug._input.focus();
	},

	$key: function(e){
		var value = debug._input.value;

		switch(e.key){
			case 'enter':
				if (!value){
					return false;
				}
				debug._input.value = '';
				switch(value){
					case 'exit': debug.$unload(); return false;
					case 'clear': case 'clr': debug._messages.empty(); return false;
				}

				debug.$pre('>>> ' + value, 'logger');
				debug.$register(value);
				if (value.indexOf('var ') == 0) value = value.substring(4, value.length);
				if (value.charAt(value.length - 1) == ';') value = value.substring(0, value.length - 1);
				if (value.indexOf('{') == 0) value = '(' + value + ')';
				
				parent.Moo.Debugger.evaluate(value);
				break;

			case 'up':
				e.stop();
				var i = debug.$midx - 1;
				if (debug.$messages[i]){
					debug._input.value = debug.$messages[i];
					debug.$midx = i;
				}
				break;

			case 'down':
				e.stop();
				var j = debug.$midx + 1;
				if (debug.$messages[j]){
					debug._input.value = debug.$messages[j];
					debug.$midx = j;
				} else {
					debug._input.value = '';
					debug.$midx = debug.$messages.length;
				}
		}
		
		return debug.$focus.delay(50);
	},

	/*
	Property: log
		sends a message to the debugger.
		Arguments:
		messages - any number of strings, objects, etc. to print out
		Note:
		The debugger will allow firebug style log messages:
			%s	- String
		%d, %i	- Integer (numeric formatting is not yet supported)
		%f	- Floating point number (numeric formatting is not yet supported)
		%o	- Object hyperlink
		Example:
			>console.log("the value of x is %s and this paragraph is %o", x, $('id'));
		> the value of x is <some value> and this paragraph is <p>
	*/

	log: function(){
		return debug.$log($A(arguments));
	},

	/*
	Property: time
		Starts a timer.
	Argument:
		name - the name of the timer
	*/

	time: function(name){
		if (debug.$timers[name]){
			debug.error("a timer called " + name + ' already exists');
		} else {
			debug.$pre(name + ' started', 'time');
			debug.$timers[name] = new Date().getTime();
		}
		return debug.$nil;
	},

	/*
	Property: timeEnd
		Ends a timer and logs that value to the console.
		Argument:
		name - the name of the timer
	*/

	timeEnd: function(name){
		if (debug.$timers[name]) debug.$pre(name + ' ended: ' + (new Date().getTime() - debug.$timers[name]) + ' ms', 'time');
		else debug.error("no such timer called " + name);
		return debug.$nil;
	},
	
	group: function(name){
		if (debug.$groups.keys.contains(name)){
			debug.error('a group called ' + name + ' already exists');
		} else {
			var pre = debug.$pre('Group: ' + name, 'group');
			var grp = new Element('div', {'class': 'group'}).inject(debug.$groups.values.getLast());
			pre.addEvent('click', function(){
				var none = (grp.getStyle('display') == 'none');
				var name = none ? 'block' : 'none';
				grp.setStyle('display', name);
				this.toggleClass('group-closed');
			});
			debug.$groups.keys.push(name);
			debug.$groups.values.push(grp);
		}
		return debug.$nil;
	},
	
	groupEnd: function(name){
		var idx = debug.$groups.keys.indexOf(name);
		if (idx >= 0){
			debug.$groups.values.remove(debug.$groups.values[idx]);
			debug.$groups.keys.remove(name);
		} else {
			debug.error('no such group called ' + name);
		}
		return debug.$nil;
	},
	
	error: function(){
		debug.$special($A(arguments), 'error');
		return debug.$nil;
	},
	
	warn: function(warning){
		debug.$special($A(arguments), 'warning');
		return debug.$nil;
	},
	
	info: function(){
		debug.$special($A(arguments), 'info');
		return debug.$nil;
	}

};

debug.$init();

window.addEvent('load', debug.$load);