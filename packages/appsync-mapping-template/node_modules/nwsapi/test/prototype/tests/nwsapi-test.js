(function(global) {

  var param, select;

  getQueryParam =
    function(key, defaultValue) {
      var pattern = new RegExp('[?&]' + key + '=([^&]+)');
      return (global.location.href.match(pattern) || [0, defaultValue])[1];
    },

  refresh =
    function() {
      var loc = global.location;
      loc.replace(loc.protocol + '//' + loc.hostname + loc.pathname +
        '?engine=' + select.options[select.selectedIndex].text);
    },

  change =
    function(options, value) {
      var i = -1, option;
      while ((option = options[++i])) {
        if (option.text == value) {
          options[0].parentNode.selectedIndex = i;
          break;
        }
      }
    };

  global.$$ =
    function $$() {
      var context, args = $A(arguments);
      if (typeof args[args.length - 1] != 'string') {
        context = args.pop();
      }
      return (param == 'NWSAPI') ?
        NW.Dom.select(args.join(', '), context) :
        Prototype.Selector.select(args.join(', '), context);
    };

  global.onload =
    function() {
      var d = document;
      select = d.createElement('select');
      select.appendChild(d.createElement('option')).appendChild(d.createTextNode('NWSAPI'));
      select.appendChild(d.createElement('option')).appendChild(d.createTextNode('Sizzle'));
      d.body.insertBefore(select, d.body.firstChild.nextSibling);
      d.body.insertBefore(d.createElement('b'), d.body.firstChild).
        appendChild(d.createTextNode('Choose selector engine\xa0'));
      param = getQueryParam('engine', 'NWSAPI');
      change(select.options, param);
      select.onchange = refresh;
    };

})(this);
