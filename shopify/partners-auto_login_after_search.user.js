// ==UserScript==
// @name         Shopify: Partners Panel Auto-Login
// @namespace    https://www.ericseastrand.com/
// @version      0.1
// @description  Automatically clicks the Login button for you, after searching for a store in the Shopify Partners Panel, assuming there is only 1 search result.
// @author       Eric Seastrand
// @include      https://partners.shopify.com/*/development_stores*q=*
// @include      https://partners.shopify.com/*/managed_stores*q=*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/shopify/partners-auto_login_after_search.user.js
// ==/UserScript==

(function() {
    'use strict';
    
    const loginButtons = document.querySelectorAll('.ui-data-table__fixed-wrapper a[href$="/login"]');
    
    if(loginButtons.length > 1) {
        console.log("There is more than 1 login button, so you need to click it yourself. Auto-login won't happen");
        return;
    }
    if(loginButtons.length < 1) {
        console.log("Unable to locate any login buttons. Auto-login won't happen");
        return;
    }
    
    loginButtons[0].click();
})();
