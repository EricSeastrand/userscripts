// ==UserScript==
// @name         SQL Formatter Sane Default Setter
// @namespace    https://www.bubbleup.net/
// @version      0.1
// @description  Sets sane defaults for SQL formatting
// @author       Eric Seastrand
// @match        http://www.dpriver.com/pp/sqlformat.htm
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

	iterateSelector('#formatoptions select', function (index, element) {
	    element.value="Unchanged";
	});
	iterateSelector('#formatoptions select[name="keywordcs"]', function (index, element) {
	    element.value="Uppercase";
	});
	iterateSelector('#formatoptions select[name="removelnbr"]', function (index, element) {
		element.checked = true;
	});
	iterateSelector('#formatoptions input[name="andorunderwhere"]', function (index, element) {
		element.checked = true;
	});

	iterateSelector('#formatoptions input[name="maxlenincm"]', function (index, element) {
		element.value = 999;
	});


	iterateSelector('select[name="dbvendor"]', function (index, element) {
		element.value = 'mysql';
	});

    iterateSelector('#ioutputsql', function (index, element) {
		element.style.height = '1000px';
	});

	iterateSelector('#inputsql', function (index, element) {
		element.addEventListener('blur', function(){
			SQLFMT.format();
		});
	});



}

setSaneDefaults();
