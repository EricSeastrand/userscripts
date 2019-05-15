// ==UserScript==
// @name         Shopify: Giftcard Import
// @namespace    https://www.ericseastrand.com/
// @version      0.1
// @description  Allows you to import multiple giftcards at once from the Shopify Admin Panel
// @author       Eric Seastrand
// @include      https://*.myshopify.com/admin/gift_cards
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/shopify/import_giftcards.user.js
// ==/UserScript==

(function() {
    'use strict';

// Dont forget polyfill for stringPad: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd

    function addImportButton() {

        const importButtonHtml = `<button class="ui-button ui-button--transparent action-bar__link" type="button" name="button"><svg focusable="false" aria-hidden="true" class="next-icon next-icon--size-20 action-bar__link-icon next-icon--no-nudge"> <svg id="next-export-minor" width="100%" height="100%"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13.707 6.707a.996.996 0 0 1-1.414 0L11 5.414V13a1 1 0 1 1-2 0V5.414L7.707 6.707a1 1 0 0 1-1.414-1.414l3-3a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1 0 1.414zM17 18H3a1 1 0 1 1 0-2h14a1 1 0 1 1 0 2z"></path></svg></svg> </svg>Import</button>`;

        const buttonElement = $(importButtonHtml);

        $('.action-bar__top-links').prepend(buttonElement);

    }

    window.importGiftcard = importGiftcard;
    window.importMultipleGiftcards = importMultipleGiftcards;
    async function importGiftcard(giftCardData) {
        /*
    Expected format:
    var giftCardData = {
        "code": "GC_AZ123",
        "initial_value": "25.0000",
        "expires_on": null,
        "note": "Merry Christmas!!"
    };

        */

        let postConstants = getPostConstants();
        let postData = {...preparePostData(giftCardData), ...postConstants};

        console.log(postData);
        try {
            var ajaxResult = await $.ajax({
                type: "POST",
                url: "/admin/gift_cards",
                data: postData,
            });
        } catch (e) {
            const errorMessages = $(e.responseText).find('.errors.box').text();

            throw `Giftcard creation was not successful. Errors:${errorMessages}`;
        }

        if(ajaxResult.indexOf('gift card successfully issued') === -1) {
            throw `Giftcard creation was not successful, even though AJAX request was. Response:${ajaxResult}`;
        }

        return 1;
    }

    function sanitizeGiftCardCode(giftCardCode) {
        if(giftCardCode.length > 20) {
            throw `Gift Card Code: ${giftCardCode} is over 20 characters long. We won't truncate it for you since that can create other issues. It should be addressed manually.`;
        }
        let lowerCased = giftCardCode.toLowerCase();
        var sanitizedCode = lowerCased.replace(/[^a-z0-9]/g, '0');

        var paddedCode = sanitizedCode.padEnd(8, '0');

        return paddedCode;
    }

    function preparePostData(giftCardData) {
        let sanitizedCode = sanitizeGiftCardCode(giftCardData.code);
        if(sanitizedCode != giftCardData.code) {
            console.log("Code was sanitized to meet Shopify requirements: ", {old: giftCardData.code, new: sanitizedCode});
        }

        let request = {
            'gift-card-initial-value': giftCardData.initial_value,
            'customer_search': '',
            'gift_card': {
                'code': sanitizedCode,
                'initial_value': giftCardData.initial_value,
                'customer_id': giftCardData.customer_id || '',
                'note': giftCardData.note || '',
            }
        };

        if(giftCardData.expires_on) {
            request.gift_card.expires_on = giftCardData.expires_on;
        } else {
            request.gift_card.never_expires = 'on';
        }

        return request;
    }

    function getPostConstants() {
        let params = {
            '_method': 'post'
        };

        let csrfToken = jQuery('meta[name="csrf-token"]').attr('content');
        let csrfParam = jQuery('meta[name="csrf-param"]').attr('content')
        params[csrfParam] = csrfToken;

        return params;
    }

    async function importMultipleGiftcards(giftCardList) {
        const numInputs = giftCardList.length;
        console.log(`Importing giftcards: (${numInputs})`, giftCardList);

        const errors = [];
        for (var i=0; i<giftCardList.length; i++) {
            let cardData = giftCardList[i];

            try {
                let result = await importGiftcard(cardData);
            } catch (e) {
                let result = {'error': e, 'input': cardData};
                console.log("Exception on this giftcard:", result);
                errors.push(result);
            }
        }

        const numErrors = errors.length;
        if(numErrors > 0) {
            console.log(`Some giftcards did not import properly (${numErrors}):`, errors);
        }

    }



})();
