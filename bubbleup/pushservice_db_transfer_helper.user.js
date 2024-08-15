// ==UserScript==
// @name         PS DB transfer helper
// @namespace    https://www.bubbleup.net
// @version      0.3
// @description  Builds DB transfer commands/queries for you
// @author       Eric Seastrand
// @match        https://push-service.busites.com/index.php?r=sites/view&id=*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/EricSeastrand/userscripts/master/bubbleup/pushservice_db_transfer_helper.user.js
// ==/UserScript==

(function() {
    'use strict';
    

function loadStylesheet(url) {
        var head = document.getElementsByTagName('HEAD')[0];  
  
        // Create new link Element 
        var link = document.createElement('link'); 
  
        // set the attributes for link element  
        link.rel = 'stylesheet';  
      
        link.type = 'text/css'; 
      
        link.href = url;  
  
        // Append link element to HTML head 
        head.appendChild(link);  
}

function loadScript(url, callback){

    var script = document.createElement("script")
    script.type = "text/javascript";

    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" ||
                    script.readyState == "complete"){
                script.onreadystatechange = null;
                callback && callback();
            }
        };
    } else {  //Others
        script.onload = function(){
            callback && callback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

function _extractCoreRepo() {
	try {
        if( $('.detail-view th:contains(Core Repo)').next().text().includes('gitconnect') ){
            return 'connect'
        }

		return $('.detail-view th:contains(Core Repo)').next().text().split('/')[1];
	} catch(e) {
		return undefined;
	}
}
(function(){
var _deploymentInfo = {};

var outputContainer = $('<ul>');



function getDeployments(){
	var siteId = $('.detail-view').find('th:contains("ID")').next().text();

	var deploymentSearchData = {
		'site_id': '='+siteId,
		'core_repo': _extractCoreRepo()
	};
	if(_extractCoreRepo() === 'magento-core'){
		deploymentSearchData['environment_id'] = '>10';
	}

	$.get('index.php',
		{
			'r': 'deployments/admin',
			'Deployments': deploymentSearchData
		},
		function(resp) {
			const info = getDeploymentInfo(resp);

			info.repo = "https://svn.bubblecms.com/svn" + $('.detail-view').find('th:contains("Repo"):first').next().text() + "/trunk";

			var textAreaContent = formatTextarea(info);
			$('<textarea>').appendTo('#content').css({'height': '73px', 'width': '100%'}).val(textAreaContent);

			outputContainer.appendTo('#content');

			_deploymentInfo = info;

			formatTransferLinks(info);
		}
	)
}

function formatTransferLinks(info) {
	var params = getParamsFromUrlHash();
	if(params['from-deployment'] && params['to-deployment']) {
		_loadTransferByDeploymentIds(params['from-deployment'], params['to-deployment']);
		return;
	}


	//loadTransferCommand(info.production, info.dev, 'DATABASE PROD to DEV');
	loadTransferByDeploymentType('production', 'dev');
	//loadTransferCommand(info.production, info.staging, 'DATABASE PROD to STAGING');
	loadTransferByDeploymentType('production', 'staging');
}

function loadTransferByDeploymentType(fromType, toType) {
	var from = _deploymentInfo[ fromType ];
	var to   = _deploymentInfo[ toType ];

	loadTransferCommand(from, to, 'DATABASE '+fromType.toUpperCase()+' to '+toType.toUpperCase());
}
window._loadTransferByDeploymentType = loadTransferByDeploymentType;

window._loadTransferByDeploymentIds = function(fromId, toId){
	loadTransferCommand({id: fromId},{id: toId}, `FROM ${fromId} TO ${toId}`);
}

function loadTransferCommand(from, to, label) {
	magento_db_util.generateTransferCommand(from.id, to.id, function(command) {
		var resultLines = {};
		resultLines[label] = command;
		outputContainer.append( renderLines(resultLines) );
	});
}


function renderLines(lines) {
	var output = [];
	for(var label in lines) {
		var line = lines[label];

		var box = $('<li>').append(
			$('<span>').text('### '+label+' ###'),
			$('<pre>').text(line)
		);

		if( label.indexOf('to DEV') !== -1 ) {
			box.css("background", "#ECFFDF");
		}
		if( label.indexOf('to STAG') !== -1 ) {
			box.css("background", "#FEFFDF");
		}
		output.push(box);
	}

	return output;
}

function getDeploymentInfo(html) {
	var output = {dev:{},staging:{},production:{}};

	var columns = getPushServiceTableColumns(html);
	var repoColumnIndex = columns['Repo'];
	var urlColumnIndex = columns['Hostname']

	$(html).find('#deployments-grid').find('tbody tr').each(function(){
		var deploymentData = {
			repo: $(this).find('td:eq('+repoColumnIndex+')').text(),
			url: $(this).find('td:eq('+urlColumnIndex+') a').attr('href')
		};

		try {
			deploymentData.id = /id=(\d+)/.exec( $(this).find('a.update').attr('href') )[1];
		} catch(e){ console.log("Exception in regex when parsing deployment ID", e); }

        function repoContains(searchStr){
            return deploymentData.repo.includes(searchStr)
        }

		if( repoContains('production') || repoContains('git:master') )
			output['production'] = deploymentData;

		if( repoContains('staging') )
			output['staging'] = deploymentData;

		if( repoContains('trunk') || repoContains('git:develop') )
			output['dev'] = deploymentData;
	});

	console.log(output);
	return output;
}

function formatTextarea(lines) {
	return [
	'Production URL = '+lines.production.url,
	'     Staging URL = '+lines.staging.url,
	'           Dev URL = '+lines.dev.url,
	'                 Repo = '+lines.repo
	].join('\n');
}

getDeployments();

}());



(function(){
	// List of tables we can back up to make a "cms" backup that's safe to push forward to prod.
	var tableList = 'dmenu_dmenu dmenu_dmenu_store cms_block cms_block_store cms_page cms_page_store widget widget_instance widget_instance_page widget_instance_page_layout core_layout_update core_layout_link bubbleup_billboard_billboard bubbleup_billboard_billboard_comment bubbleup_billboard_billboard_comment_store bubbleup_billboard_billboard_store';
	// These tables won't be transferred, since they don't contain any important debugging data.
	var magentoSkipTables = [
		//'log_visitor_info',
		'report_viewed_product_index',
		'xtento_orderexport_log',
		'core_session',
		//'core_session',
		'catalogsearch_query',
		'am_acart_history',
		'sales_bestsellers_aggregated_yearly',
		'sales_bestsellers_aggregated_monthly',
		'sales_bestsellers_aggregated_daily',
		'firegento_adminmonitoring_history',
		'aoe_profiler_run',
		'springbot_actions',
		'index_event',
	];


	function loadDeploymentData(deploymentId, callback) {
		$.get('index.php', {
			'r' : 'deployments/update',
			'id': deploymentId
		}, function(resp) {
			window.lastResp = resp;

			var dbInfo = getDbInfo( resp );

			callback(dbInfo);

			console.log(dbInfo);
		});
	}

	function getDbInfo(extractFrom) {
		// Extract and define replacekey vars...
		var deployment_replacements = [];

		eval(extractFrom.split('var deployment_replacements = new Array();')[1].split('function add_replacement( search, replace, file, db_name ){')[0]);

		var dbInfo = {};
		for(var i=0; i<deployment_replacements.length; i++) {
			var replacement = deployment_replacements[i];

			switch( replacement.search.toLowerCase() ) {
				case '{db_name}':
					dbInfo.name = replacement.replace;
				break;

				case '{db_password}':
					dbInfo.pass = replacement.replace;
				break;

				case '{db_master}':
					dbInfo.host = replacement.replace;
				break;

				case '{db_host}':
					dbInfo.host = replacement.replace;
				break;

				case '{db_user}':
					dbInfo.user = replacement.replace;
				break;

				case '{base_url}':
					dbInfo.baseUrl = replacement.replace;
				break;
			}
		}

		if(!dbInfo.baseUrl) {
			dbInfo.baseUrl = $(extractFrom).find('#Deployments_hostname').val();
		}

		return dbInfo;
	}


	function writeConnectString(db, command) {
		var cmd = [command]
		if( db.host ) {
			cmd.push('-h', db.host);
		}
		if( db.port ) {
			cmd.push('--port', db.port);
		}
		if( db.user ) {
			cmd.push('-u', db.user);
		}
		if( db.pass ) {
			cmd.push('--password="'+db.pass+'"');
		} else {
			cmd.push('-p');
		}
		return cmd.join(' ');
	}
	var databaseServers = {
		'ps-db-dev-staging.busites.com'  : {
			'tunnelPort'  : '3316',
			'infra'       : 1
		},
		'ps-db-production.bustores.com'  : {
			'tunnelPort'  : '3326',
			'infra'       : 1
		},
		'ps-db-production.busites.com'   : {
			'tunnelPort'  : '3336',
			'infra'       : 1
		},
		'ps-db-production-2.busites.com' : {
			'tunnelPort'  : '3366',
			'infra'       : 1
		},
		'DEV_STAGING_RDS'        : {
			'tunnelPort'  : '3416',
			'infra'       : 2
		},
		'staging.7.db.bubbleup.cloud'    : {
			'tunnelPort'  : '3416',
			'infra'       : 2
		},
		'prod.7.db.bubbleup.cloud'       : {
			'tunnelPort'  : '3426',
			'infra'       : 2
		},
        'prod.80.db.bubbleup.cloud'       : {
			'tunnelPort'  : '3446',
			'infra'       : 2
		},
		'prod.56.db.bubbleup.cloud'      : {
			'tunnelPort'  : '3436',
			'infra'       : 2
		},

	};
    var devDbAliases = ["staging.80.db.bubbleup.cloud", "dev.80.db.bubbleup.cloud", 'dev.7.db.bubbleup.cloud']
    devDbAliases.forEach(hostname => databaseServers[hostname] = databaseServers['DEV_STAGING_RDS'])

	function fixCrossInfraDatabases(from, to) {
		try {
			var fromDb = databaseServers[from.host];
			var toDb   = databaseServers[to.host];
			if(fromDb.infra == toDb.infra) {
				return;
			}

			console.log("Detected an infra1<>infra2 transfer; using tunnel ports.");
			from.host = to.host = '127.0.0.1';
			from.port = fromDb.tunnelPort;
			to.port   = toDb.tunnelPort;
			console.log("Updated database hosts and ports", from, to);

		} catch(e) {
			console.log("Exception when trying to detect infra1<>infra2 transfer.", e);
		}
	}

	function formatTableExcludeArgument(dbInfo, tables) {
		if(tables.length < 1) {
			return '';
		}

		var dbTables = tables.map(function(table){ return [dbInfo.name, table].join('.'); });

		var tableString = dbTables.join(',');

		return " --ignore-table={"+tableString+"}";
	}

	function shouldExcludeTables(destinationDeploymentBaseUrl) {
		// Never exclude tables when moving to prod!
		if(!_isUrlDevStaging(destinationDeploymentBaseUrl)) {
			return false;
		}

		// Let us specify this in a url param
		if(window.location.href.indexOf('no-exclusions') !== -1) {
			return false;
		}

		return true;
	}

	function writeTransferString(from, to) {
		var mysqlDumpFlags = ' --single-transaction --set-gtid-purged=OFF --opt --skip-extended-insert'
		var sourceCommand      = writeConnectString(from, 'mysqldump') + ' '+from.name+mysqlDumpFlags;
		var destinationCommand = writeConnectString(to, 'mysql') + ' '+to.name;

		if( _extractCoreRepo() === 'magento-core') {
			if(shouldExcludeTables(to.baseUrl)) {
				sourceCommand += formatTableExcludeArgument(from, magentoSkipTables);
			}

			var fixCommand = destinationCommand + getMagentoQueries(to.baseUrl, from);
		} else if( _extractCoreRepo() === 'busa') {
			var fixCommand = destinationCommand + getBusaQueries(to.baseUrl);
		}
		else if( _extractCoreRepo() === 'connect') {
			var fixCommand = destinationCommand + getConnectQueries(to.baseUrl, from);
		}
		else {
			var fixCommand = '';
		}

		var copyCommand = sourceCommand + ' | ' + destinationCommand;

		return [copyCommand, fixCommand].join("\n");
	}

	function getBusaQueries(baseUrl) {
		var queries = [' << ENDOFQUERIES'];

		queries.push( "UPDATE config SET c_val='http://"+baseUrl+"/' WHERE c_var='SITEURL';" );
		queries.push( "UPDATE config SET c_val='https://"+baseUrl+"/' WHERE c_var='SSLSITEURL';" );

		if( baseUrl.indexOf('.dev.') !== -1 || baseUrl.indexOf('.staging.') !== -1 ) {
			// ToDo: Add any configs that should be different dev/staging settings here...
		}

		queries.push('ENDOFQUERIES');

		return queries.join('\n');
	}




	// 2 level closure...
	function generateTransferCommand(fromId, toId, callback) {
		var transferFrom;
		var transferTo;

		function loadTransfer(fromId, toId, callback) {
			loadDeploymentData(fromId, function(resp){
				transferFrom = resp;

				tryCreateTransferString(callback);
			});

			loadDeploymentData(toId, function(resp){
				transferTo = resp;

				tryCreateTransferString(callback);
			});
		}

		function tryCreateTransferString(callback) {
			if( transferFrom && transferTo ) {
				// Overwrites the port and host for use through a tunnel.
				fixCrossInfraDatabases(transferFrom, transferTo);

				const transferString = writeTransferString(transferFrom, transferTo);
				console.log( transferString );
				if( callback )
					callback(transferString);
			}
		}

		loadTransfer(fromId, toId, callback);
	}

	window.magento_db_util = {
		'loadDeploymentData' : loadDeploymentData,
		'writeConnectString' : writeConnectString,
		'getMagentoQueries'  : getMagentoQueries,
		'getDbInfo'          : getDbInfo,
		'generateTransferCommand' : generateTransferCommand
	};



}());

function getParamsFromUrlHash() {
    var queryString = window.location.hash.slice(1);
    var inputsToSet = new URLSearchParams( queryString );
    var fieldsToSet = {};
    for (let definition of inputsToSet) {
        var field = definition[0];
        var value = definition[1];
        fieldsToSet[field] = value;
    }

    return fieldsToSet;
}

function getPushServiceTableColumns(html) {
	const fields = {};

	if(html) {
		var $root = $(html);
	} else {
		var $root = $('body');
	}

	$root.find('#deployments-grid thead th').each(function(i) { fields[this.textContent.trim()] = i; });

	return fields;

}

    /// ToDo: Delete once we are sure we no longer have to ever touch MAgento again
    function getMagentoQueries(baseUrl, sourceDeployment) {
	var queries = [' << "ENDOFQUERIES"'];

	queries.push( "UPDATE core_config_data SET value='https://"+baseUrl+"/' WHERE scope_id=0 AND scope='default' AND path='web/unsecure/base_url'; " );

	queries.push( "UPDATE core_config_data SET value='https://"+baseUrl+"/' WHERE scope_id=0 AND scope='default' AND path='web/secure/base_url'; " );

	queries.push( "UPDATE core_config_data SET value='"+baseUrl+"' WHERE scope_id=0 AND scope='default' AND path='web/cookie/cookie_domain'; " );

	queries.push( "UPDATE core_config_data SET value=1 WHERE path='web/secure/use_in_adminhtml'; " );

	if(sourceDeployment && sourceDeployment.baseUrl) {
		queries.push( "INSERT INTO core_config_data SET value='https://"+sourceDeployment.baseUrl+"/', scope_id=0, scope='default', path='bubbleup_mediasync/source/base_url' ON DUPLICATE KEY UPDATE value=VALUES(value); " );
	}

	if( _isUrlDevStaging(baseUrl) ) {
		queries = queries.concat(_getMagentoQueriesDevStage(baseUrl));
	} else {
		queries = queries.concat(_getMagentoQueriesProd(baseUrl));
	}
	queries.push('ENDOFQUERIES');
	queries.push('\n'); // So that queries run automatically when you paste them in.

	return queries.join('\n');
}

function getConnectQueries(baseUrl, sourceDeployment) {
	var queries = [' << "ENDOFQUERIES"'];

	queries.push( 'UPDATE `config` SET `value`="'+baseUrl+'" WHERE site_id=(SELECT id FROM site ORDER BY is_default DESC, created_at ASC LIMIT 1) AND path="SITE_DOMAIN";' );

	queries.push('ENDOFQUERIES');
	queries.push('\n'); // So that queries run automatically when you paste them in.

	return queries.join('\n');
}

function _isUrlDevStaging(baseUrl) {
	var devStageParts = [
		'.dev.bustores',
		'.staging.bustores',
		'.dev.bubbleup.com',
		'.staging.bubbleup.com',
	];

	for(var i=0; i<devStageParts.length; i++) {
		if( baseUrl.indexOf(devStageParts[i]) !== -1 ) {
			return true;
		}
	}
	return false;
}

function _getMagentoQueriesProd(baseUrl) {
	var queries = [
		"UPDATE core_config_data SET value='INDEX,FOLLOW' WHERE path='design/head/default_robots';",
		"UPDATE core_config_data SET value=0 WHERE path='design/head/demonotice';",
		"UPDATE core_config_data SET value=0 WHERE path='payment/authorizenet/test';",
		"UPDATE core_cache_option SET value=1;",
		"UPDATE core_config_data SET value='0' WHERE path='payment/incontext/sandbox';",
		"UPDATE core_config_data SET value='0' WHERE path='paypal/wpp/sandbox_flag';",
		"UPDATE core_config_data SET value='0' WHERE path LIKE 'carriers/%/debug';"
	];

	return queries;
}

function _getMagentoQueriesDevStage(baseUrl) {
	var queries = [
		"UPDATE core_config_data SET value='NOINDEX,NOFOLLOW' WHERE path='design/head/default_robots';" ,
		"UPDATE core_config_data SET value=1 WHERE path='design/head/demonotice';" ,
		"UPDATE core_config_data SET value=1 WHERE path IN('payment/authorizenet/test', 'payment/authorizenet_directpost/test');" ,
		"UPDATE core_config_data SET value=1 WHERE path LIKE 'carriers/%/debug';",

		"DELETE FROM core_config_data WHERE path LIKE 'sales_email/%/copy_to';",
		"DELETE FROM core_config_data WHERE path LIKE 'email_reports/%';",
		"DELETE FROM core_config_data WHERE path LIKE 'contacts/email/recipient_email';",

		"UPDATE core_cache_option SET value=0;" ,
		"UPDATE core_config_data SET value='1' WHERE path='payment/incontext/sandbox';",
		"UPDATE core_config_data SET value='coleman-facilitator@bubbleup.com' WHERE path='paypal/general/business_account';",
		"UPDATE core_config_data SET value='MXD/W48Vy3epWOeXrgzMgZHb/jdLGq3kvLGPPMY0TFPh1NVdrHE3pw==' WHERE path='paypal/wpp/api_username';",
		"UPDATE core_config_data SET value='SPXwWFgslvKY7rXdP9SFwA==' WHERE path='paypal/wpp/api_password';",
		"UPDATE core_config_data SET value='6uYDtleEHwUFTeFXqQFEDxOWL9b4ITMfBeiuoGHkGr22jhOgpa0SumyXVIbUrOlijL0mzTStn/A=' WHERE path='paypal/wpp/api_signature';",
		"UPDATE core_config_data SET value='1' WHERE path='paypal/wpp/sandbox_flag';",
		"INSERT INTO core_config_data SET value='1', scope_id=0, scope='default', path='dev/log/active' ON DUPLICATE KEY UPDATE value=VALUES(value); "
	];

	if( baseUrl.indexOf('a3merch') !== -1 || baseUrl.indexOf('grangersmith') !== -1 || baseUrl.indexOf('southerngroundstore') !== -1 || baseUrl.indexOf('lproof.') !== -1) {
		queries.push( "UPDATE core_config_data SET value=CONCAT_WS('.', trim(TRAILING '/' FROM value), '"+baseUrl+"/') WHERE path like '%base_url%' AND scope_id!=0;");
	}

	if( baseUrl.indexOf('ras.') === 0 ) {
		queries.push( "UPDATE core_config_data SET value=REPLACE(value, 'richardsandsouthern.com', '"+baseUrl+"') WHERE path like '%base_url%' AND scope_id!=0;");
		queries.push( "UPDATE core_cache_option SET value=1 WHERE code NOT IN ('block_html', 'fpc');");
	}
	if( baseUrl.indexOf('rasrnh.') === 0 ) {
		if(baseUrl.indexOf('.dev.') !== -1){
			var environment = '56.dev';
		} else if(baseUrl.indexOf('.staging.') !== -1){
			var environment = '56.staging';
		} else {
			alert("Unable to determine dev/staging environment for rasrnh deployment. Queries may not be correct.");
			var environment = '56.dev';
		}
		var websiteCodePiece = environment.replace('.', '_');
		queries.push( `UPDATE core_config_data SET value=REPLACE(value, 'ras.bustores.com', '${environment}.bubbleup.com') WHERE path like '%base_url%';` );
		queries.push( `UPDATE core_website SET code=REPLACE(code, '_ras_bustores_com', '_${websiteCodePiece}_bubbleup_com');` );
		queries.push( `UPDATE core_website SET code=REPLACE(code, '_prod_bustores_com', '_${websiteCodePiece}_bubbleup_com');` );
	}

	return queries;

}

function getMagento2Queries(baseUrl, sourceDeployment) {
	var queries = [' << "ENDOFQUERIES"'];

	queries.push( "UPDATE core_config_data SET value='https://"+baseUrl+"/' WHERE scope_id=0 AND scope='default' AND path='web/unsecure/base_url'; " );

	queries.push( "UPDATE core_config_data SET value='https://"+baseUrl+"/' WHERE scope_id=0 AND scope='default' AND path='web/secure/base_url'; " );

/*
	queries.push( "UPDATE core_config_data SET value='"+baseUrl+"' WHERE scope_id=0 AND scope='default' AND path='web/cookie/cookie_domain'; " );

	queries.push( "UPDATE core_config_data SET value=1 WHERE path='web/secure/use_in_adminhtml'; " );

	if(sourceDeployment && sourceDeployment.baseUrl) {
		queries.push( "INSERT INTO core_config_data SET value='https://"+sourceDeployment.baseUrl+"/', scope_id=0, scope='default', path='bubbleup_mediasync/source/base_url' ON DUPLICATE KEY UPDATE value=VALUES(value); " );
	}
	if( _isUrlDevStaging(baseUrl) ) {
		queries = queries.concat(_getMagentoQueriesDevStage(baseUrl));
	} else {
		queries = queries.concat(_getMagentoQueriesProd(baseUrl));
	}
*/
	queries.push('ENDOFQUERIES');
	queries.push('\n'); // So that queries run automatically when you paste them in.

	return queries.join('\n');
}
    /// ToDo: Delete above stuff... once Magento is really gone.

})();
