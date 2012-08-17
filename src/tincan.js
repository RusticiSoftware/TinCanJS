/*
    Copyright 2012 Rustici Software

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

// TODO: have TCDriver work without "location" object
function TCDriver_ConfigObject() {
    _TCDriver_Log("TCDriver_ConfigObject");
    var result,
        lrsProps = ["endpoint", "auth"],
        singleProps = ["activity_id", "grouping", "activity_platform", "registration"],
        singlePropMap = {
            activity_id: "activityId",
            grouping: "grouping",
            activity_platform: "activityPlatform",
            registration: "registration"
        },
        lrs = {},
        qsVars = __parseQueryString(),
        prop,
        _tempRS = []
    ;

    result = {
        _isIE: (typeof XDomainRequest !== "undefined"),
        recordStores: [],
        actor: null,
        actorJSON: null,
        activityId: null,
        activityName: null,
        activityDesc: null,
        activityPlatform: null,
        grouping: null,
        registration: null
    };

    if (qsVars.hasOwnProperty("actor")) {
        //_TCDriver_Log("TCDriver_ConfigObject - found actor: " + qsVars.actor);
        try {
            result.actor = JSON.parse(qsVars.actor);
            result.actorJSON = qsVars.actor;
            delete qsVars.actor;
        }
        catch (ex) {
            _TCDriver_Log("TCDriver_ConfigObject - failed to parse actor: " + ex);
        }
    }

    for (var i = 0; i < singleProps.length; i += 1) {
        prop = singleProps[i];
        if (qsVars.hasOwnProperty(prop)) {
            result[singlePropMap[prop]] = qsVars[prop];
            delete qsVars[prop];
        }
    }

    if (typeof TC_COURSE_ID !== 'undefined' && TC_COURSE_ID) {
        if (result.activityId === null) {
            result.activityId = TC_COURSE_ID;
        }
        else if (TC_COURSE_ID && result.activityId !== TC_COURSE_ID) {
            _TCDriver_Log("TCDriver_ConfigObject - URL and pre-configured activity IDs differ");
        }
    }
    if (result.activityName === null && typeof TC_COURSE_NAME !== 'undefined' && TC_COURSE_NAME) {
        result.activityName = TC_COURSE_NAME;
    }
    if (result.activityDesc === null && typeof TC_COURSE_DESC !== 'undefined' && TC_COURSE_DESC) {
        result.activityDesc = TC_COURSE_DESC;
    }

    //
    // order matters here, process the URL provided LRS last because it gets
    // all the remaining parameters so that they get passed through
    //
    if (qsVars.hasOwnProperty("endpoint")) {
        for (var i = 0; i < lrsProps.length; i += 1) {
            prop = lrsProps[i];
            if (qsVars.hasOwnProperty(prop)) {
                lrs[prop] = qsVars[prop];
                delete qsVars[prop];
            }
        }
        lrs.extended = qsVars;
        lrs.allowFail = false;

        TCDriver_AddRecordStore(result, lrs);
    }

    if (typeof TC_RECORD_STORES !== "undefined" && TC_RECORD_STORES.length > 0) {
        for (var i = 0; i < TC_RECORD_STORES.length; i += 1) {
            TCDriver_AddRecordStore(result, TC_RECORD_STORES[i]);
        }
    }

    //_TCDriver_Log("TCDriver_ConfigObject - result: " + JSON.stringify(result, null, 4));

    return result;
}

/* TODO:
 * check endpoint for trailing '/'
 * check for unique endpoints
*/
function TCDriver_AddRecordStore (driver, cfg) {
    _TCDriver_Log("TCDriver_AddRecordStore");
    var urlParts,
        schemeMatches,
        isXD
    ;

    if (! cfg.hasOwnProperty("endpoint")) {
        alert("[error] LRS invalid: no endpoint");
        throw {
            code: 3,
            mesg: "LRS invalid: no endpoint"
        };
    }
    if (! cfg.hasOwnProperty("allowFail")) {
        cfg.allowFail = true;
    }

    urlParts = cfg.endpoint.toLowerCase().match(/^(.+:)\/\/([^:\/]+):?(\d+)?(\/.*)?$/);

    //
    // determine whether this is a cross domain request,
    // if it is then if we are in IE check that the schemes
    // match to see if we should be able to talk to the LRS
    //
    schemeMatches = location.protocol.toLowerCase() === urlParts[1];
    isXD = (
        // is same scheme?
        ! schemeMatches

        // is same host?
        || location.hostname.toLowerCase() !== urlParts[2]

        // is same port?
        || location.port !== (
            urlParts[3] !== null ? urlParts[3] : (urlParts[1] === 'http:' ? '80' : '443')
        )
    );
    if (isXD && driver._isIE) {
        if (schemeMatches) {
            cfg._requestMode = "ie";

            driver.recordStores.push(cfg);
        }
        else {
            if (cfg.allowFail) {
                alert("[warning] LRS invalid: cross domain request for differing scheme in IE");
            }
            else {
                alert("[error] LRS invalid: cross domain request for differing scheme in IE");
                throw {
                    code: 2,
                    mesg: "LRS invalid: cross domain request for differing scheme in IE"
                };
            }
        }
    }
    else {
        cfg._requestMode = "native";

        driver.recordStores.push(cfg);
    }
}

// Synchronous if callback is not provided (not recommended)
function TCDriver_SendStatement (driver, stmt, callback) {
    _TCDriver_Log("TCDriver_SendStatement");
    var lrs,
        statementId = __ruuid(),
        jsonStatement,
        callbackWrapper,
        rsCount = driver.recordStores.length
    ;

    if (rsCount > 0) {
        _TCDriver_PrepareStatement(driver, stmt);
        jsonStatement = JSON.stringify(stmt);

        /* when there are multiple LRSes configured and
           if there is a callback that is a function then we need
           to wrap that function with a function that becomes
           the new callback that reduces a closure count of the
           requests that don't have allowFail set to true and
           when that number hits zero then the original callback
           is executed */
        if (rsCount === 1) {
            callbackWrapper = callback;
        }
        else {
            if (typeof callback === "function") {
                callbackWrapper = function () {
                    _TCDriver_Log("TCDriver_SendStatement - callbackWrapper: " + rsCount);
                    if (rsCount > 1) {
                        rsCount -= 1;
                    }
                    else if (rsCount === 1) {
                        callback.apply(this, arguments);
                    }
                    else {
                        _TCDriver_Log("TCDriver_SendStatement - unexpected record store count: " + rsCount);
                    }
                };
            }
        }

        for (var i = 0; i < rsCount; i += 1) {
            lrs = driver.recordStores[i];
            _TCDriver_XHR_request(lrs, "statements?statementId=" + statementId, "PUT", jsonStatement, callbackWrapper);
        }
    }
    else {
        alert("[warning] TCDriver_SendStatement: No LRSs added yet (statement not sent)");
    }
}

// Synchronous if callback is not provided (not recommended)
function TCDriver_SendMultiStatements (driver, stmts, callback) {
    _TCDriver_Log("TCDriver_SendMultiStatements");
    var lrs,
        statementsJson,
        callbackWrapper,
        rsCount = driver.recordStores.length
    ;

    if (rsCount > 0) {
        if (stmts != null && stmts.length > 0) {
            for(var i = 0; i < stmts.length; i++){
                _TCDriver_PrepareStatement(driver, stmts[i]);
            }
            statementsJson = JSON.stringify(stmts);

            /* when there are multiple LRSes configured and
               if there is a callback that is a function then we need
               to wrap that function with a function that becomes
               the new callback that reduces a closure count of the
               requests that don't have allowFail set to true and
               when that number hits zero then the original callback
               is executed */
            if (rsCount === 1) {
                callbackWrapper = callback;
            }
            else {
                if (typeof callback === "function") {
                    callbackWrapper = function () {
                        _TCDriver_Log("TCDriver_SendMultiStatements - callbackWrapper: " + rsCount);
                        if (rsCount > 1) {
                            rsCount -= 1;
                        }
                        else if (rsCount === 1) {
                            callback.apply(this, arguments);
                        }
                        else {
                            _TCDriver_Log("TCDriver_SendMultiStatements - unexpected record store count: " + rsCount);
                        }
                    };
                }
            }

            for (var i = 0; i < rsCount; i += 1) {
                lrs = driver.recordStores[i];
                _TCDriver_XHR_request(lrs, "statements", "POST", statementsJson, callbackWrapper);
            }
        }
    }
    else {
        alert("[warning] TCDriver_SendMultiStatements: No LRSs added yet (statements not sent)");
    }
}

// Synchronous if callback is not provided (not recommended)
function TCDriver_GetState (driver, activityId, stateKey, callback) {
    _TCDriver_Log("TCDriver_GetState: " + stateKey);
    var url,
        lrs,
        result
    ;

    if (driver.recordStores.length > 0) {
        //
        // for state (for now) we are only going to store to the first LRS
        // so only get from there too
        //
        // TODO: make this the first non-allowFail LRS but for now it should
        // be good enough to make it the first since we know the LMS provided
        // LRS is the first
        //
        lrs = driver.recordStores[0];

        url = "activities/state?"
            + "activityId=" + encodeURIComponent(activityId)
            + "&actor=" + encodeURIComponent(driver.actorJSON)
            + "&stateId=" + encodeURIComponent(stateKey)
        ;
        if (driver.registration !== null) {
            url += "&registration=" + encodeURIComponent(driver.registration);
        }

        result = _TCDriver_XHR_request(lrs, url, "GET", null, callback, true);

        //_TCDriver_Log("TCDriver_GetState - result: " + JSON.stringify(result, undefined, 4));
        return (typeof result === "undefined" || result.status === 404) ? null : result.responseText;
    }
    else {
        alert("[warning] TCDriver_GetState: No LRSs added yet (state not read)");
    }
}

// Synchronous if callback is not provided (not recommended)
function TCDriver_SetState (driver, activityId, stateKey, stateVal, callback) {
    _TCDriver_Log("TCDriver_SetState: " + stateKey);
    var url,
        lrs
    ;

    if (driver.recordStores.length > 0) {
        //
        // for state (for now) we are only going to store to the first LRS
        //
        // TODO: make this the first non-allowFail LRS but for now it should
        // be good enough to make it the first since we know the LMS provided
        // LRS is the first
        //
        lrs = driver.recordStores[0];

        url = "activities/state?"
            + "activityId=" + encodeURIComponent(activityId)
            + "&actor=" + encodeURIComponent(driver.actorJSON)
            + "&stateId=" + encodeURIComponent(stateKey)
        ;
        if (driver.registration !== null) {
            url += "&registration=" + encodeURIComponent(driver.registration);
        }

        _TCDriver_XHR_request(lrs, url, "PUT", stateVal, callback);
    }
    else {
        alert("[warning] TCDriver_SetState: No LRSs added yet (state not set)");
    }
}

// Synchronous if callback is not provided (not recommended)
function TCDriver_DeleteState (driver, activityId, stateKey, callback) {
    _TCDriver_Log("TCDriver_DeleteState: " + stateKey);
    var url,
        lrs,
        result
    ;

    if (driver.recordStores.length > 0) {
        //
        // for state (for now) we are only going to store to the first LRS
        // so only delete from there too
        //
        // TODO: make this the first non-allowFail LRS but for now it should
        // be good enough to make it the first since we know the LMS provided
        // LRS is the first
        //
        lrs = driver.recordStores[0];

        url = "activities/state?"
            + "activityId=" + encodeURIComponent(activityId)
            + "&actor=" + encodeURIComponent(driver.actorJSON)
            + "&stateId=" + encodeURIComponent(stateKey)
        ;
        if (driver.registration !== null) {
            url += "&registration=" + encodeURIComponent(driver.registration);
        }

        result = _TCDriver_XHR_request(lrs, url, "DELETE", null, callback, true);

        return (typeof result === "undefined" || result.status === 404) ? null : result.responseText;
    }
    else {
        alert("[warning] TCDriver_DeleteState: No LRSs added yet (state not cleared)");
    }
}

// Synchronous if callback is not provided (not recommended)
function TCDriver_SendActivityProfile (driver, activityId, profileKey, profileStr, lastSha1Hash, callback) {
    _TCDriver_Log("TCDriver_SendActivityProfile: " + profileKey);
    var url,
        lrs,
        headers = null,
        callbackWrapper,
        rsCount = driver.recordStores.length
    ;

    if (rsCount > 0) {
        url = "activities/profile?"
            + "activityId=" + encodeURIComponent(activityId)
            + "&profileId=" + encodeURIComponent(profileKey)
        ;

        if (lastSha1Hash !== null) {
            headers = {
                "If-Matches": '"' + lastSha1Hash + '"'
            };
        }

        /* when there are multiple LRSes configured and
           if there is a callback that is a function then we need
           to wrap that function with a function that becomes
           the new callback that reduces a closure count of the
           requests that don't have allowFail set to true and
           when that number hits zero then the original callback
           is executed */
        if (rsCount === 1) {
            callbackWrapper = callback;
        }
        else {
            if (typeof callback === "function") {
                callbackWrapper = function () {
                    _TCDriver_Log("TCDriver_SendStatement - callbackWrapper: " + rsCount);
                    if (rsCount > 1) {
                        rsCount -= 1;
                    }
                    else if (rsCount === 1) {
                        callback.apply(this, arguments);
                    }
                    else {
                        _TCDriver_Log("TCDriver_SendStatement - unexpected record store count: " + rsCount);
                    }
                };
            }
        }

        for (var i = 0; i < rsCount; i += 1) {
            lrs = driver.recordStores[i];
            _TCDriver_XHR_request(lrs, url, "PUT", profileStr, callbackWrapper, false, headers);
        }
    }
    else {
        alert("[warning] TCDriver_SendActivityProfile: No LRSs added yet (activity profile not sent)");
    }
}

// Synchronous if callback is not provided (not recommended)
function TCDriver_GetActivityProfile (driver, activityId, profileKey, callback) {
    _TCDriver_Log("TCDriver_GetActivityProfile: " + activityId);
    var url,
        lrs,
        result
    ;

    if (driver.recordStores.length > 0) {
        //
        // for get (for now) we only get from one (as they should be the same)
        //
        // TODO: make this the first non-allowFail LRS but for now it should
        // be good enough to make it the first since we know the LMS provided
        // LRS is the first
        //
        lrs = driver.recordStores[0];

        url = "activities/profile?"
            + "activityId=" + encodeURIComponent(activityId)
            + "&profileId=" + encodeURIComponent(profileKey)
        ;

        result = _TCDriver_XHR_request(lrs, url, "GET", null, callback, true);

        return (result === undefined || result.status === 404) ? null : result.responseText;
    }
    else {
        alert("[warning] TCDriver_GetActivityProfile: No LRSs added yet (activity profile not read)");
    }
}

// Synchronous if callback is not provided (not recommended)
function TCDriver_GetStatements (driver, sendActor, verb, activityId, callback) {
    _TCDriver_Log("TCDriver_GetStatements");
    var url,
        lrs,
        obj
    ;
    if (driver.recordStores.length > 0) {
        //
        // for get (for now) we only get from one (as they should be the same)
        // but it may make sense to long term try to merge statements, perhaps
        // by using statementId as unique
        //
        // TODO: make this the first non-allowFail LRS but for now it should
        // be good enough to make it the first since we know the LMS provided
        // LRS is the first
        //
        lrs = driver.recordStores[0];

        url = "statements/?sparse=false";

        if (sendActor) {
            url += "&actor=" + encodeURIComponent(driver.actorJSON);
        }
        if (verb !== null) {
            url += "&verb=" + verb;
        }
        if (activityId !== null) {
            obj = {
                id: activityId
            };
            url += "&object=" + encodeURIComponent(JSON.stringify(obj));
        }
        if (driver.registration) {
            url += "&registration=" + encodeURIComponent(driver.registration);
        }

        return _TCDriver_XHR_request(lrs, url, "GET", null, callback).responseText;
    }
    else {
        alert("[warning] TCDriver_GetStatements: No LRSs added yet (statements not read)");
    }
}

function TCDriver_ISODateString(d){
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
}

/*
 *  Begin private interface
*/
function _TCDriver_Log (str) {
    if (typeof console !== "undefined") {
        console.log(str);
    }
}

function _TCDriver_PrepareStatement (driver, stmt) {
    if (stmt.actor === undefined) {
        stmt.actor = driver.actor;
    }
    if (driver.grouping || driver.registration || driver.activityPlatform) {
        if (! stmt.context) {
            stmt.context = {};
        }
    }

    if (driver.grouping) {
        if (! stmt.context.contextActivities) {
            stmt.context.contextActivities = {};
        }
        stmt.context.contextActivities.grouping = { id : driver.grouping };
    }
    if (driver.registration) {
        stmt.context.registration = driver.registration;
    }
    if (driver.activity_platform) {
        stmt.context.platform = driver.activityPlatform;
    }
}

// Synchronous if callback is not provided (not recommended)
function _TCDriver_XHR_request (lrs, url, method, data, callback, ignore404, extraHeaders) {
    _TCDriver_Log("_TCDriver_XHR_request: " + url);
    var xhr,
        finished = false,
        ieXDomain = (lrs._requestMode === "ie"),
        ieModeRequest,
        location = window.location,
        result,
        extended,
        until,
        fullUrl = lrs.endpoint + url
    ;

    // add extended LMS-specified values to the URL
    if (lrs.extended !== undefined) {
        extended = [];
        for (var prop in lrs.extended) {
            if(lrs.extended[prop] != null && lrs.extended[prop].length > 0){
                extended.push(prop + "=" + encodeURIComponent(lrs.extended[prop]));
            }
        }
        if (extended.length > 0) {
            fullUrl += (fullUrl.indexOf("?") > -1 ? "&" : "?") + extended.join("&");
        }
    }

    //Consolidate headers
    var headers = {};
    headers["Content-Type"] = "application/json";
    headers["Authorization"] = lrs.auth;
    if (extraHeaders !== null) {
        for (var headerName in extraHeaders) {
            headers[headerName] = extraHeaders[headerName];
        }
    }

    if (lrs._requestMode === "native") {
        _TCDriver_Log("_TCDriver_XHR_request using XMLHttpRequest");
        xhr = new XMLHttpRequest();
        xhr.open(method, fullUrl, callback !== undefined);
        for (var headerName in headers) {
            xhr.setRequestHeader(headerName, headers[headerName]);
        }
    }
    else if (ieXDomain) {
        _TCDriver_Log("_TCDriver_XHR_request using XDomainRequest");
        ieModeRequest = _TCDriver_GetIEModeRequest(method, fullUrl, headers, data);
        xhr = new XDomainRequest ();
        xhr.open(ieModeRequest.method, ieModeRequest.url);
    }
    else {
        _TCDriver_Log("_TCDriver_XHR_request unrecognized _requestMode: " + lrs._requestMode);
    }

    //Setup request callback
    function requestComplete () {
        _TCDriver_Log("requestComplete: " + finished + ", xhr.status: " + xhr.status);
        var notFoundOk;

        if (! finished) {
            // may be in sync or async mode, using XMLHttpRequest or IE XDomainRequest, onreadystatechange or
            // onload or both might fire depending upon browser, just covering all bases with event hooks and
            // using 'finished' flag to avoid triggering events multiple times
            finished = true;

            notFoundOk = (ignore404 && xhr.status === 404);
            if (xhr.status === undefined || (xhr.status >= 200 && xhr.status < 400) || notFoundOk) {
                if (callback) {
                    callback(xhr);
                }
                else {
                    result = xhr;
                    return xhr;
                }
            }
            else {
                // Alert all errors except cancelled XHR requests
                if (xhr.status > 0) {
                    alert("[warning] There was a problem communicating with the Learning Record Store. (" + xhr.status + " | " + xhr.responseText+ ")");
                }
                return xhr;
            }
        }
        else {
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

    if (! callback) {
        // synchronous
        if (ieXDomain) {
            // synchronous call in IE, with no synchronous mode available
            until = 1000 + Date.now();
            _TCDriver_Log("_TCDriver_XHR_request: until: " + until + ", finished: " + finished);

            while (Date.now() < until && ! finished) {
                //_TCDriver_Log("calling __delay");
                __delay();
            }
        }
        return requestComplete();
    }
}

function _TCDriver_GetIEModeRequest (method, url, headers, data) {
    _TCDriver_Log("_TCDriver_GetIEModeRequest");
    var newUrl = url,
        //Everything that was on query string goes into form vars
        formData = [],
        qsIndex = newUrl.indexOf('?'),
        result
    ;
    if (qsIndex > 0) {
        formData.push(newUrl.substr(qsIndex + 1));
        newUrl = newUrl.substr(0, qsIndex);
    }

    //Method has to go on querystring, and nothing else
    newUrl = newUrl + '?method=' + method;

    //Headers
    if (headers !== null) {
        for (var headerName in headers) {
            formData.push(headerName + "=" + encodeURIComponent(headers[headerName]));
        }
    }

    //The original data is repackaged as "content" form var
    if (data !== null) {
        formData.push('content=' + encodeURIComponent(data));
    }

    result = {
        method: "POST",
        url: newUrl,
        headers: {},
        data: formData.join("&")
    };
    //_TCDriver_Log("_TCDriver_GetIEModeRequest - result: " + JSON.stringify(result, null, 4));

    return result;
}

/*
 *  Begin helper functions
*/
function __delay () {
    //
    // use a synchronous request to the current location to allow the browser
    // to yield to the asynchronous request's events but still block in the
    // outer loop to make it seem synchronous to the end user
    //
    // removing this made the while loop too tight to allow the asynchronous
    // events through to get handled so that the response was correctly handled
    //
    //_TCDriver_Log("__delay");
    var xhr = new XMLHttpRequest (),
        url = window.location + '?forcenocache=' + __ruuid()
    ;
    xhr.open('GET', url, false);
    xhr.send(null);
}

/*
 * see https://developer.mozilla.org/en/DOM/window.location#Examples
*/
function __parseQueryString() {
    var oGetVars = {};

    function buildValue (sValue) {
        if (/^\s*$/.test(sValue)) { return null; }
        if (/^(true|false)$/i.test(sValue)) { return sValue.toLowerCase() === "true"; }
        if (isFinite(sValue)) { return parseFloat(sValue); }
        //if (isFinite(Date.parse(sValue))) { return new Date(sValue); }
        return sValue;
    }

    if (window.location.search.length > 1) {
        for (var aItKey, nKeyId = 0, aCouples = window.location.search.substr(1).split("&"); nKeyId < aCouples.length; nKeyId++) {
            aItKey = aCouples[nKeyId].split("=");
            oGetVars[unescape(aItKey[0])] = aItKey.length > 1 ? buildValue(unescape(aItKey[1])) : null;
        }
    }

    _TCDriver_Log("__parseQueryString: " + JSON.stringify(oGetVars, null, 4));
    return oGetVars;
}

/*!
Excerpt from: Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com
Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/
function __ruuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        }
    );
}

/*
 * Make JSON safe for IE6
 * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/JSON#Browser_compatibility
*/
if (!window.JSON) {
    window.JSON = {
        parse: function (sJSON) { return eval("(" + sJSON + ")"); },
        stringify: function (vContent) {
            if (vContent instanceof Object) {
                var sOutput = "";
                if (vContent.constructor === Array) {
                    for (var nId = 0; nId < vContent.length; sOutput += this.stringify(vContent[nId]) + ",", nId++) {};
                    return "[" + sOutput.substr(0, sOutput.length - 1) + "]";
                }
                if (vContent.toString !== Object.prototype.toString) { return "\"" + vContent.toString().replace(/"/g, "\\$&") + "\""; }
                for (var sProp in vContent) { sOutput += "\"" + sProp.replace(/"/g, "\\$&") + "\":" + this.stringify(vContent[sProp]) + ","; }
                return "{" + sOutput.substr(0, sOutput.length - 1) + "}";
            }
            return typeof vContent === "string" ? "\"" + vContent.replace(/"/g, "\\$&") + "\"" : String(vContent);
        }
    };
}
