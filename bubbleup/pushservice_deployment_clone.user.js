// ==UserScript==
// @name         PS Deployment Clone Query Builder
// @namespace    https://www.bubbleup.net
// @version      0.1
// @description  Builds deployment clone commands/queries for you
// @author       Eric Seastrand
// @match        https://push-service.busites.com/index.php?r=deployments/admin*
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

	var queries = buildQueriesForDeploymentClone({deployment_id: deploymentId}, 30);

    console.log(queries);
});

function buildQueriesForDeploymentClone(sourceDeployment, destinationEnvironmentId) {
    destinationEnvironmentId = destinationEnvironmentId || 30; // Prod 7
    var deploymentId = sourceDeployment.deployment_id;
    var sql = `
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
	-- REPLACE(repo, '/tags/production', '/tags/staging'),
	repo,
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

INSERT INTO \`deployment_replacements\` 
  (\`deployment_id\`, \`search\`, \`replace\`, \`file\`)
VALUES
  (@new_deployment_id, '{import_media}', 'true', '/onpush.sh'),
  (@new_deployment_id, '{import_media_params}', 'include-meet-and-greet', '/onpush.sh')
;

SELECT @new_deployment_db_name:=(SELECT \`replace\` FROM deployment_replacements WHERE deployment_id=@new_deployment_id AND \`search\`="{db_name}" LIMIT 1);
SELECT @new_deployment_db_user:=(SELECT \`replace\` FROM deployment_replacements WHERE deployment_id=@new_deployment_id AND \`search\`="{db_user}" LIMIT 1);
SELECT @new_deployment_db_pass:=(SELECT \`replace\` FROM deployment_replacements WHERE deployment_id=@new_deployment_id AND \`search\`="{db_password}" LIMIT 1);


set @db_create_query = CONCAT(
'CREATE DATABASE IF NOT EXISTS \`', @new_deployment_db_name, '\`;'
);

PREPARE stmt FROM @db_create_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


set @db_grant_query = CONCAT(
'GRANT ALL ON \`', @new_deployment_db_name, '\`.* TO "', @new_deployment_db_user, '"@"%" IDENTIFIED BY "', @new_deployment_db_pass, '";'
);

PREPARE stmt FROM @db_grant_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

`;

    return sql;
}


})();
