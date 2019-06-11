// ==UserScript==
// @name         Shopify Metafield Editor
// @namespace    none
// @version      0.1
// @description  Adds a Form which allows for Metafields for a Product to be Edited on its Product Page
// @author       Austin Sisson
// @include      *.myshopify.com/admin/products/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/willcodeforfood/userscripts/master/shopify/metafield_editor.user.js
// ==/UserScript==

(function() {
    runCodeWhenElementPresent('section.ui-card--type-aside',create);
    //instance variables / constants
    function getMetafieldExtension(){return "/metafields.json";}
    function getCardHolder(){return ("section.ui-card--type-aside");}
    function getNeededMetafields(){return ["report","release-date"];}
    function getKeyPointer(){return "key";}
    function getValuePointer(){return "value"};
    function getMetafieldPointer(){return "metafields";}
    function getIdPointer(){return "id;"}
    function getValueTypePointer(){return "value_type";}
    function getInputHolder(){return "input#product_metafields_soundscan\\.";}
    function defaultValueType(){ return "string";}
    function defaultNamespace(){return "soundscan";}
    function getNamespacePointer(){return "namespace";}


    //main functions
    async function getMetafieldArray(){
        var rawText = await httpReturn(window.location.href + getMetafieldExtension(),'GET',null);
        return rawText;
    }

    function addSubmitButton(){
        var button = document.createElement("button");
        button.innerHTML = "Submit";
        button.addEventListener("click", function(event){
            event.stopPropagation();
            updateMetafield();
        });
        return button;
    }

    function addDivElement(arr){
        var mainNode = document.querySelector(getCardHolder());
        var appendedNode = createDivElement(arr);
        mainNode.appendChild(appendedNode);
        mainNode.appendChild(addSubmitButton());
    }

    async function create(){
        var arr = await getMetafieldArray();
        var updatedArr = transformArray(arr);
        addDivElement(updatedArr);
    }

    async function httpReturn(url,httpMethod,metafields){
        var httpBody = metafields ? JSON.stringify(metafields) : undefined;
        //debugger;
        var getDevices = async () => {
            const location = window.location.hostname;
            const settings = {
                method: httpMethod,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: httpBody,
            };
            const data = await fetch(url, settings)
            const decodedData = await data.json();
            console.log(decodedData)
            return decodedData;
        }
        try{
            return await getDevices();
        }catch(e){
            console.log(e);
            return null;
        }
    }

    function createDivElement(arr){
        var divElement = document.createElement('div');
        for (var i = 0; i < getNeededMetafields().length; i++) {
            if(arr[getNeededMetafields()[i]]){
                createMetafieldForm(getNeededMetafields()[i],arr[getNeededMetafields()[i]],divElement);
            }
            else {
                createMetafieldForm(getNeededMetafields()[i],"__",divElement);
            }
        };
        return divElement;
    }

    function createMetafieldForm(key,value,divElement){
        var keyDiv = document.createElement('div.float-left');
        var holderDiv = document.createElement('div');
        var input = document.createElement('input');
        var blankDiv = document.createElement('div');
        input.setAttribute("type","text");
        input.setAttribute("id","product_metafields_soundscan."+key);
        keyDiv.textContent = " " + key + ": ";
        input.setAttribute(getValuePointer(),value);
        divElement.appendChild(keyDiv);
        divElement.appendChild(input);
        divElement.appendChild(blankDiv);
    }

    function transformArray(arr){
        var metafieldKeyObject = {};
        arr = arr[getMetafieldPointer()];
        Object.keys(arr).forEach(function(outerKey){
            metafieldKeyObject[arr[outerKey][getKeyPointer()]]=arr[outerKey][getValuePointer()];
        });
        return metafieldKeyObject;
    }

    function updateOldMetafield(id,value,valueType){
        var updateObject = {'metafield':{}};
        updateObject['metafield'][getIdPointer()] = id;
        updateObject['metafield'][getValuePointer()] = value;
        updateObject['metafield'][getValueTypePointer()] = valueType;
        let csrfToken = jQuery('meta[name="csrf-token"]').attr('content');
        let csrfParam = jQuery('meta[name="csrf-param"]').attr('content')
        updateObject[csrfParam] = csrfToken;
        return updateObject;
    }

    async function updateMetafield(){
        var arr = await getMetafieldArray();
        var transformedArray = createValueArray(arr);
        Object.keys(transformedArray).forEach(function(outerKey){
            Object.keys(arr).forEach(function(innerKey){
                if(arr[innerKey][getKeyPointer()]){
                    modifyMetafield(arr,transformedArray,innerKey,outerKey);
                } else {
                    addMetafield(transformedArray,innerKey,outerKey);
                }
            });
        });
    }

    async function addMetafield(transformedArray,innerKey,outerKey){
        var key = outerKey;
        var value = transformedArray[outerKey];
        var updateObject = createNewMetafield(key,value);
        await (httpReturn(window.location.href+getMetafieldExtension(),'POST',updateObject))
    }

    function createNewMetafield(key,value){
        let updateObject = {'metafield':{}};
        updateObject['metafield'][getKeyPointer()] = key;
        updateObject['metafield'][getValuePointer()] = value;
        updateObject['metafield'][getValueTypePointer()] = defaultValueType();
        updateObject['metafield'][getNamespacePointer()] = defaultNamespace();
        let csrfToken = jQuery('meta[name="csrf-token"]').attr('content');
        let csrfParam = jQuery('meta[name="csrf-param"]').attr('content')
        updateObject[csrfParam] = csrfToken;
        return updateObject;
    }

    async function modifyMetafield(arr,transformedArray,innerKey,outerKey){
        if(outerKey==arr[innerKey][getKeyPointer()]){
            var id = arr[innerKey][getIdPointer()];
            var valueType = arr[innerKey][getValueTypePointer()];
            var value = transformedArray[outerKey];
            var updateObject = updateOldMetafield(id,value,valueType);
            await httpReturn(window.location.href + "/" + getMetafieldPointer()+"/"+id+".json",'PUT',updateObject);
        }
    }

    function createValueArray(arr){
        var metafieldKeyObject = {};
        getNeededMetafields().forEach(function(key){
            metafieldKeyObject[key]=document.querySelector(getInputHolder()+key).value;
        });
        return metafieldKeyObject;
    }
    async function runCodeWhenElementPresent(elementSelector, codeToRun) {
        while(1) {
            const element = document.querySelector(elementSelector);
            if(element) {
                console.log("Found element at", new Date());
                codeToRun();
                break;
            }

            //console.log("Wait for next frame started at", new Date());
            await nextFrame();
        }
    }

    async function nextFrame() {
        return new Promise(resolve => {
            requestAnimationFrame(resolve)
        })
    }

})();
