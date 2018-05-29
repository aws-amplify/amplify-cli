/*
 * NWSAPI test for CSS3 3 Selectors
 * Copyright (C) 2010 Diego Perini
 * All rights reserved
 */

var CDN = 'http://ajax.googleapis.com/ajax/libs/',

// order is:
//  * working CSS3 engines
//  * CDN hosted frameworks
//  * other selector engines
engines = {
  'querySelectorAll':   [ 'document.querySelectorAll(s)',    '' ],

  'nwsapi':             [ 'NW.Dom.select(s)',                '../../src/nwsapi.js' ]

//  'base2-2.0alpha1':    [ 'base2.dom.querySelectorAll(c,s)', 'lib/base2+dom.js' ],
//  'prototype-1.6.1':    [ '$$(s)',                           CDN + 'prototype/1.6.1.0/prototype.js' ],
//  'dojo-1.4.1':         [ 'dojo.query(s)',                   CDN + 'dojo/1.4.1/dojo/dojo.xd.js' ],
//  'mootools-1.2.4':     [ '$$(s)',                           CDN + 'mootools/1.2.4/mootools.js' ],
//  'jquery-1.4.2':       [ '$(s)',                            CDN + 'jquery/1.4.2/jquery.min.js' ],
//  'ext-3.1.0':          [ 'Ext.DomQuery.select(s)',          CDN + 'ext-core/3.1.0/ext-core.js' ],

//  'mylib-1.0':          [ 'API.getEBCS(s)',                  'lib/mylib-qsa-min.js' ],
//  'domassistant-2.8.0': [ '$(s)',                            'lib/domass.js' ],
//  'slick-0.9dev':       [ 'Slick.search(c,s)',               'lib/slick.js' ],
//  'sly-1.0rc2':         [ 'Sly.search(s)',                   'lib/sly.js' ],
//  'yui-3.0':            [ 'Y.Selector.query(s)',             'lib/yui3.js' ],
//  'sizzle-1.0':         [ 'Sizzle(s)',                       'lib/sizzle.js' ],
//  'yass-0.3.9':         [ '_(s)',                            'lib/yass.0.3.9.js' ],
};

(function(global, engines) {

  var version = '0.2',

  // document reference
  doc = global.document,

  // root element reference
  root = doc.documentElement,

  // head element reference to add scripts
  head = doc.getElementsByTagName('head')[0] || root,

  // default selector engine to use on page load
  // and common global variables shared by methods
  defaultEngine = 'querySelectorAll', engine, script, select,

  // get URL parameters from query string
  getQueryParam =
    function(key, defaultValue) {
      var pattern = new RegExp('[?&]' + key + '=([^&#]+)');
      return (global.location.href.match(pattern) || [0, defaultValue])[1];
    },

  // refresh replacing current history entry
  refresh =
    function() {
      var loc = global.location;
      loc.replace(loc.protocol + '//' + loc.hostname + loc.pathname +
        '?engine=' + select.options[select.selectedIndex].text + '#target');
    },

  // trap change event on engines select box
  change =
    function(options, value) {
      var i = 0, option;
      while ((option = options[i])) {
        if (option.text == value) {
          options[0].parentNode.selectedIndex = i;
          break;
        }
        ++i;
      }
    },

  // transform (p)roperty name to hyphenated format (font-size, line-height)
  hyphenate =
    function(p) {
      return p.replace(/([A-Z])/g,
        function(m, c) {
          return '-'+c.toLowerCase();
        });
    },

  // transform (p)roperty name to camelized format (fontSize, lineHeight)
  camelize =
    function(p) {
      return p.replace(/-([a-z])/g,
        function(m, c) {
          return c.toUpperCase();
        });
    },

  // get computed style (p)roperty value for (o)bject,
  // may be an element or style rule declaration
  getStyle = root.style.Property ?
    function(o, p) {
      return (o.ownerDocument || o.document).
        defaultView.getComputedStyle(o, '').
        getPropertyValue(hyphenate(p));
    } :
    function(o, p) {
      return o.style[camelize(p)];
    },

  // set multiple properties values on the element
  addStyle =
    function(element, style) {
      var i = 0, items = style.match(/([a-zA-Z][^;]+)/g), length = items.length, parts;
      for (; length > i; ++i) {
        parts = items[i].match(/\s*(.*)\s*:\s*(.*)\s*/);
        setStyle(element, parts[1], parts[2]);
      }
    },

  // set computed style property value for object,
  // may be an element or style rule declaration
  // (o)bject, (p)roperty, (v)alue, [priorit(y)]
  setStyle = root.style.setProperty ?
    function(o, p, v, y) {
      // fix for Ext passing Text Nodes
      if (o.nodeType == 1) {
        p = p.replace(/^\s+|\s+$/g, '');
        o.style.setProperty(hyphenate(p), v.replace(/^\s+|\s+$/g, ''), y || '');
      }
    } :
    function(o, p, v, y) {
      // fix for Ext passing Text Nodes
      if (o.nodeType == 1) {
        p = p.replace(/^\s+|\s+$/g, '');
        if (p == 'float') p = 'styleFloat';
        o.style[camelize(p)] = v.replace(/^\s+|\s+$/g, '');
      }
    },

  // set style property values on elements returned by selector engines
  // emulate applying CSS style rules as browsers applies them to elements
  setStyleRule =
    function(selectorText, cssText, engine) {

      var j, elements = [ ], method = engines[engine][0];

      // some engine will throw errors and stop processing
      // so we added a try/catch block around the method call
      try { elements = Function('c,s', 'return ' + method)(doc, selectorText); } catch(e) { }

      if (elements && elements.length) {
        for (j = 0; elements.length > j; j++) {
          addStyle(elements[j], cssText);
        }
      }

    },

  // add engine selection box atop the page
  addSelectBox =
    function() {
      var i, select = doc.createElement('select');

      for (i in engines) {
        select.appendChild(doc.createElement('option')).
          appendChild(doc.createTextNode(i));
      }

      if (doc.body) {
        doc.body.insertBefore(select, doc.body.firstChild);
        doc.body.insertBefore(doc.createElement('b'), doc.body.firstChild).
          appendChild(doc.createTextNode('Choose selector engine\xa0'));

        param = getQueryParam('engine', defaultEngine);
        change(select.options, param);
        select.onchange = refresh;
      }

      return select;
    };

  // CSS3 Selectors Tests
  startTest =
    function() {

      var i, items, length, link, node, rules, style;

      // for nwsapi, disable complex selectors nested in
      // :not() pseudo-classes to comply with specifications
      if (engine.indexOf('nwsapi') > -1) {
        NW.Dom.configure({ 'SIMPLENOT': true });
      }

      if (engine == 'querySelectorAll' && typeof doc.querySelectorAll == 'undefined') {
        alert('NOTE: This browser don\'t support Query Selectors API.\n' +
          'The stylesheet will be loaded from an external css file.');
        link = doc.createElement('link');
        link.href = 'css3-compat.css';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        head.appendChild(link);
      } else {
        style = doc.getElementById("teststyle").innerHTML;
        rules = style.match(/\s*(.*)\s*\{\s*(.*)\s*\}/g);
        for (i = 0, length = rules.length; length > i; i++) {
          items = rules[i].match(/\s*(.*)\s*\{\s*(.*)\s*\}/);
          setStyleRule(items[1], items[2], engine);
        }
      }

    };

  // get 'engine' parameter value from query string
  engine = getQueryParam('engine', defaultEngine);

  global.onload =
    function() {

      // add engines select box
      select = addSelectBox();

      if (engine && engines[engine][1]) {
        // overwrite native methods to force
        // frameworks to use the fall-back
        // branch of the selector engine
        doc.querySelectorAll = undefined;
        doc.querySelector = undefined;

        // inject a script loading the selected framework/library
        script = head.insertBefore(doc.createElement('script'), head.firstChild);
        script.type = 'text/javascript';
        script.src = engines[engine][1];
        // setup script load handlers
        script.onload = startTest;
        // need a small IE inference :(
        // to avoid problems with Opera
        // doesn't this make sense :?)
        if (doc.createEventObject) {
          script.onreadystatechange =
            function() {
              if (/loaded/.test(script.readyState)) {
                startTest();
              }
            };
        }
      } else {
        // no need to load a framework
        engine = 'querySelectorAll';
        location.hash = '#target';
        startTest();
      }
    };

})(this, engines);
