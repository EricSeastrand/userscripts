// ==UserScript==
// @name         TeamWork hide wasted space
// @namespace    https://www.bubbleup.net/
// @version      0.1
// @description  Hides various items which waste valuable screen real-estate on TW.
// @author       You
// @match        https://pm.bubbleup.net/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/bubbleup/teamwork_hide_wasted_space.user.js
// ==/UserScript==

(function() {
    'use strict';

    var style = document.createElement("style");

    // WebKit hack
    style.appendChild(document.createTextNode(""));

    // Add the <style> element to the page
    document.head.appendChild(style);

    console.log(style.sheet.cssRules); // length is 0, and no rules

    style.sheet.insertRule('div#mlogo{ display: none; }', 0);


})();
