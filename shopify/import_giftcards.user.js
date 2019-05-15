// ==UserScript==
// @name         Shopify: Giftcard Import
// @namespace    https://www.ericseastrand.com/
// @version      0.1
// @description  Allows you to import multiple giftcards at once from the Shopify Admin Panel
// @author       Eric Seastrand
// @include      https://*//admin/gift_cards
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/shopify/import_giftcards.user.js
// ==/UserScript==

(function() {
    'use strict';

// Dont forget polyfill for stringPad: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd


	window.importGiftcard = importGiftcard;
	function importGiftcard(giftCardData) {
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
		$.ajax({
		    type: "POST",
		    url: "/admin/gift_cards",
		    data: postData,
		    success: function(data) { console.log(data); },
		    failure: function(errMsg) {
		        console.log(errMsg);
		    }
		});
	}

	importGiftcard(giftCardData);

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




})();
