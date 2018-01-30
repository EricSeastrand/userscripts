// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds middleclick
// @author       Eric Seastrand
// @match        https://*.*.*.bubbleup.com/*admin*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

   iterateSelector('.grid table.data tr', function(e){
   		e.addEventListener('click', )
   });

// forEach method, could be shipped as part of an Object Literal/Module
var forEach = function (array, callback, scope) {
  for (var i = 0; i < array.length; i++) {
    callback.call(scope, i, array[i]); // passes back stuff we need
  }
};

var iterateSelector = function(selector, callback) {	
	var myNodeList = document.querySelectorAll(selector);
	forEach(myNodeList, function (index, value) {
	    callback(value, index);
	});
}



})();
