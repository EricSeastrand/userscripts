// ==UserScript==
// @name         SQL Formatter Sane Default Setter
// @namespace    https://www.bubbleup.net/
// @version      0.1
// @description  Sets sane defaults for SQL formatting
// @author       Eric Seastrand
// @include      www.dpriver.com\/pp\/sqlformat.htm
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/sql_formatter_defaults.user.js
// ==/UserScript==

function setSaneDefaults() {
	// forEach method, could be shipped as part of an Object Literal/Module
	var forEach = function (array, callback, scope) {
	  for (var i = 0; i < array.length; i++) {
	    callback.call(scope, i, array[i]); // passes back stuff we need
	  }
	};

	var iterateSelector = function(selector, callback) {
		var elements = document.querySelectorAll(selector);
		forEach(elements, callback);
	};

	iterateSelector('#formatoptions select', function (index, value) {
	    value.value="Unchanged";
	});
	iterateSelector('#formatoptions select[name="keywordcs"]', function (index, value) {
	    value.value="Uppercase";
	});
	iterateSelector('#formatoptions select[name="andorunderwhere"], #formatoptions select[name="removelnbr"]', function (index, value) {
		value.checked = true;
	});

	iterateSelector('select[name="dbvendor"]', function (index, value) {
		value.value = 'mysql';
	});
	
}

setSaneDefaults();
