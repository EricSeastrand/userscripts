// ==UserScript==
// @name         PS Deployment Clone Query Builder
// @namespace    https://www.bubbleup.net
// @version      0.1
// @description  Builds deployment clone commands/queries for you
// @author       Eric Seastrand
// @match        https://push-service.busites.com/index.php?r=deployments/view&id=*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/bubbleup/pushservice_deployment_clone.user.js
// ==/UserScript==

(function() {
    'use strict';
   
    $('#deployments-grid table tbody tr').click(function(e){
	if(e.ctrlKey !== true) {
		return;
	}

	var deploymentId = $(this).find('a.view').attr('href').replace('/index.php?r=deployments/view&id=', '');

	var queries = buildQueriesForDeploymentClone(deploymentId, 30);
});

function buildQueriesForDeploymentClone(deploymentId, destinationEnvironmentId) {
    destinationEnvironmentId = destinationEnvironmentId || 30; // Prod 7
    return `
-- Change this topmost value to the ID of the deployment to migrate. Probably don’t need to change the environment_id unless it’s not our regular PHP7 env.
SET @old_deployment_id=${deploymentId};
SET @new_environment_id=${destinationEnvironmentId};

INSERT INTO deployments (\`id\`, \`site_id\`, \`environment_id\`, \`hostname\`, \`core_repo\`, \`repo\`, \`last_push_id\`, \`signature\`, \`apache_restart\`, \`ssl_certificate_id\`, \`no_ssl\`)
SELECT
	NULL as id,
	site_id,
	@new_environment_id as environment_id,
	hostname,
	core_repo,
	REPLACE(repo, '/tags/production', '/tags/staging'),
	last_push_id,
	signature,
	apache_restart,
	ssl_certificate_id,
	no_ssl
FROM deployments WHERE id=@old_deployment_id;

SELECT @new_deployment_id:=LAST_INSERT_ID();

INSERT INTO \`deployment_replacements\`
      (\`id\`, \`deployment_id\`,    \`search\`, \`replace\`, \`file\`)
SELECT NULL, @new_deployment_id, \`search\`, \`replace\`, \`file\` FROM deployment_replacements WHERE deployment_id=@old_deployment_id;

UPDATE \`deployment_replacements\`
SET \`replace\`=(SELECT db_host FROM environments WHERE id=@new_environment_id)
WHERE deployment_id=@new_deployment_id AND \`search\`="{db_host}";

UPDATE \`deployment_replacements\`
SET \`replace\`=(SELECT cache_host FROM environments WHERE id=@new_environment_id)
WHERE deployment_id=@new_deployment_id AND \`search\`="{redis_host}";


`;

}
    
    
})();

