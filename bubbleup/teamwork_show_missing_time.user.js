// ==UserScript==
// @name         TeamWork show missing time
// @namespace    https://www.bubbleup.net/
// @version      0.1
// @description  Shows how much time you are missing for the day on the everything/time grid
// @author       You
// @match        https://pm.bubbleup.net/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/bubbleup/teamwork_hide_wasted_space.user.js
// ==/UserScript==

(function($) {
    'use strict';
    
    if(! /everything\/time/.test(window.location.href) ) {
      console.log("This does not appear to be the timelogs page. Not adding counters");
      return;
    }

	var timerCss = {
		'font-weight': 'bold',
		'font-size': '120%'
	};

	var timeLoggedElsewhere = 0;
	var earliestTimecard;

	var thisSystemName = 'teamwork';
	var otherSystemName = 'quickbase';

	var elapsedTimeContainer;
	var arrivalTimeContainer;
	var deficitTimeContainer;
	var deficitTimeHoursContainer;

	function _init() {
		elapsedTimeContainer = $('<span>').css(timerCss);
		arrivalTimeContainer = $('<span>').css(timerCss);
		deficitTimeContainer = $('<span>').css(timerCss).css({'color': '#FF8888'});
		deficitTimeHoursContainer = $('<span>').css(timerCss).css({'color': '#FF8888', "font-size": '110%'});

		var containerDiv = $("<div>")
			.append("Arrived:").append(arrivalTimeContainer)
			.append(" Been Here:").append(elapsedTimeContainer)
			.append(" Missing:").append(deficitTimeContainer)
			.append(' (').append(deficitTimeHoursContainer).append('h)')
		;

		containerDiv.css({
			'font-size'   : '180%',
			'display'     : 'inline-block',
			'margin-left' : '1%',
		});

		containerDiv.insertAfter('.new__main-header__base .new__main-header__left');

		window.setInterval(syncFromServer, .25 /* minutes */ * (60 * 1000));
		syncFromServer();

		window.setInterval(updateTimeElapsed, 1000);

		//idleTimeout(120, cycleWindows);
	}

	function syncFromServer() {
		getFromServer(function(response){
			var data = JSON.parse(response.responseText);
			console.log("Server replied with ", data);

			if( !isNaN(data[otherSystemName + '_earliest']) ) {
				earliestTimecard = parseFloat(data[otherSystemName + '_earliest']);
			}
			if( !isNaN(data[otherSystemName + '_total']) ) {
				timeLoggedElsewhere = parseFloat(data[otherSystemName + '_total']);
			}
		});
	}

	function getElapsedString(seconds) {
		var prefix = (seconds < 0) ? '-' : '';

		var date = new Date(null);
	    date.setSeconds(Math.abs(seconds) ); // specify value for SECONDS here
	    return prefix + (date.toISOString().substr(11, 8));
	}

	function getArrivalTime() {
		var defaultTime = getDefaultArrivalTime();

		try {
			// var firstTime = moment($('.widget-time-list table:first .timeEntryRow:last .time:first').attr('title').replace('Logged: ', ''), "MM/DD/YYYY h:mma").toDate();
			var dateString = $('.widget-time-list:eq(0) .gridHeading.subTitle').text().trim() + ' ' + $('.widget-time-list table:first .timeEntryRow:last .time:first').text().trim();
			var firstTime = moment(dateString, "dddd[,] DD MMMM h:mma").toDate();
		} catch(e) {
			console.log("Can't get start time", e);
			return defaultTime;
		}

		if( earliestTimecard > 0 && firstTime.getTime() > earliestTimecard ) {
			firstTime = new Date( earliestTimecard );
		}

		var checkThresholdHours = 12;

		if( (defaultTime - firstTime) > (checkThresholdHours * 60 * 60 * 1000) ) {
			//console.log("Using default start time", defaultTime);
			return defaultTime;
		}

		//console.log("Calculated day start time of", firstTime);

		return firstTime;
	}

	function getDefaultArrivalTime() {
		var arrivalTime = new Date();
		arrivalTime.setHours(7);
		arrivalTime.setMinutes(0);
		arrivalTime.setSeconds(0);

		return arrivalTime;
	}

	var localTimeLoggedToServer = 0;
	var hasSyncedTimeLoggedToServer=false;
	function updateTimeElapsed() {
		var arrivalTime = getArrivalTime();

		var now = new Date();

		var beenHere = now - arrivalTime;

		var timeSinceArrival = getElapsedString(beenHere / 1000); // milliseconds to sec
		//console.log(timeSinceArrival);

		var localTimeLogged = getTimeLogged();

		if( localTimeLoggedToServer != localTimeLogged ) {
			console.log("Detected a change in the amount of time logged; Syncing to server.")
			hasSyncedTimeLoggedToServer = false;
		}

		if( !hasSyncedTimeLoggedToServer ) {
			var dataToSend = {};
			
			dataToSend[thisSystemName + '_total'] = localTimeLogged;
			dataToSend[thisSystemName + '_earliest'] = arrivalTime.getTime();
			
			localTimeLoggedToServer = dataToSend[thisSystemName + '_total'];

			sendToServer(dataToSend);
			hasSyncedTimeLoggedToServer = true;
		}
		
		var totalTimeLogged = (localTimeLogged + timeLoggedElsewhere);
		//console.log("Total Time Logged:", totalTimeLogged, getElapsedString(totalTimeLogged / 1000));
		var deficit = beenHere - totalTimeLogged;

		elapsedTimeContainer.text(timeSinceArrival);
		arrivalTimeContainer.text( arrivalTime.toLocaleTimeString() );

		deficitTimeContainer.text( getElapsedString(deficit / 1000) );

		var deficitHours = deficit / 1000 / 60 / 60;

		deficitTimeHoursContainer.text( deficitHours.toPrecision(4) );
	}

	function getTimeLogged() {
		var hours = parseFloat( $('.totalGrid:first tr:first td:last').text() );

		return hours * 60 * 60 * 1000;
	}


	function cycleWindows() {
		window.location.reload(false);
	}


	function idleTimeout(seconds, callback) {
	    var t;
	    $(window).on('load mousemove mousedown click scroll keypress', resetTimer);
	    //window.onload = resetTimer;
	    //window.onmousemove = resetTimer;
	    //window.onmousedown = resetTimer; // catches touchscreen presses
	    //window.onclick = resetTimer;     // catches touchpad clicks
	    //window.onscroll = resetTimer;    // catches scrolling with arrow keys
	    //window.onkeypress = resetTimer;

	    function resetTimer() {
	        clearTimeout(t);
	        t = setTimeout(callback, seconds * 1000);  // time is in milliseconds
	    }
	}

	var initInterval = window.setInterval(function(){
		if( !jQuery ) {
			return; // jQ not loaded yet...
		}

		$ = jQuery;

		if( !$('.titlecontent:first #pageTitle')[0] ) {
			return;
		}

    	_init();
    	window.clearInterval(initInterval);
		
	}, 100);

	//var ajaxUrl = '';

	function sendToServer(data) {
		return;
		console.log("Sending to server", data);
		$.ajax({
			url: ajaxUrl,
			dataType: 'json',
			xhrFields: {
				withCredentials: true
			},
			data: data
		});
	}

	function getFromServer(callback) {
		return;
		$.ajax({
			url: ajaxUrl,
			dataType: 'json',
			xhrFields: {
				withCredentials: true
			},
			complete: callback
		});
	}



})(jQuery);
