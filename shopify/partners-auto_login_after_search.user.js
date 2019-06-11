// ==UserScript==
// @name         Shopify: Partners Panel Auto-Login
// @namespace    https://www.ericseastrand.com/
// @version      0.1
// @description  Automatically clicks the Login button for you, after searching for a store in the Shopify Partners Panel, assuming there is only 1 search result.
// @author       Eric Seastrand
// @include      https://partners.shopify.com/*/stores*search_value=*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/shopify/partners-auto_login_after_search.user.js
// ==/UserScript==

(function() {
    'use strict';

    runCodeWhenElementPresent('.store-list-item', handleAutomaticLogin);

})();


function handleAutomaticLogin() {
    const loginButtons = document.querySelectorAll('.store-list-item__actions a[href$="/login_development"], .store-list-item__actions a[href$="/login_managed"]');


    if(loginButtons.length > 1) {
        console.log("There is more than 1 login button, so you need to click it yourself. Auto-login won't happen");
        return;
    }
    if(loginButtons.length < 1) {
        console.log("Unable to locate any login buttons. Auto-login won't happen");
        return;
    }
    const loginButton = loginButtons[0];
    loginButton.removeAttribute('target');
    loginButton.click();
}

async function runCodeWhenElementPresent(elementSelector, codeToRun) {
	while(1) {
		const element = document.querySelector(elementSelector);

		if(element) {
			console.log("Found element at", new Date());
			codeToRun();
			break;
		}

		//console.log("Wait for next frame started at", new Date());
		await nextFrame();
	}
}

async function nextFrame() {
    return new Promise(resolve => {
        requestAnimationFrame(resolve)
    })
}

