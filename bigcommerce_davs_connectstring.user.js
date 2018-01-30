// ==UserScript==
// @name         BigCommerce: Add Davs Connect String
// @namespace    https://www.bubbleup.net/
// @version      0.1
// @description  Adds a linux-style formatted connection string for davs:// which you can copy/paste into Nautilus or any other filesystem browser.
// @author       Eric Seastrand
// @include      https://*/admin/users/edit?userId=*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/bigcommerce_davs_connectstring.user.js
// ==/UserScript==

(function() {
    'use strict';

    var input = $('<input>').attr({disabled:true}).addClass('field-xlarge');

    //input.insertAfter('div.sectionWebDav:last');
    input.insertAfter('#webdavpath');

    var string = formatConnectionString($('#webdavpath').val(), $('#useremail').val(), $('#webdavpassword').val());

    input.val(string);

    function formatConnectionString(path, email, password) {
        path = path.replace(RegExp("^[a-z]+://", "i"), '');//trim protocol

        var parts = [
            'davs://',
            //email, ':', password, '@',
            path
        ];

        return parts.join('');
    }

})();
