// ==UserScript==
// @name         HARMLS Mortgage Estimator Integration
// @namespace    https://www.ericseastrand.com/
// @version      0.1
// @description  Pre populates fields in the mortgage estimator using data from a MLS listing
// @author       Eric Seastrand
// @include      https://www.mortgagecalculator.org/
// @include      https://matrix.harmls.com/Matrix/Public/Portal.aspx*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/mls_mortgage_estimator_integration.user.js
// ==/UserScript==

function extractByKey(data, key, val) {
    var found = data.find(function(obj) {
      return obj[key] == val;
    });

    return found;
}

function sanitizeFloat(floatString) {
    var string = floatString.replace(/[^\d\.]/g, '')
    return parseFloat(string);
}


function extractListingData() {
    var data = $('.J_sect .row').map(function(e){
        var key = $(this).children().first().text().trim();
        var val = $(this).children().last().text().trim();

        return {key: key, val: val, el: this};
    });
    data = $.makeArray(data);
    console.log("Raw Data Extracted", data);

    data.extractByKey = function(val){ return extractByKey(this, 'key', val).val; };
    data.extractAsAmount = function(val) { return sanitizeFloat(data.extractByKey(val)); };

    var taxRate = data.extractAsAmount('Tax Rate');
    var listPrice = data.extractAsAmount('List Price');
    var hoaAmount = data.extractAsAmount('Maint Fee Amt');

    var hoaSchedule = data.extractByKey('Maint Fee Pay Schedule');
    var hoaAnnual;
    if(hoaSchedule == 'Annually') {
        hoaAnnual = hoaAmount;
    }else if(hoaSchedule == 'Monthly') {
        hoaAnnual = hoaAmount * 12;
    }else {
        var err = "Unable to determine HOA dues schedule multiplier from '"+hoaSchedule+"'";
        console.log(err, hoaSchedule, data);
        throw err;
    }

    return {
        listPrice: listPrice,
        taxRate : taxRate,
        taxAnnual: taxRate * listPrice / 100,
        hoaAnnual: hoaAnnual
    };
}

function prepareDataForMortgageCalculator() {
    var listing = extractListingData();
    var dataToSend = {
        hoa : listing.hoaAnnual / 12, // 'Monthly HOA'
        property_tax : listing.taxAnnual,
        pmi : '0.55',
        hoi : '2000',
        homevalue: listing.listPrice,
        downpayment_type: 'percent',
        downpayment: 3
    };

    return dataToSend;

}

function buildMortgageCalculatorLink() {
    var queryString = jQuery.param(prepareDataForMortgageCalculator());

    return 'https://www.mortgagecalculator.org/#' + queryString;
}

//console.log(prepareDataForMortgageCalculator());

if(window.location.href.indexOf('https://www.mortgagecalculator.org/#') !== -1) {
    $(setMortageCalculatorFieldsFromHash);
}

function setMortageCalculatorFieldsFromHash() {
    var queryString = window.location.hash.slice(1);
    var inputsToSet = new URLSearchParams( queryString );
    for (let definition of inputsToSet) {

        var field = definition[0];
        var value = definition[1];

        console.log("Setting field", field, value);

        var input = $('.calcu-block input').filter((i, e) => e.name=="param["+field+"]");
        
        if(input.find('[type="radio"]').length == input.length ) {
            console.log("Detected radio:", field);
            var radioToCheck = input.find((i, e) => e.value == value );
            console("Checking radio", radioToCheck);
            radioToCheck.prop("checked", true);
            return;
        }

        console.log("Setting field", input);

        input.val(value);
    }


}

function openMortgageCalculator() {
    var url = buildMortgageCalculatorLink();
    window.open(url);
}
/*
var keybinds = [
    {keyCode: 72, altKey: true, function: openMortgageCalculator}
];
keybinds.matchFromEvent = function(event) {
    var propsToCheck = ['keyCode', 'altKey', 'ctrlKey'];
    this.find(function(obj) {

        return obj[key] == val;
    });
}
*/
$(document).keydown(function(e){
    if(e.keyCode === 72 && e.altKey) {
        // Alt + H
        openMortgageCalculator();
    }

});
