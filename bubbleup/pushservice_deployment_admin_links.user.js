// ==UserScript==
// @name         PS Deployment Admin Links
// @namespace    https://www.bubbleup.net
// @version      0.1
// @description  Adds links to admin panels for deployments that use known cores (BUSA/Connect/Magento/WP)
// @author       Eric Seastrand
// @match        https://push-service.busites.com/index.php?r=deployments/admin*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/bubbleup/pushservice_deployment_admin_links.user.js

const columnIndexes = {
	'hostname': 2,
	'core_repo': 3
};

$('#deployments-grid tbody tr').each(function(){
	var $this = $(this);
	var adminPath;

	try{
		var core = $this.find('td:nth-of-type('+columnIndexes.core_repo+')').text().split('/')[1];
		console.log('Core Repo:',core, this);
	}catch(e){
		return;
	}


	if( core == 'empty' ) return;

	if( core == 'bamp' || core == 'busa' ) {
		adminPath = '/busa';
	}
	else if( core == 'magento-core' ) {
		adminPath = '/admin';
	}	
	else if( core == 'wordpress' ) {
		adminPath = '/wp-admin';
	}
	else if( core == 'connect' ) {
		adminPath = '/connect';
	}

	var link = $this.find('td:nth-of-type('+columnIndexes.hostname+') a');

	$('<a>')
		.text(adminPath)
		.attr({
			href: link.attr('href') + adminPath,
			target: '_blank'
		})
		.css({
			float: 'right'
		})
		.insertAfter(link)
	;

});
