// ==UserScript==
// @name         Make grid rows support moddle/ctrl click.
// @namespace    https://www.bubbleup.net/
// @version      0.1
// @description  Adds middleclick to the grid to open rows in a new tab
// @author       Eric Seastrand
// @include      /admin/
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/magento_middleclick_new_tab_grid_links.user.js
// ==/UserScript==
(function() {
     'use strict';

    // forEach method, could be shipped as part of an Object Literal/Module
    var forEach = function(array, callback, scope) {
        for (var i = 0; i < array.length; i++) {
            callback.call(scope, i, array[i]); // passes back stuff we need
        }
    };

    var iterateSelector = function(selector, callback) {
        var myNodeList = document.querySelectorAll(selector);
        forEach(myNodeList, function(index, value) {
            callback(value, index);
        });
    }

       
    iterateSelector('.grid table.data tr', function(el) {
        var url = el.title;
        el.addEventListener('click', function(e){
            if(e.ctrlKey || e.which == 2){
                window.open(url);
            }
            console.log(e, el, url);
        }, true)
    });
})();
