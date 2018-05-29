var specsParser = function(context){

var PARSE = context.PARSE, s;

describe('Slick Parser', function(){
	
	it('should exist', function(){
		expect(PARSE).toBeDefined();
	});
	
	// expressions
	it('should convert multiple comma-separated selector expressions into separate entries in the expressions array', function(){
		s = PARSE('a,b,c');
		expect( s.expressions.length ).toEqual( 3 );
	});
	
	it('should always have an expressions array property', function(){
		s = PARSE('a,b,c');
		expect( s.expressions.length ).toEqual( 3 );
		
		s = PARSE('a');
		expect( s.expressions.length ).toEqual( 1 );
		
		s = PARSE('');
		expect( s.expressions.length ).toEqual( 0 );
	});
	
	// parts
	xit('should always have a parts array', function(){
		s = PARSE('a');
		expect( s.expressions[0][0].parts.length ).toEqual( 0 );
		
		s = PARSE('a.class');
		expect( s.expressions[0][0].parts.length ).toEqual( 1 );
		
		s = PARSE('tag#id.class[attrib][attrib=attribvalue]:pseudo:pseudo(pseudovalue):not(pseudovalue)');
		expect( s.expressions[0][0].parts.length ).toEqual( 6 );
	});
	
	xit('parts array items should have a type property', function(){
		s = PARSE('tag#id.class[attrib][attrib=attribvalue]:pseudo:pseudo(pseudovalue):not(pseudovalue)');
		
		for (var i=0, part; part = s.expressions[0][0].parts[i]; i++){
			expect( part.type ).toBeDefined();
		}
	});
	
	xit('should set the type', function(){
		expect(PARSE('.class1').type).toEqual(['className']);
		expect(PARSE('.class1.class2').type).toEqual(['classNames']);
		expect(PARSE('.class1.class2.class3.class4').type).toEqual(['classNames']);
		expect(PARSE('#id.class1.class2').type).toEqual(['id', 'classNames']);
		expect(PARSE('div:foo(bar):not(td)').type).toEqual(['tagName', 'pseudoClass', 'pseudoClass']);
		expect(PARSE('* b').type).toEqual(['tagName*', ' ', 'tagName']);
		expect(PARSE('a > b.bar').type).toEqual(['tagName', '>', 'tagName', 'className']);
	});

});

describe('Slick Parser Syntax',function(){

describe('TAG',function(){
	
	
	// tags
	it('should always have a tag property', function(){
		s = PARSE('tag');
		expect( s.expressions[0][0].tag ).toEqual( 'tag' );
		
		for (var i=0, TAG; TAG = TAGS[i]; i++){
			s = PARSE(TAG);
			expect( s.expressions[0][0].tag ).toEqual( TAG.replace(/\\/g,'') );
		}
	});
	
	// TAG
	var newTAG = function(TAG){
		return function(){
			
			s = PARSE(TAG);
			s = s.expressions[0][0];
			expect( s.tag ).toEqual( TAG.replace(/\\/g,'') );
			
		};
	};
	for (var TAG_I=0, TAG; TAG = TAGS[TAG_I]; TAG_I++){
		it('should support TAG: `'+TAG+'`', newTAG(TAG));
	}
	
	
});

xdescribe('Namespace', function(){
	
	// tag namespaces
	it('should parse the namespace',  TODO);
	it('should parse the namespace from an escaped tagname',  TODO);
	
});

describe('ID', function(){
	
	// ids
	it('should always have an id property', function(){
		s = PARSE('#id');
		expect( s.expressions[0][0].id ).toEqual( 'id' );
		
	});
	
	it('should throw away all but the last id', function(){
		s = PARSE('#id1#id2');
		expect( s.expressions[0][0].id ).toEqual( 'id2' );
		
	});
	
	
	
	// ID
	var newID = function(ID){
		return function(){
			s = PARSE('#' + ID);
			s = s.expressions[0][0];
			expect( s.id ).toEqual( ID.replace(/\\/g,'') );
			
		};
	};
	for (var ID_I=0, ID; ID = IDS[ID_I]; ID_I++){
		it('should support id: `#'+ID+'`', newID(ID));
	}
	
});



describe('CLASS', function(){
	
	// classes
	xit('should parse classes into the parts array', function(){
		s = PARSE('.class');
		expect( s.expressions[0][0].parts[0].type ).toEqual( 'class' );
		expect( s.expressions[0][0].parts[0].value ).toEqual( 'class' );
		
		s = PARSE('.class1.class2.class3');
		expect( s.expressions[0][0].parts[0].type ).toEqual( 'class' );
		expect( s.expressions[0][0].parts[0].value ).toEqual( 'class1' );
		expect( s.expressions[0][0].parts[1].value ).toEqual( 'class2' );
		expect( s.expressions[0][0].parts[2].value ).toEqual( 'class3' );
		
	});
	
	xit('should parse classes into a classes array', function(){
		s = PARSE('.class');
		expect( s.expressions[0][0].parts[0].type ).toEqual( 'class' );
		expect( s.expressions[0][0].classes[0] ).toEqual( 'class' );
		
		s = PARSE('.class1.class2.class3');
		expect( s.expressions[0][0].parts[0].type ).toEqual( 'class' );
		expect( s.expressions[0][0].classes ).toEqual( '.class1.class2.class3'.split('.').slice(1) );
		
	});
	
	xit('classes array items should have a regexp property', function(){
		s = PARSE('.class');
		expect( s.expressions[0][0].parts[0].type ).toEqual( 'class' );
		expect( s.expressions[0][0].parts[0].regexp._type ).toEqual( 'RegExp' );
		expect( s.expressions[0][0].parts[0].regexp.test('class') ).toEqual(true);
	});

	// CLASS
	var newCLASS = function(CLASS){
		return function(){
			
			s = PARSE('.' + CLASS);
			s = s.expressions[0][0];
			expect( s.classList[0] ).toEqual( CLASS.replace(/\\/g,'') );
			
		};
	};
	for (var CLASS_I=0, CLASS; CLASS = CLASSES[CLASS_I]; CLASS_I++){
		it('should support CLASS: `.'+CLASS+'`', newCLASS(CLASS));
	}
	it('should support all CLASSES: `.'+CLASSES.join('.')+'`', function(){
		s = PARSE('.' + CLASSES.join('.'));
		s = s.expressions[0][0];
		
		for (var CLASS_I=0, CLASS; CLASS = CLASSES[CLASS_I]; CLASS_I++){
			
			expect( s.classList[CLASS_I] ).toEqual( CLASS.replace(/\\/g,'') );
			
		}
	});
	
});



describe('ATTRIBUTE', function(){
	
	
	it('attributes array items should have a key property', function(){
		s = PARSE('[attrib]');
		expect( s.expressions[0][0].attributes[0].key ).toEqual( 'attrib' );
		
		s = PARSE('[attrib1][attrib2][attrib3]');
		expect( s.expressions[0][0].attributes[0].key ).toEqual( 'attrib1' );
		expect( s.expressions[0][0].attributes[1].key ).toEqual( 'attrib2' );
		expect( s.expressions[0][0].attributes[2].key ).toEqual( 'attrib3' );
		
	});
	
	it('attributes array items should have a value property', function(){
		s = PARSE('[attrib=attribvalue]');
		expect( s.expressions[0][0].attributes[0].value ).toEqual( 'attribvalue' );
		
		s = PARSE('[attrib1=attribvalue1][attrib2=attribvalue2][attrib3=attribvalue3]');
		expect( s.expressions[0][0].attributes[0].value ).toEqual( 'attribvalue1' );
		expect( s.expressions[0][0].attributes[1].value ).toEqual( 'attribvalue2' );
		expect( s.expressions[0][0].attributes[2].value ).toEqual( 'attribvalue3' );
		
	});
	
	it('attributes array items should have a operator property', function(){
		s = PARSE('[attrib=attribvalue]');
		expect( s.expressions[0][0].attributes[0].operator ).toEqual( '=' );
		
	});
	
	it('attributes array items should have a test method', function(){
		s = PARSE('[attrib=attribvalue]');
		expect( typeof s.expressions[0][0].attributes[0].test ).toEqual( 'function' );
		
	});
	
	
	
	// its attributes array item test method should match string
	var AttributeTests = [
		{ operator:'=',  value:'test you!', matchAgainst:'test you!', shouldBeTrue:true },
		{ operator:'=',  value:'test you!', matchAgainst:'test me!', shouldBeTrue:false },
		
		{ operator:'^=', value:'test', matchAgainst:'test you!', shouldBeTrue:true },
		{ operator:'^=', value:'test', matchAgainst:' test you!', shouldBeTrue:false },
		
		{ operator:'$=', value:'you!', matchAgainst:'test you!', shouldBeTrue:true },
		{ operator:'$=', value:'you!', matchAgainst:'test you! ', shouldBeTrue:false },
		
		{ operator:'!=', value:'test you!', matchAgainst:'test you?', shouldBeTrue:true },
		{ operator:'!=', value:'test you!', matchAgainst:'test you!', shouldBeTrue:false }
	];

	var makeAttributeRegexTest = function(operator, value, matchAgainst, shouldBeTrue) {
		return function(){
			
			s = PARSE('[attrib'+ operator + value +']');
			var result = s.expressions[0][0].attributes[0].test(matchAgainst);
			expect( result ).toEqual(shouldBeTrue ? true : false);
			
		};
	};
	
	for (var t=0,J; J=AttributeTests[t]; t++){
		
		it('attributes array item test method should match string: `[attrib'+ J.operator + J.value +']` should '+ (J.shouldBeTrue?'':'NOT') +' match `'+J.matchAgainst+'`',
			makeAttributeRegexTest(J.operator, J.value, J.matchAgainst, J.shouldBeTrue)
		);
	}
	
	
	
	// ATTRIBUTE
	var newATTRIB = function(ATT_actual, ATT_expected){
		ATT_expected = ATT_expected || {};
		if (!ATT_expected[0]) ATT_expected[0] = ATT_actual[0];
		if (!ATT_expected[1]) ATT_expected[1] = ATT_actual[1];
		if (!ATT_expected[2]) ATT_expected[2] = ATT_actual[2];
		ATT_expected[0] = ATT_expected[0].replace(/^\s*|\s*$/g,'').replace(/\\/g,'');
		ATT_expected[2] = ATT_expected[2].replace(/^\s*["']?|["']?\s*$/g,'').replace(/\\/g,'');
		
		return function(){
			
			// s = PARSE('[' + ATT_actual[0] + ']');
			// expect( s.expressions.length ).toEqual( 1 );
			// expect( s.expressions[0].length ).toEqual( 1 );
			// s = s.expressions[0][0];
			// expect( s.attributes[0].key ).toEqual( ATT_actual[0] );
			
			s = PARSE('[' + ATT_actual[0] + ATT_actual[1] + ATT_actual[2] + ']');
			
			expect( s.expressions.length ).toEqual( 1 );
			expect( s.expressions[0].length ).toEqual( 1 );
			
			var e = s.expressions[0][0];
			
			expect( e.attributes[0].key      ).toEqual( ATT_expected[0] );
			expect( e.attributes[0].operator ).toEqual( ATT_expected[1] );
			expect( e.attributes[0].value    ).toEqual( ATT_expected[2] );
			
		};
	};
	for (var ATTRIB_KEY_I=0, ATTRIB_KEY; ATTRIB_KEY = ATTRIB_KEYS[ATTRIB_KEY_I]; ATTRIB_KEY_I++) {
		describe(ATTRIB_KEY,function(){
			for (var ATTRIB_OPERATOR_I=0, ATTRIB_OPERATOR; ATTRIB_OPERATOR = ATTRIB_OPERATORS[ATTRIB_OPERATOR_I]; ATTRIB_OPERATOR_I++) {
				
				for (var ATTRIB_VALUE_I=0, ATTRIB_VALUE; ATTRIB_VALUE = ATTRIB_VALUES[ATTRIB_VALUE_I]; ATTRIB_VALUE_I++) {
					
					if (!ATTRIB_VALUE) continue;
					it("should support ATTRIB: `["+ATTRIB_KEY+(    ATTRIB_OPERATOR    )+ATTRIB_VALUE+"]`",
						newATTRIB([ATTRIB_KEY,    ATTRIB_OPERATOR    ,ATTRIB_VALUE])
					);
					
				}
			}
			
		});
	}
	
});



describe('PSEUDO', function(){
	
	it('pseudos array items should have a key property', function(){
		s = PARSE(':pseudo');
		expect( s.expressions[0][0].pseudos[0].key ).toEqual( 'pseudo' );
		
		s = PARSE(':pseudo1:pseudo2:pseudo3');
		expect( s.expressions[0][0].pseudos[0].key ).toEqual( 'pseudo1' );
		expect( s.expressions[0][0].pseudos[1].key ).toEqual( 'pseudo2' );
		expect( s.expressions[0][0].pseudos[2].key ).toEqual( 'pseudo3' );
		
	});
	it('pseudos array items should have a value property', function(){
		s = PARSE(':pseudo(pseudoValue)');
		expect( s.expressions[0][0].pseudos[0].value ).toEqual( 'pseudoValue' );
		
	});
	
	// PSEUDO
	var newPSEUDO = function(PSEUDO_KEY, PSEUDO_VALUE){
		return function(){
			
			s = PARSE(':' + PSEUDO_KEY);
			expect( s.expressions.length ).toEqual( 1 );
			expect( s.expressions[0].length ).toEqual( 1 );
			s = s.expressions[0][0];
			expect( s.pseudos[0].key ).toEqual( PSEUDO_KEY.replace(/\\/g,'') );
			
			s = PARSE(':' + PSEUDO_KEY +'('+ PSEUDO_VALUE + ')');
			expect( s.expressions.length ).toEqual( 1 );
			expect( s.expressions[0].length ).toEqual( 1 );
			s = s.expressions[0][0];
			expect( s.pseudos[0].key ).toEqual( PSEUDO_KEY.replace(/\\/g,'') );
			expect( s.pseudos[0].value ).toEqual( PSEUDO_VALUE.replace(/^["']/g,'').replace(/["']$/g,'').replace(/\\/g,'') );
			
		};
	};
	for (var PSEUDO_VALUE_I=0, PSEUDO_VALUE; PSEUDO_VALUE = PSEUDO_VALUES[PSEUDO_VALUE_I]; PSEUDO_VALUE_I++){
		for (var PSEUDO_KEY_I=0, PSEUDO_KEY; PSEUDO_KEY = PSEUDO_KEYS[PSEUDO_KEY_I]; PSEUDO_KEY_I++){
			
			it('should support PSEUDO: `'+ ':' + PSEUDO_KEY +'('+ PSEUDO_VALUE + ')' +'`', newPSEUDO(PSEUDO_KEY, PSEUDO_VALUE));
			
		}
	}
	
});



describe('COMBINATOR', function(){
	
	it('should give each simple selector in each selector expression a combinator', function(){
		
		s = PARSE('a');
		s = s.expressions[0][0];
		expect( s.combinator ).toEqual(' ');
		
		s = PARSE('a+b');
		expect( s.expressions[0][0].combinator ).toEqual(' ');
		expect( s.expressions[0][1].combinator ).toEqual('+');
		
	});
	
	// COMBINATOR
	var newCOMBINATOR = function(COMBINATOR){
		return function(){
			
			s = PARSE(COMBINATOR + 'b');
			expect( s.expressions[0][0].combinator ).toEqual( COMBINATOR );
			
			s = PARSE(COMBINATOR + ' b');
			expect( s.expressions[0][0].combinator ).toEqual( COMBINATOR );
			
			s = PARSE('a' + COMBINATOR + 'b');
			expect( s.expressions[0][0].combinator ).toEqual( ' ' );
			expect( s.expressions[0][1].combinator ).toEqual( COMBINATOR );
			
		};
	};
	
	for (var COMBINATOR_I=0, COMBINATOR; COMBINATOR = COMBINATORS[COMBINATOR_I]; COMBINATOR_I++){
		it('should support COMBINATOR: ‘'+COMBINATOR+'’', newCOMBINATOR(COMBINATOR));
	}
	
});

});

};