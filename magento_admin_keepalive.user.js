// ==UserScript==
// @name         Magento Admin Keepalive
// @namespace    https://www.bubbleup.net/
// @version      0.1
// @description  Detects when you are on a Magento admin page, and periodically pings the server to keep your session alive as long as the tab is open.
// @author       Eric Seastrand
// @include      /\.bubbleup.com\/(index.php\/)?admin\//
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/magento_admin_keepalive.user.js
// ==/UserScript==

window.setInterval(function _keepAdminAlive() {
    if (!$$('p.super:contains("Logged in as")')[0]) {
    	console.log("Not logged in. Doing nothing");
    	return;
    }

    console.log("Timeout reached. Keeping session alive!");
    new Ajax.Request('/admin/dashboard/index', {
        method: 'get'
    });
    toggleSelectsUnderBlock($('loading-mask'), true);
    Element.hide('loading-mask');
    
}, 600000);

console.log("Keepalive loaded");