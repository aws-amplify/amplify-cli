var TAGS = 'normal UPCASE escaped\\,character \u01dd\u0070\u006f\u0254\u0131\u0075\u006e'.split(' ');

var IDS = "normal escaped\\,character \u01dd\u0070\u006f\u0254\u0131\u0075\u006e with-dash with_underscore number123 silly\\:id\\:\\:with\\:colons".split(' ');

var CLASSES = "normal escaped\\,character \u01dd\u0070\u006f\u0254\u0131\u0075\u006e \u7021 with-dash with_underscore number123 MiXeDcAsE".split(' ');

var ATTRIB_OPERATORS = '= != *= ^= $= ~= |='.split(' ');

var ATTRIB_KEYS = '\
normal,\
 spaced,\
spaced ,\
escaped\\]character,\
\u01dd\u0070\u006f\u0254\u0131\u0075\u006e,\
with-dash,\
with_underscore,\
number123,\
'.split(',');

var ATTRIB_VALUES = '\
normal,\
\u01dd\u0070\u006f\u0254\u0131\u0075\u006e,\
"double quote",\
\'single quote\',\
"double\\"escaped",\
\'single\\\'escaped\',\
 spaced,\
spaced ,\
 "spaced",\
 \'spaced\',\
"spaced" ,\
\'spaced\' ,\
parens(),\
curly{},\
"quoted parens()",\
"quoted curly{}",\
"quoted square[]",\
'.split(',');
// TODO: add "square[]" to ATTRIB_VALUES for prototype support

var PSEUDO_KEYS = 'normal escaped\\,character \u01dd\u0070\u006f\u0254\u0131\u0075\u006e with-dash with_underscore'.split(' ');

var PSEUDO_VALUES = 'normal,\u01dd\u0070\u006f\u0254\u0131\u0075\u006e, spaced,"double quote",\'single quote\',"double\\"escaped",\'single\\\'escaped\',curly{},square[],"quoted parens()","quoted curly{}","quoted square[]"'.split(',');

var COMBINATORS = (" >+~" + "`!@$%^&={}\\;</").split('');