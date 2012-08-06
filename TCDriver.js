/*

   Copyright 2012 Rustici Software, LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

*/

var tc_lrs = TCDriver_GetLRSObject();
//alert(tc_lrs.actor);
//alert(JSON.stringify(tc_lrs));

function delay() {
    var xhr = new XMLHttpRequest();
    var url = window.location + '?forcenocache='+_ruuid();
    xhr.open('GET', url, false);
    xhr.send(null);
}

// Synchronous if callback is not provided (not recommended)
function XHR_request(lrs, url, method, data, auth, callback, ignore404, extraHeaders) {
    "use strict";
    var xhr,
        finished = false,
        xDomainRequest = false,
        ieXDomain = false,
        ieModeRequest,
        title,
        ticks = ['/','-','\\','|'],
        urlparts = url.toLowerCase().match(/^(.+:)\/\/([^:\/]+):?(\d+)?(\/.+)?$/),
        location = window.location,
        urlPort,
        result,
        extended,
        prop,
        until;

	// add extended LMS-specified values to the URL
	if (lrs !== null && lrs.extended !== undefined) {
		extended = new Array();
		for (prop in lrs.extended) {
			extended.push(prop + "=" + encodeURIComponent(lrs.extended[prop]));
		}
		if (extended.length > 0) {
			url += (url.indexOf("?") > -1 ? "&" : "?") + extended.join("&");
		}
	}
     
    //Consolidate headers
    var headers = {};
    headers["Content-Type"] = "application/json";
    headers["Authorization"] = auth;
    if(extraHeaders !== null){
        for(var headerName in extraHeaders){
            headers[headerName] = extraHeaders[headerName];
        }
    }
    
    //See if this really is a cross domain
    xDomainRequest = (location.protocol.toLowerCase() !== urlparts[1] || location.hostname.toLowerCase() !== urlparts[2]);
    if (!xDomainRequest) {
        urlPort = (urlparts[3] === null ? ( urlparts[1] === 'http:' ? '80' : '443') : urlparts[3]);
        xDomainRequest = (urlPort === location.port);
    }
    
    //If it's not cross domain or we're not using IE, use the usual XmlHttpRequest
    if (!xDomainRequest || typeof(XDomainRequest) === 'undefined') {
        xhr = new XMLHttpRequest();
        xhr.open(method, url, callback != null);
        for(var headerName in headers){
            xhr.setRequestHeader(headerName, headers[headerName]);
        }
    } 
    //Otherwise, use IE's XDomainRequest object
    else {
        ieXDomain = true;
        ieModeRequest = TCDriver_GetIEModeRequest(method, url, headers, data);
        xhr = new XDomainRequest();
    	if(typeof console !== 'undefined') {
	        console.log(ieModeRequest.method + ", " + ieModeRequest.url);
	    }
        xhr.open(ieModeRequest.method, ieModeRequest.url);
    }
    
    //Setup request callback
    function requestComplete() {
        if(!finished){
            // may be in sync or async mode, using XMLHttpRequest or IE XDomainRequest, onreadystatechange or
            // onload or both might fire depending upon browser, just covering all bases with event hooks and
            // using 'finished' flag to avoid triggering events multiple times
            finished = true;
            var notFoundOk = (ignore404 && xhr.status === 404);
            if (xhr.status === undefined || (xhr.status >= 200 && xhr.status < 400) || notFoundOk) {
                if (callback) {
                    callback(xhr);
                } else {
                    result = xhr;
                    return xhr;
                }
            } else {
                try {
                    //Alert all errors except cancelled XHR requests
                    if(xhr.status > 0){
                	    alert("There was a problem communicating with the Learning Record Store. (" + xhr.status + " | " + xhr.responseText+ ")");
                    }
                } catch (ex) {alert (ex.toString());}
                //throw new Error("debugger");
                return xhr;
            }
        } else {
            return result;
        }
    };

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            requestComplete();
        }
    };

    xhr.onload = requestComplete;
    xhr.onerror = requestComplete;

    xhr.send(ieXDomain ? ieModeRequest.data : data);
    
    if (!callback) {
        // synchronous
        if (ieXDomain) {
            // synchronous call in IE, with no asynchronous mode available.
            until = 1000 + new Date();
            while (new Date() < until && xhr.readyState !== 4 && !finished) {
                delay();
            }
        }
        return requestComplete();
    }
}


function TCDriver_Log(str){
    if(typeof console !== 'undefined'){
        console.log(str);
    }
}

function TCDriver_GetIEModeRequest(method, url, headers, data){
	var newUrl = url;
	
	//Everything that was on query string goes into form vars
    var formData = new Array();
    var qsIndex = newUrl.indexOf('?');
    if(qsIndex > 0){
        formData.push(newUrl.substr(qsIndex+1));
        newUrl = newUrl.substr(0, qsIndex);
    }

    //Method has to go on querystring, and nothing else
    newUrl = newUrl + '?method=' + method;
    
    //Headers
    if(headers !== null){
        for(var headerName in headers){
            formData.push(headerName + "=" + encodeURIComponent(headers[headerName]));
        }
    }

    //The original data is repackaged as "content" form var
    if(data !== null){
        formData.push('content=' + encodeURIComponent(data));
    }
    
    return {
    	"method":"POST",
    	"url":newUrl,
    	"headers":{},
    	"data":formData.join("&")
    };
};


function TCDriver_GetLRSObject(){
    var lrsProps = ["endpoint","auth","actor","registration","activity_id", "grouping", "activity_platform"];
    var lrs = new Object();
    var qsVars, prop;
    
    qsVars = parseQueryString();
    
    for (var i = 0; i<lrsProps.length; i++){
    	prop = lrsProps[i];
        if (qsVars[prop]){
            lrs[prop] = qsVars[prop];
            delete qsVars[prop];
        }
    }
    if(lrs.endpoint === undefined || lrs.endpoint == "" || lrs.auth === undefined || lrs.auth == ""){
        TCDriver_Log("Configuring TCDriver LRS Object from queryString failed");
        return null;
    }
    
    lrs.extended = qsVars;
    
    return lrs;
}

function _TCDriver_PrepareStatement(lrs, stmt) {
	if(stmt.actor === undefined){
		stmt.actor = JSON.parse(lrs.actor);
	}
	if (lrs.grouping | lrs.registration | lrs.activity_platform) {
		if (!stmt.context) {
			stmt.context = {};
		}
	}
	
	if (lrs.grouping) {
		if (!stmt.context.contextActivities) {
			stmt.context.contextActivities = {};
		}
		stmt.context.contextActivities.grouping = { id : lrs.grouping };
	}
	if (lrs.registration) {
		stmt.context.registration = lrs.registration;
	}
	if (lrs.activity_platform) {
		stmt.context.platform = lrs.activity_platform;
	}
}


// Synchronous if callback is not provided (not recommended)
function TCDriver_SendStatement (lrs, stmt, callback) {
    if (lrs.endpoint != undefined && lrs.endpoint != "" && lrs.auth != undefined && lrs.auth != ""){
		_TCDriver_PrepareStatement(lrs, stmt);
        XHR_request(lrs, lrs.endpoint+"statements/?statementId="+_ruuid(), "PUT", JSON.stringify(stmt), lrs.auth, callback);
    }
}

// Synchronous if callback is not provided (not recommended)
function TCDriver_SendMultiStatements (lrs, stmtArray, callback) {
    if (lrs.endpoint != undefined && lrs.endpoint != "" && lrs.auth != undefined && lrs.auth != ""){
        for(var i = 0; i < stmtArray.length; i++){
            var stmt = stmtArray[i];
			_TCDriver_PrepareStatement(lrs, stmt);
        }
        XHR_request(lrs,lrs.endpoint+"statements/", "POST", JSON.stringify(stmtArray), lrs.auth, callback);
    }
}


// Synchronous if callback is not provided (not recommended)
function TCDriver_SetState (lrs, activityId, stateKey, stateVal, callback) {
    if (lrs.endpoint != undefined && lrs.endpoint != "" && lrs.auth != undefined && lrs.auth != ""){
        var url = lrs.endpoint + "activities/state?activityId=<activity ID>&actor=<actor>&stateId=<statekey>";
        
        url = url.replace('<activity ID>',encodeURIComponent(activityId));
        url = url.replace('<actor>',encodeURIComponent(lrs.actor));
        url = url.replace('<statekey>',encodeURIComponent(stateKey));
        if (lrs.registration) {
        	url += "&registration=" + encodeURIComponent(lrs.registration);
        }
        
        XHR_request(lrs,url, "PUT", stateVal, lrs.auth, callback);
    }
}

// Synchronous if callback is not provided (not recommended)
function TCDriver_GetState (lrs, activityId, stateKey, callback) {
    if (lrs.endpoint != undefined && lrs.endpoint != "" && lrs.auth != undefined && lrs.auth != ""){
        var url = lrs.endpoint + "activities/state?activityId=<activity ID>&actor=<actor>&stateId=<statekey>";
        
        url = url.replace('<activity ID>',encodeURIComponent(activityId));
        url = url.replace('<actor>',encodeURIComponent(lrs.actor));
        url = url.replace('<statekey>',encodeURIComponent(stateKey));
        if (lrs.registration) {
        	url += "&registration=" + encodeURIComponent(lrs.registration);
        }
        
        var result = XHR_request(lrs,url, "GET", null, lrs.auth, callback, true);
        return (result === undefined || result.status == 404) ? null : result.responseText;
    }
}

// Synchronous if callback is not provided (not recommended)
function TCDriver_SendActivityProfile (lrs, activityId, profileKey, profileStr, lastSha1Hash, callback) {
    
    if (lrs.endpoint != undefined && lrs.endpoint != "" && lrs.auth != undefined && lrs.auth != ""){
        var url = lrs.endpoint + "activities/profile?activityId=<activity ID>&profileId=<profilekey>";
        
        url = url.replace('<activity ID>',encodeURIComponent(activityId));
        url = url.replace('<profilekey>',encodeURIComponent(profileKey));
        
        var headers = null;
        if(lastSha1Hash !== null){
            headers = {"If-Matches":'"'+lastSha1Hash+'"'};
        }
        XHR_request(lrs,url, "PUT", profileStr, lrs.auth, callback, false, headers);
    }
}

// Synchronous if callback is not provided (not recommended)
function TCDriver_GetActivityProfile (lrs, activityId, profileKey, callback) {
    
    if (lrs.endpoint != undefined && lrs.endpoint != "" && lrs.auth != undefined && lrs.auth != ""){
        var url = lrs.endpoint + "activities/profile?activityId=<activity ID>&profileId=<profilekey>";
        
        url = url.replace('<activity ID>',encodeURIComponent(activityId));
        url = url.replace('<profilekey>',encodeURIComponent(profileKey));
        
        var result = XHR_request(lrs,url, "GET", null, lrs.auth, callback, true);
        return (result === undefined || result.status == 404) ? null : result.responseText;
    }
}

// Synchronous if callback is not provided (not recommended)
function TCDriver_GetStatements (lrs,sendActor,verb,activityId, callback) {
    if (lrs.endpoint != undefined && lrs.endpoint != "" && lrs.auth != undefined && lrs.auth != ""){
        
        var url = lrs.endpoint + "statements/?sparse=false";
        if (sendActor){
            url += "&actor=" + encodeURIComponent(lrs.actor);
        }
        
        if (verb != null){
            url += "&verb=" + verb;
        }
        if (activityId != null){
            var obj = {id:activityId};
            url += "&object=" + encodeURIComponent(JSON.stringify(obj));
        }
        if (lrs.registration) {
        	url += "&registration=" + encodeURIComponent(lrs.registration);
        }
    
        return XHR_request(lrs,url, "GET", null, lrs.auth, callback).responseText;
    }
}





/***************************
 Tin Can Statement  
****************************/
function TCStatement(lrsObj){
    this.lrs = lrsObj;
    this.actor = eval("(" + lrsObj.actor + ")");
    this.verb = null;
    this.object = null;
    return this;
}
TCStatement.prototype.SetValue = function(name,value){
    this[name] = value;
    return this;
};
TCStatement.prototype.GetStatement = function(){
    var stmt = new Object();
    for (var name in this)
    {
        if (name != "lrs"){
            stmt[name] = this[name];
        } 
        
    }
    return stmt;
};
TCStatement.prototype.Send = function() {
    TCDriver_SendStatement(this.lrs,this.GetStatement());
}



/***************************
 Tin Can Generic Object (for chaining, basically)
****************************/
function TCObject(){
    return this;
}
TCObject.prototype.SetValue = function(name,value){
    this[name] = value;
    return this;
};



/* Other Util functions  */
function parseQueryString() {
	var loc, qs, pairs, pair, ii, parsed = {};
	
	loc = window.location.href.split('?');
	if (loc.length === 2) {
		qs = loc[1];
		pairs = qs.split('&');
		for ( ii = 0; ii < pairs.length; ii++) {
			pair = pairs[ii].split('=');
			if (pair.length === 2 && pair[0]) {
				parsed[pair[0]] = decodeURIComponent(pair[1]);
			}
		}
	}
	
	return parsed;
}
/*!
Excerpt from: Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com
Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/
function _ruuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
        });
 }

TCDriver_ISODateString = function(d){
 function pad(val, n){
    if(val == null){
        val = 0;
    }
    if(n == null){
        n = 2;
    }
    var padder = Math.pow(10, n-1);
    var tempVal = val.toString();
    while(val < padder && padder > 1){        
        tempVal = '0' + tempVal;
        padder = padder / 10;
    }
    return tempVal;
 }

 return d.getUTCFullYear()+'-'
      + pad(d.getUTCMonth()+1)+'-'
      + pad(d.getUTCDate())+'T'
      + pad(d.getUTCHours())+':'
      + pad(d.getUTCMinutes())+':'
      + pad(d.getUTCSeconds())+'.'
      + pad(d.getUTCMilliseconds(), 3)+'Z';
};


TCDriver_DateFromISOString = function(string) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));

    var dateToReturn = new Date();
    dateToReturn.setTime(Number(time));
    return dateToReturn;
};
