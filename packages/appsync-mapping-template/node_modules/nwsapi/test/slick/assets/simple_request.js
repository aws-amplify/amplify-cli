var SimpleRequest = (function(){
	
	/**
	 * Parse the XML document contained in the string argument and return
	 * a Document object that represents it.
	 */
	var parseXML = (function(){
		// Mozilla, Firefox, and related browsers
		return (typeof DOMParser != "undefined") ? function(rawXML){
			return (new DOMParser()).parseFromString(rawXML, "application/xml");
		} : (typeof ActiveXObject != "undefined") ? function(rawXML){
			var xmlDocument = new ActiveXObject("Microsoft.XMLDOM");
			xmlDocument.async = false;
			xmlDocument.loadXML(rawXML);
			if (xmlDocument.parseError && xmlDocument.parseError.errorCode)
				xmlDocument.loadXML(rawXML.replace(/<!DOCTYPE[^>]*?>/i,''));
			if (xmlDocument.parseError && xmlDocument.parseError.errorCode)
			throw new Error([''
				,("Error code: " + xmlDocument.parseError.errorCode)
				,("Error reason: " + xmlDocument.parseError.reason)
				,("Error line: " + xmlDocument.parseError.line)
				,rawXML
			].join('\n'));
			return xmlDocument;
		} : function(){
			return null;
		};
	})();
	
	function SimpleRequest(){
		this.initialize();
	};
	
	SimpleRequest.prototype = {
		
		initialize: function(){
			this.xhr = this.createXHR();
		},
		
		createXHR: function(){
			// return ('XMLHttpRequest' in window)? new XMLHttpRequest(): new ActiveXObject('MSXML2.XMLHTTP');
			return ('XMLHttpRequest' in window) ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
		},
		
		stateChange: function(fn){
			if(this.xhr.readyState == 4 && this.xhr.status == 200){
				fn.apply(this, [this.xhr.responseText, this.getXML()]);
			}
		},
		
		getXML: function(){
			if (this.xhr.responseXML && this.xhr.responseXML.documentElement)
				return this.xhr.responseXML;
			return parseXML(this.xhr.responseText);
		},
		
		send: function(url, fn){
			var self = this;
			this.xhr.onreadystatechange = function(){ self.stateChange(fn); };
			this.xhr.open('get', url + '?n=' + (new Date()).getTime(), true);
			this.xhr.send(null);
		}
		
	};
	
	return SimpleRequest;
})();
