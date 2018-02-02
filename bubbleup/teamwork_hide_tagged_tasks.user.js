// ==UserScript==
// @name         TeamWork hide Ongoing tasks
// @namespace    https://www.bubbleup.net/
// @version      0.1
// @description  Hides tasks with specific tags from the main list.
// @author       You
// @match        https://pm.bubbleup.net/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/bubbleup/teamwork_hide_tagged_tasks.user.js
// ==/UserScript==

(function() {
    'use strict';
    if(window.location.href.indexOf('#/everything/tasks') === -1) {
        return;
    }

    var hiddenTags = [
        'Ongoing'
    ];

    function shouldTagBeVisible(taskTag) {
        for(var i=0; i<hiddenTags.length; i++) {
            var hiddenTag = hiddenTags[i];

            if(taskTag.indexOf(hiddenTag) !== -1) {
                return false;
            }
        }

        return true;
    }

    function findFilterableTasks() {
        return $('.tagHolder [data-bind="text:name"]').filter(function(e) {
            return shouldTagBeVisible( $(e).text() );
        }).closest('.task-row');
    }
    
    function hideFilterableTasks() {
        var filterable = findFilterableTasks();

        filterable.remove();

        console.log(filterable);
    }

    function cleanupEmptySections() {
        $('.taskCol').filter(function(){ return $(this).find('.task-row:visible').length < 1; }).hide();
        $('.projCol').closest('tr').filter(function(){ return $(this).find('.taskCol:visible').length < 1; }).hide();
    }

    function doTheUsefulStuff() {
        hideFilterableTasks();
        cleanupEmptySections();
    }

    $(function(){
        window.setTimeout(doTheUsefulStuff, 3000);
    });

})();
