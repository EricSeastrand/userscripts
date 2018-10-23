// ==UserScript==
// @name         PS DB transfer shortcut
// @namespace    https://www.bubbleup.net
// @version      0.1
// @description  Builds DB transfer commands/queries for you, based on your selections in the deployment list
// @author       Eric Seastrand
// @match        https://push-service.busites.com/index.php?r=deployments/admin*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/bubbleup/pushservice_db_transfer_shortcut.user.js
// ==/UserScript==

(function() {
    'use strict';
   // No code here for now. It all loads dynamically from our dev server.

    var $table = $('#deployments-grid table');

    var tableRows = $table.find('tbody tr');

    var environmentColumnIndex =  $table.find('thead tr th:contains("Environment")').index();

    var deploymentData = tableRows.map(function(){
        return {
            'environment' : $(this).find('td').eq(4).text(),
            'hostname' : $(this).find('td').eq(0).find('a').eq(0).text(),
            'core' : $(this).find('td').eq(1).text(),
            'deployment_id' : $(this).find('a.view').attr('href').replace('/index.php?r=deployments/view&id=', ''),
        };
    });

    deploymentData = $.makeArray(deploymentData);
    for (var i in deploymentData) {
        var deployment = deploymentData[i];
        if(deployment.environment !== 'Production 7'){
            continue;
        }

        var deploymentsWithSameHostname = filterByKey(deploymentData, 'hostname', deployment.hostname);

        var correspondingOldDeployment = filterByKey(deploymentsWithSameHostname, 'environment', 'Production 56');
        correspondingOldDeployment = correspondingOldDeployment[0];

        if(!correspondingOldDeployment){
            console.log("Could not find a corresponding deployment for", deployment);
            continue;
        }

        console.log("Same Site", deployment, correspondingOldDeployment);
        var transferUrl = createTransferUrl(correspondingOldDeployment, deployment);
        console.log(`To copy database for ${deployment.hostname} from ${correspondingOldDeployment.environment} to ${deployment.environment}, this will build the queries:`, transferUrl);
    }


    function createTransferUrl(sourceDeployment, destinationDeployment) {
        var fromId = sourceDeployment.deployment_id;
        var toId = destinationDeployment.deployment_id;
        return `https://push-service.busites.com/index.php?r=sites/view&id=7#from-deployment=${fromId}&to-deployment=${toId}`;
    }

})();

    function filterByKey(data, key, val) {
    var filtered = data.filter(function(obj) {
      return obj[key] == val;
    });

    return filtered;
}
