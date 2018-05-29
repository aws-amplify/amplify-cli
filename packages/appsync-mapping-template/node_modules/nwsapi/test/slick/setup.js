
(function(global){

var runnerOnLoad = global.onload;

global.onload = function(){

	// Unit tests
	
	if (unitTests) unitTests();
	
	// Mock creation

	Mock.CreateTemplate('Generic HTML4 (transitional)',			'../mocks/template-transitional.html');
	Mock.CreateTemplate('Generic HTML4 (standard)',				'../mocks/template-standard.html');
	Mock.CreateTemplate('Generic HTML4 (almost-standard)',		'../mocks/template-almost.html');
	Mock.CreateTemplate('Generic HTML4 (quirks)',				'../mocks/template-quirks.html');

	if (!Browser.ie || Browser.version > 8){
		Mock.CreateTemplate('Generic XHTML',					'../mocks/template.xhtml');
		Mock.CreateTemplate('Generic XML',						'../mocks/template.xml');
		Mock.CreateTemplate('SVG',								'../mocks/MooTools_Logo.svg');
	}
	
	if (Browser.ie){
		Mock.CreateTemplate('Generic HTML4 (chromeframe)',		'../mocks/template-chromeframe.html');
		if (Browser.version >= 8){
			Mock.CreateTemplate('Generic HTML4 (IE8 as IE7)',	'../mocks/template-ie7.html');
		}
	}

	Mock.CreateTemplate('Google Closure',						'../mocks/query_test-google_closure.html');
	Mock.CreateTemplate('PrototypeJS',							'../mocks/query_test-prototype.html');
	Mock.CreateTemplate('jQuery',								'../mocks/query_test-jquery.html');
	Mock.CreateTemplate('Dojo',									'../mocks/query_test-dojo.html');
	Mock.CreateTemplate('YUI',									'../mocks/query_test-yui.html');
	Mock.CreateTemplate('Slick',								'../mocks/query_test-slick.html');
	Mock.CreateTemplate('HTML5 shim',							'../mocks/html5-shim.html');
	
	
	new Mock.Request('XML responseXML',							'../mocks/xml.xml');
	new Mock.Request('SVG responseXML',							'../mocks/MooTools_Logo.svg');

	// Setup
	
	setupMethods(this);
	new Mock('', setupMethods);
	
	verifySetupMethods(this);
	new Mock('', verifySetupMethods);
	
	if (typeof verifySetupContext != 'undefined') {
		new Mock('', verifySetupContext);
	}
	if (typeof specsSlickAPI != 'undefined') {
		specsSlickAPI(this);
	}
	
	// Parser specs
	
	if (typeof specsParser != 'undefined') {
		specsParser(this);
	}
	
	// Match specs
	
	if (typeof specsMatch != 'undefined') {
		//specsMatch(this);
	}
	
	// Specific Mocks

	new Mock('Closure', specsGoogleClosure);
	new Mock('PrototypeJS', specsPrototype);
	new Mock('jQuery', specsJQuery);
	new Mock('Dojo', specsDojo);
	new Mock('YUI', specsYUI);
	new Mock(/Generic.*?\bHTML4/, specsMockTemplate);
	new Mock('XML responseXML', specsAssetsTemplateXML);
	new Mock('Slick', specsSlickHtml);

	// Specific Bugs

	new Mock(/\b(xml|svg|xhtml|html4)\b/i, specsSelectorEngineBugs);
	new Mock(/\b(xml|svg|xhtml|html4)\b/i, specsBrowserBugsFixed);
	
	// Selector Tests
	
	new Mock(/\b(xml|svg|xhtml|html4)\b/i, specsSelectorExhaustive);
	new Mock(/\b(xml|svg|xhtml|html4)\b/i, specsSelectNthChild);
	
	// XML
	
	new Mock(/\b(xml|svg|xhtml)\b/i, specsIsXML);
	new Mock(/\b(html)\b/i, specsIsNotXML);
	
	// HTML5
	
	new Mock(/\b(html5)\b/i, specsHTML5);
	
};

global.runnerOnLoad = runnerOnLoad;

})(window);
