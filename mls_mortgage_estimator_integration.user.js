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

console.log("loaded");


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
		hoaDues: hoaAnnual
	};
}

function prepareDataForMortgageCalculator() {
	var listing = extractListingData();
	var dataToSend = [
		'Monthly HOA' : 
		'Property Tax' : listing.taxAnnual,
		'PMI' : '0.55'
		'Home Ins' : '2000'
	];

}


console.log(prepareDataForMortgageCalculator());
