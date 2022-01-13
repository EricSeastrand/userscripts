// ==UserScript==
// @name         DataBricks : UI optimizations
// @namespace    https://ericseastrand.com/
// @version      0.1
// @description  Creature comforts like color coding for dev vs prod, taking advantage of larger screens, and more!
// @author       Eric Seastrand
// @match        https://*.cloud.databricks.com/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/databricks_ui_optimizations.user.js
// ==/UserScript==

(function() {
    'use strict';

    var style = document.createElement("style");

    // WebKit hack
    style.appendChild(document.createTextNode(""));

    // Add the <style> element to the page
    document.head.appendChild(style);

    console.log(style.sheet.cssRules); // length is 0, and no rules

    const newStyles = [
        '.table-view  div.schema .noscroll div.inner { max-height: none; }', // Sidebar table browser: make it larger to stop it from cutting off text on table names
        '.sidebar .sidebar-outer .ft-panel{ width: auto; }',
        '#filebrowser-popup, #filebrowser-popup .ui-resizable, #filebrowser-popup .filetree {width: auto !important;}',
     //   '.results-table .inner {max-height: none !important; }' // Query Results : Without this, you can't scroll through the results.
    ];


    console.log("Userscript is adding some additional styles", newStyles);
    newStyles.forEach(rule => style.sheet.insertRule(rule, 0) )

    waitFor(() => document.querySelector('#nbTitle'), augmentNotebookNameDisplay);


})();


function waitFor(readyCheckVariable, callback) {
  var readyCheck;
  if(typeof readyCheckVariable === "function"){
    readyCheck = readyCheckVariable;
  } else {
    readyCheck = function(){ return !!window[readyCheckVariable]; }
  }

  if( readyCheck() ) {
    return callback();
  }
  var interval = setInterval(function() {
    console.log("Readycheck");
      if (readyCheck()) {
      clearInterval(interval);
      callback();
    }
  }, 10);
}

function augmentNotebookNameDisplay(){
    // Color code the title so we know if we're in Dev / Test / Prod
    console.log("Doing color coded notebook");

    // Trick Databricks UI into showing the tooltip; this is the only place we can get the notebook path from afaik.
    document.querySelector('#nbTitle').dispatchEvent(new MouseEvent('mouseover', { 'bubbles': true }));

    let notebookPath = document.querySelector('.notebook-title-tooltip').textContent
    document.querySelector('#nbTitle').dispatchEvent(new MouseEvent('mouseout', { 'bubbles': true }));


    let colors = {
        'red': '#ff8080',
        'green': '#73ff66',
        'yellow': '#ffff66',
        'purple': '#ae8cf2',
        'gray': '#999999'
    }

    let colorName = 'gray'
    if(notebookPath.includes('/Development/')){
        colorName = 'green'
    }
    if(notebookPath.includes('/Test/')){
        colorName = 'yellow'
    }
    if(notebookPath.includes('/Production/')){
        colorName = 'red'
    }
    if(notebookPath.includes('/Users/')){
        colorName = 'purple'
    }

    let colorHex = colors[colorName]
    let notebookTitleElement = document.querySelector('.tb-title')
    applyElementStyle(notebookTitleElement, {
        'border' : `2px solid ${colorHex}`,
        'border-radius': '5px',
        'padding': '0px 4px'
    })


}

function applyElementStyle(element, style) {
    for (const property in style)
        element.style[property] = style[property];
}

