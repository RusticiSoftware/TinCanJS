/*
    Copyright 2012-2013 Rustici Software

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

/**
TinCan client library

@module TinCan
@submodule TinCan.Environment.Browser
**/
(function () {
    /* globals window, XMLHttpRequest, XDomainRequest */
    "use strict";
    var LOG_SRC = "Environment.Browser",
        nativeRequest,
        xdrRequest,
        requestComplete,
        __delay,
        __IEModeConversion,
        env = {},
        log = TinCan.prototype.log;

    if (typeof window === "undefined") {
        log("'window' not defined", LOG_SRC);
        return;
    }

    /* Shims for browsers not supporting our needs, mainly IE */

    //
    // Make JSON safe for IE6
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/JSON#Browser_compatibility
    //
    if (!window.JSON) {
        window.JSON = {
            parse: function (sJSON) {
                /*jslint evil: true */
                return eval("(" + sJSON + ")");
            },
            stringify: function (vContent) {
                var sOutput = "",
                    nId,
                    sProp
                ;
                if (vContent instanceof Object) {
                    if (vContent.constructor === Array) {
                        for (nId = 0; nId < vContent.length; nId += 1) {
                            sOutput += this.stringify(vContent[nId]) + ",";
                        }
                        return "[" + sOutput.substr(0, sOutput.length - 1) + "]";
                    }
                    if (vContent.toString !== Object.prototype.toString) { return "\"" + vContent.toString().replace(/"/g, "\\$&") + "\""; }
                    for (sProp in vContent) {
                        if (vContent.hasOwnProperty(sProp)) {
                            sOutput += "\"" + sProp.replace(/"/g, "\\$&") + "\":" + this.stringify(vContent[sProp]) + ",";
                        }
                    }
                    return "{" + sOutput.substr(0, sOutput.length - 1) + "}";
                }
                return typeof vContent === "string" ? "\"" + vContent.replace(/"/g, "\\$&") + "\"" : String(vContent);
            }
        };
    }

    //
    // Make Date.now safe for IE < 9
    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/now
    //
    if (!Date.now) {
        Date.now = function () {
            return +(new Date ());
        };
    }

    /* Detect CORS and XDR support */
    env.hasCORS = false;
    env.useXDR = false;

    if (typeof XMLHttpRequest !== "undefined" && typeof (new XMLHttpRequest()).withCredentials !== "undefined") {
        env.hasCORS = true;
    }
    else if (typeof XDomainRequest !== "undefined") {
        env.hasCORS = true;
        env.useXDR = true;
    }

    // TODO: should we have our own internal "Request" object
    //       that replaces the need for "control"?

    //
    // Setup request callback
    //
    requestComplete = function (xhr, cfg, control) {
        log("requestComplete: " + control.finished + ", xhr.status: " + xhr.status, LOG_SRC);
        var requestCompleteResult,
            notFoundOk,
            httpStatus;

        //
        // XDomainRequest doesn't give us a way to get the status,
        // so allow passing in a forged one
        //
        if (typeof xhr.status === "undefined") {
            httpStatus = control.fakeStatus;
        }
        else {
            //
            // older versions of IE don't properly handle 204 status codes
            // so correct when receiving a 1223 to be 204 locally
            // http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
            //
            httpStatus = (xhr.status === 1223) ? 204 : xhr.status;
        }

        if (! control.finished) {
            // may be in sync or async mode, using XMLHttpRequest or IE XDomainRequest, onreadystatechange or
            // onload or both might fire depending upon browser, just covering all bases with event hooks and
            // using 'finished' flag to avoid triggering events multiple times
            control.finished = true;

            notFoundOk = (cfg.ignore404 && httpStatus === 404);
            if ((httpStatus >= 200 && httpStatus < 400) || notFoundOk) {
                if (cfg.callback) {
                    cfg.callback(null, xhr);
                }
                else {
                    requestCompleteResult = {
                        err: null,
                        xhr: xhr
                    };
                    return requestCompleteResult;
                }
            }
            else {
                requestCompleteResult = {
                    err: httpStatus,
                    xhr: xhr
                };
                if (httpStatus === 0) {
                    log("[warning] There was a problem communicating with the Learning Record Store. Aborted, offline, or invalid CORS endpoint (" + httpStatus + ")", LOG_SRC);
                }
                else {
                    log("[warning] There was a problem communicating with the Learning Record Store. (" + httpStatus + " | " + xhr.responseText+ ")", LOG_SRC);
                }
                if (cfg.callback) {
                    cfg.callback(httpStatus, xhr);
                }
                return requestCompleteResult;
            }
        }
        else {
            return requestCompleteResult;
        }
    };

    //
    // Converts an HTTP request cfg of above a set length (//MAX_REQUEST_LENGTH) to a post
    // request cfg, with the original request as the form data.
    //
    __IEModeConversion = function (fullUrl, headers, pairs, cfg) {
        var prop;

        // 'pairs' already holds the original cfg params, now needs headers and data
        // from the original cfg to add as the form data to the POST request
        for (prop in headers) {
            if (headers.hasOwnProperty(prop)) {
                pairs.push(prop + "=" + encodeURIComponent(headers[prop]));
            }
        }

        if (typeof cfg.data !== "undefined") {
            pairs.push("content=" + encodeURIComponent(cfg.data));
        }

        // the Authorization and xAPI version headers need to still be present, but
        // the content type must exist and be of type application/x-www-form-urlencoded
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        fullUrl += "?method=" + cfg.method;
        cfg.method = "POST";
        cfg.params = {};
        if (pairs.length > 0) {
            cfg.data = pairs.join("&");
        }
        return fullUrl;
    };

    //
    // one of the two of these is stuffed into the LRS' instance
    // as ._makeRequest
    //
    nativeRequest = function (fullUrl, headers, cfg) {
        /*global ActiveXObject*/
        log("sendRequest using XMLHttpRequest", LOG_SRC);
        var self = this,
            xhr,
            prop,
            pairs = [],
            data,
            control = {
                finished: false,
                fakeStatus: null
            },
            async = typeof cfg.callback !== "undefined",
            fullRequest = fullUrl,
            err,
            MAX_REQUEST_LENGTH = 2048
        ;
        log("sendRequest using XMLHttpRequest - async: " + async, LOG_SRC);

        for (prop in cfg.params) {
            if (cfg.params.hasOwnProperty(prop)) {
                pairs.push(prop + "=" + encodeURIComponent(cfg.params[prop]));
            }
        }

        if (pairs.length > 0) {
            fullRequest += "?" + pairs.join("&");
        }

        if (fullRequest.length >= MAX_REQUEST_LENGTH) {
            // This may change based upon what content is supported in IE Mode
            if (typeof headers["Content-Type"] !== "undefined" && headers["Content-Type"] !== "application/json") {
                err = new Error("Unsupported content type for IE Mode request");
                if (typeof cfg.callback !== "undefined") {
                    cfg.callback(err, null);
                }
                return {
                    err: err,
                    xhr: null
                };
            }

            if (typeof cfg.method === "undefined") {
                err = new Error("method must not be undefined for an IE Mode Request conversion");
                if (typeof cfg.callback !== "undefined") {
                    cfg.callback(err, null);
                }
                return {
                    err: err,
                    xhr: null
                };
            }

            fullUrl = __IEModeConversion(fullUrl, headers, pairs, cfg);
        }
        else {
            fullUrl = fullRequest;
        }

        if (typeof XMLHttpRequest !== "undefined") {
            xhr = new XMLHttpRequest();
        }
        else {
            //
            // IE6 implements XMLHttpRequest through ActiveX control
            // http://blogs.msdn.com/b/ie/archive/2006/01/23/516393.aspx
            //
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }

        xhr.open(cfg.method, fullUrl, async);
        for (prop in headers) {
            if (headers.hasOwnProperty(prop)) {
                xhr.setRequestHeader(prop, headers[prop]);
            }
        }

        if (typeof cfg.data !== "undefined") {
            cfg.data += "";
        }
        data = cfg.data;

        if (async) {
            xhr.onreadystatechange = function () {
                log("xhr.onreadystatechange - xhr.readyState: " + xhr.readyState, LOG_SRC);
                if (xhr.readyState === 4) {
                    requestComplete.call(self, xhr, cfg, control);
                }
            };
        }

        //
        // research indicates that IE is known to just throw exceptions
        // on .send and it seems everyone pretty much just ignores them
        // including jQuery (https://github.com/jquery/jquery/blob/1.10.2/src/ajax.js#L549
        // https://github.com/jquery/jquery/blob/1.10.2/src/ajax/xhr.js#L97)
        //
        try {
            xhr.send(data);
        }
        catch (ex) {
            log("sendRequest caught send exception: " + ex, LOG_SRC);
        }

        if (async) {
            //
            // for async requests give them the XHR object directly
            // as the return value, the actual stuff they should be
            // caring about is params to the callback, for sync
            // requests they got the return value above
            //
            return xhr;
        }

        return requestComplete.call(this, xhr, cfg, control);
    };
    xdrRequest = function (fullUrl, headers, cfg) {
        log("sendRequest using XDomainRequest", LOG_SRC);
        var self = this,
            xhr,
            pairs = [],
            data,
            prop,
            until,
            control = {
                finished: false,
                fakeStatus: null
            },
            err;

        if (typeof headers["Content-Type"] !== "undefined" && headers["Content-Type"] !== "application/json") {
            err = new Error("Unsupported content type for IE Mode request");
            if (cfg.callback) {
                cfg.callback(err, null);
                return null;
            }
            return {
                err: err,
                xhr: null
            };
        }

        // method has to go on querystring, and nothing else,
        // and the actual method is then always POST
        fullUrl += "?method=" + cfg.method;

        // params end up in the body
        for (prop in cfg.params) {
            if (cfg.params.hasOwnProperty(prop)) {
                pairs.push(prop + "=" + encodeURIComponent(cfg.params[prop]));
            }
        }

        // headers go into form data
        for (prop in headers) {
            if (headers.hasOwnProperty(prop)) {
                pairs.push(prop + "=" + encodeURIComponent(headers[prop]));
            }
        }

        // the original data is repackaged as "content" form var
        if (cfg.data !== null) {
            pairs.push("content=" + encodeURIComponent(cfg.data));
        }

        data = pairs.join("&");

        xhr = new XDomainRequest ();
        xhr.open("POST", fullUrl);

        if (! cfg.callback) {
            xhr.onload = function () {
                control.fakeStatus = 200;
            };
            xhr.onerror = function () {
                control.fakeStatus = 400;
            };
            xhr.ontimeout = function () {
                control.fakeStatus = 0;
            };
        }
        else {
            xhr.onload = function () {
                control.fakeStatus = 200;
                requestComplete.call(self, xhr, cfg, control);
            };
            xhr.onerror = function () {
                control.fakeStatus = 400;
                requestComplete.call(self, xhr, cfg, control);
            };
            xhr.ontimeout = function () {
                control.fakeStatus = 0;
                requestComplete.call(self, xhr, cfg, control);
            };
        }

        // IE likes to randomly abort requests when some handlers
        // aren't defined, so define them with no-ops, see:
        //
        // http://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
        // http://social.msdn.microsoft.com/Forums/ie/en-US/30ef3add-767c-4436-b8a9-f1ca19b4812e/ie9-rtm-xdomainrequest-issued-requests-may-abort-if-all-event-handlers-not-specified
        //
        xhr.onprogress = function () {};
        xhr.timeout = 0;

        //
        // research indicates that IE is known to just throw exceptions
        // on .send and it seems everyone pretty much just ignores them
        // including jQuery (https://github.com/jquery/jquery/blob/1.10.2/src/ajax.js#L549
        // https://github.com/jquery/jquery/blob/1.10.2/src/ajax/xhr.js#L97)
        //
        try {
            xhr.send(data);
        }
        catch (ex) {
            log("sendRequest caught send exception: " + ex, LOG_SRC);
        }

        if (! cfg.callback) {
            // synchronous call in IE, with no synchronous mode available
            until = 10000 + Date.now();
            log("sendRequest - until: " + until + ", finished: " + control.finished, LOG_SRC);

            while (Date.now() < until && control.fakeStatus === null) {
                //log("calling __delay", LOG_SRC);
                __delay();
            }
            return requestComplete.call(self, xhr, cfg, control);
        }

        //
        // for async requests give them the XHR object directly
        // as the return value, the actual stuff they should be
        // caring about is params to the callback, for sync
        // requests they got the return value above
        //
        return xhr;
    };

    //
    // Override LRS' init method to set up our request handling
    // capabilities
    //
    TinCan.LRS.prototype._initByEnvironment = function (cfg) {
        /*jslint regexp: true, laxbreak: true */
        /* globals location */
        log("_initByEnvironment", LOG_SRC);
        var urlParts,
            schemeMatches,
            locationPort,
            isXD
        ;

        cfg = cfg || {};

        //
        // default to native request mode
        //
        this._makeRequest = nativeRequest;

        //
        // overload LRS ._IEModeConversion to be able to test this method,
        // which only applies in a browser setting
        //
        this._IEModeConversion = __IEModeConversion;

        urlParts = this.endpoint.toLowerCase().match(/([A-Za-z]+:)\/\/([^:\/]+):?(\d+)?(\/.*)?$/);
        if (urlParts === null) {
            log("[error] LRS invalid: failed to divide URL parts", LOG_SRC);
            throw {
                code: 4,
                mesg: "LRS invalid: failed to divide URL parts"
            };
        }

        //
        // determine whether this is a cross domain request,
        // whether our browser has CORS support at all, and then
        // if it does then if we are in IE with XDR only check that
        // the schemes match to see if we should be able to talk to
        // the LRS
        //
        locationPort = location.port;
        schemeMatches = location.protocol.toLowerCase() === urlParts[1];

        //
        // normalize the location.port cause it appears to be "" when 80/443
        // but our endpoint may have provided it
        //
        if (locationPort === "") {
            locationPort = (location.protocol.toLowerCase() === "http:" ? "80" : (location.protocol.toLowerCase() === "https:" ? "443" : ""));
        }

        isXD = (
            // is same scheme?
            ! schemeMatches

            // is same host?
            || location.hostname.toLowerCase() !== urlParts[2]

            // is same port?
            || locationPort !== (
                (urlParts[3] !== null && typeof urlParts[3] !== "undefined" && urlParts[3] !== "") ? urlParts[3] : (urlParts[1] === "http:" ? "80" : (urlParts[1] === "https:" ? "443" : ""))
            )
        );
        if (isXD) {
            if (env.hasCORS) {
                if (env.useXDR && schemeMatches) {
                    this._makeRequest = xdrRequest;
                }
                else if (env.useXDR && ! schemeMatches) {
                    if (cfg.allowFail) {
                        log("[warning] LRS invalid: cross domain request for differing scheme in IE with XDR (allowed to fail)", LOG_SRC);
                    }
                    else {
                        log("[error] LRS invalid: cross domain request for differing scheme in IE with XDR", LOG_SRC);
                        throw {
                            code: 2,
                            mesg: "LRS invalid: cross domain request for differing scheme in IE with XDR"
                        };
                    }
                }
            }
            else {
                if (cfg.allowFail) {
                    log("[warning] LRS invalid: cross domain requests not supported in this browser (allowed to fail)", LOG_SRC);
                }
                else {
                    log("[error] LRS invalid: cross domain requests not supported in this browser", LOG_SRC);
                    throw {
                        code: 1,
                        mesg: "LRS invalid: cross domain requests not supported in this browser"
                    };
                }
            }
        }
    };

    /**
    Non-environment safe method used to create a delay to give impression
    of synchronous response (for IE, shocker)

    @method __delay
    @private
    */
    __delay = function () {
        //
        // use a synchronous request to the current location to allow the browser
        // to yield to the asynchronous request's events but still block in the
        // outer loop to make it seem synchronous to the end user
        //
        // removing this made the while loop too tight to allow the asynchronous
        // events through to get handled so that the response was correctly handled
        //
        var xhr = new XMLHttpRequest (),
            url = window.location + "?forcenocache=" + TinCan.Utils.getUUID()
        ;
        xhr.open("GET", url, false);
        xhr.send(null);
    };

    //
    // Synchronous xhr handling is accepted in the browser environment
    //
    TinCan.LRS.syncEnabled = true;
}());
