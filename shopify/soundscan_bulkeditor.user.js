// ==UserScript==
// @name         Shopify: Soundscan MetaFields in Bulk Editor
// @namespace    https://www.ericseastrand.com/
// @version      0.1
// @description  Adds a shortcut to the Bulk Edit page which assist with entering the data necessary for our external Soundscan reporting tool to work
// @author       Eric Seastrand
// @include      https://*.myshopify.com/admin/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/shopify/soundscan_bulkeditor.user.js
// ==/UserScript==
(function() {
    'use strict';


    function hookFunction(object, functionName, callback) {
	(function(originalFunction) {
		object[functionName] = function () {
			var returnValue = originalFunction.apply(this, arguments);

			callback.apply(this, [returnValue, originalFunction, arguments]);

			return returnValue;
		};
	}(object[functionName]));
}

//hookFunction(window.Page, 'replaceState', onPageChange); // Run our code when Shopify changes page history state.
    onPageChange() //and at load time.


    function onPageChange() {
        if(window.location.search.indexOf('resource_name=Product') === -1 ) {
            console.log("This is not a product bulk edit page, so we're not loading anything");
            return;
        }

        console.log("Running when element present");

        runCodeWhenElementPresent('#resource_table', function() {
            addBubbleUpShortcuts([{
                'label': 'Soundscan Fields',
                'href': buildBulkEditorUrlForSoundscan()
            }]);
        });

    }



    function buildBulkEditorUrlForSoundscan() {
        const metaFieldsToEdit = [
            'metafields.soundscan.report:string',
            'metafields.soundscan.release-date:string',
            'metafields.soundscan.media-type:string',
            'variants.barcode'
        ];

        return buildBulkEditorUrl(metaFieldsToEdit);
    }

    function buildBulkEditorUrl(metaFieldsToEdit) {
        const originalQueryString = window.location.search.replace(/^\??/, ''); // Trim the leading ? from the URL
        const params = new URLSearchParams(originalQueryString);

        params.set('edit', metaFieldsToEdit.join(','));

        const newQueryString = params.toString();

        const fullEditorUrl = window.location.href.replace(originalQueryString, newQueryString);

        return fullEditorUrl;
    }

    function addBubbleUpShortcuts(items) {
        $('.bu-shortcuts').remove(); // just incase...

        const shortcutContainer = $('<div>').addClass('bu-shortcuts');

        shortcutContainer.append('<span>BU Shortcuts</span>');

        jQuery('#next-label--columns').closest('.next-card__section').prepend(shortcutContainer);

        items.forEach(function(item) {
            const link = $('<a class="bu-shortcut-link">').text(item.label);

            if (item.href) {
                link.attr('href', item.href);
                link.click(function() {
                    window.location.href = item.href;
                });
            }

            if (item.onRender) {
                item.onRender(link);
            }

            link.appendTo(shortcutContainer);
        });

    }

    async function runCodeWhenElementPresent(elementSelector, codeToRun) {
        while (1) {
            const element = document.querySelector(elementSelector);

            if (element) {
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

})();
