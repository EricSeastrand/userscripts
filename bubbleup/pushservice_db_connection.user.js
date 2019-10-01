// ==UserScript==
// @name         PS DB connection helper
// @namespace    https://www.bubbleup.net
// @version      0.2
// @description  Builds DB connection/backup commands for you
// @author       Eric Seastrand
// @match        https://push-service.busites.com/index.php?r=deployments/update&id=*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/bubbleup/pushservice_db_connection.user.js
// ==/UserScript==

(function() {
    'use strict';
    
    
    
loadScript('https://pweb-utils.7.dev.bubbleup.com/pushservice/db_magento_queries.js');
loadScript('https://pweb-utils.7.dev.bubbleup.com/pushservice/db_connection.js');
loadStylesheet('https://pweb-utils.7.dev.bubbleup.com/pushservice/update_deployment.css');

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
                callback();
            }
        };
    } else {  //Others
        script.onload = function(){
            callback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

})();
