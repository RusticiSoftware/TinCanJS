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

/**
TinCan client library

@module TinCan
@submodule TinCan.LRS
**/
(function () {
    "use strict";
    var XDR = "xdr",
        NATIVE = "native",

    /**
    @class TinCan.LRS
    @constructor
    */
    LRS = TinCan.LRS = function (cfg) {
        this.log("constructor");

        /**
        @property endpoint
        @type String
        */
        this.endpoint = null;

        /**
        @property version
        @type String
        */
        this.version = null;

        /**
        @property auth
        @type String
        */
        this.auth = null;

        /**
        @property allowFail
        @type Boolean
        @default true
        */
        this.allowFail = true;

        /**
        @property alertOnRequestFailure
        @type Boolean
        @default true
        */
        this.alertOnRequestFailure = true;

        /**
        @property extended
        @type Object
        */
        this.extended = null;

        /**
        @property _requestMode
        @type String
        @default "native"
        @private
        */
        this._requestMode = NATIVE;

        this.init(cfg);
    };
    LRS.prototype = {
        /**
        @property LOG_SRC
        */
        LOG_SRC: "LRS",

        /**
        @method log
        */
        log: TinCan.prototype.log,

        /**
        @method init
        */
        init: function (cfg) {
            /*jslint regexp: true */
            this.log("init");

            var urlParts,
                schemeMatches,
                isXD,
                env = TinCan.environment()
            ;

            cfg = cfg || {};

            if (! cfg.hasOwnProperty("endpoint")) {
                if (env.isBrowser && this.alertOnRequestFailure) {
                    alert("[error] LRS invalid: no endpoint");
                }
                throw {
                    code: 3,
                    mesg: "LRS invalid: no endpoint"
                };
            }

            this.endpoint = cfg.endpoint;

            if (cfg.hasOwnProperty("allowFail")) {
                this.allowFail = cfg.allowFail;
            }

            if (cfg.hasOwnProperty("auth")) {
                this.auth = cfg.auth;
            }
            else if (cfg.hasOwnProperty("username") && cfg.hasOwnProperty("password")) {
                this.auth = "Basic " + TinCan.Utils.getBase64String(cfg.username + ":" + cfg.password);
            }

            if (cfg.hasOwnProperty("extended")) {
                this.extended = cfg.extended;
            }

            urlParts = cfg.endpoint.toLowerCase().match(/([A-Za-z]+:)\/\/([^:\/]+):?(\d+)?(\/.*)?$/);

            if (env.isBrowser) {
                //
                // determine whether this is a cross domain request,
                // whether our browser has CORS support at all, and then
                // if it does then if we are in IE with XDR only check that
                // the schemes match to see if we should be able to talk to
                // the LRS
                //
                schemeMatches = location.protocol.toLowerCase() === urlParts[1];
                isXD = (
                    // is same scheme?
                    ! schemeMatches

                    // is same host?
                    || location.hostname.toLowerCase() !== urlParts[2]

                    // is same port?
                    || location.port !== (
                        urlParts[3] !== null ? urlParts[3] : (urlParts[1] === "http:" ? "80" : "443")
                    )
                );
                if (isXD) {
                    if (env.hasCORS) {
                        if (env.useXDR && schemeMatches) {
                            this._requestMode = XDR;
                        }
                        else if (env.useXDR && ! schemeMatches) {
                            if (cfg.allowFail) {
                                if (this.alertOnRequestFailure) {
                                    alert("[warning] LRS invalid: cross domain request for differing scheme in IE with XDR");
                                }
                            }
                            else {
                                if (this.alertOnRequestFailure) {
                                    alert("[error] LRS invalid: cross domain request for differing scheme in IE with XDR");
                                }
                                throw {
                                    code: 2,
                                    mesg: "LRS invalid: cross domain request for differing scheme in IE with XDR"
                                };
                            }
                        }
                    }
                    else {
                        if (cfg.allowFail) {
                            if (this.alertOnRequestFailure) {
                                alert("[warning] LRS invalid: cross domain requests not supported in this browser");
                            }
                        }
                        else {
                            if (this.alertOnRequestFailure) {
                                alert("[error] LRS invalid: cross domain requests not supported in this browser");
                            }
                            throw {
                                code: 2,
                                mesg: "LRS invalid: cross domain requests not supported in this browser"
                            };
                        }
                    }
                }
            }
            else {
                this.log("Unrecognized environment not supported: " + env);
            }

            if (typeof cfg.version !== "undefined") {
                this.log("version: " + cfg.version);
                this.version = cfg.version;
            }
            else {
                //
                // assume max supported when not specified,
                // TODO: add detection of LRS from call to endpoint
                //
                this.version = TinCan.versions()[0];
            }
        },

        /**
        Method used to send a request via browser objects to the LRS

        @method sendRequest
        @param {Object} [cfg] Configuration for request
            @param {String} [cfg.url] URL portion to add to endpoint
            @param {String} [cfg.method] GET, PUT, POST, etc.
            @param {Object} [cfg.params] Parameters to set on the querystring
            @param {String} [cfg.data] String of body content
            @param {Object} [cfg.headers] Additional headers to set in the request
            @param {Function} [cfg.callback] Function to run at completion
                @param {String|Null} cfg.callback.err If an error occurred, this parameter will contain the HTTP status code.
                    If the operation succeeded, err will be null.
                @param {Object} cfg.callback.xhr XHR object
            @param {Boolean} [cfg.ignore404] Whether 404 status codes should be considered an error
        @return {Object} XHR if called in a synchronous way (in other words no callback)
        */
        sendRequest: function (cfg) {
            this.log("sendRequest");
            var xhr,
                finished = false,
                location = window.location,
                fullUrl = this.endpoint + cfg.url,
                headers = {},
                data,
                requestCompleteResult,
                until,
                prop,
                pairs = [],
                self = this
            ;

            // respect absolute URLs passed in
            if (cfg.url.indexOf("http") === 0) {
                fullUrl = cfg.url;
            }

            // add extended LMS-specified values to the params
            if (this.extended !== null) {
                cfg.params = cfg.params || {};

                for (prop in this.extended) {
                    if (this.extended.hasOwnProperty(prop)) {
                        // don't overwrite cfg.params values that have already been added to the request with our extended params
                        if (! cfg.params.hasOwnProperty(prop)) {
                            if (this.extended[prop] !== null) {
                                cfg.params[prop] = this.extended[prop];
                            }
                        }
                    }
                }
            }

            // consolidate headers
            headers["Content-Type"] = "application/json";
            headers.Authorization = this.auth;
            if (this.version !== "0.9") {
                headers["X-Experience-API-Version"] = this.version;
            }

            for (prop in cfg.headers) {
                if (cfg.headers.hasOwnProperty(prop)) {
                    headers[prop] = cfg.headers[prop];
                }
            }

            if (this._requestMode === NATIVE) {
                this.log("sendRequest using XMLHttpRequest");

                for (prop in cfg.params) {
                    if (cfg.params.hasOwnProperty(prop)) {
                        pairs.push(prop + "=" + encodeURIComponent(cfg.params[prop]));
                    }
                }
                if (pairs.length > 0) {
                    fullUrl += "?" + pairs.join("&");
                }

                this.log("sendRequest using XMLHttpRequest - async: " + (typeof cfg.callback !== "undefined"));

                xhr = new XMLHttpRequest();
                xhr.open(cfg.method, fullUrl, (typeof cfg.callback !== "undefined"));
                for (prop in headers) {
                    if (headers.hasOwnProperty(prop)) {
                        xhr.setRequestHeader(prop, headers[prop]);
                    }
                }

                if (typeof cfg.data !== "undefined") {
                    cfg.data += "";
                }
                data = cfg.data;
            }
            else if (this._requestMode === XDR) {
                this.log("sendRequest using XDomainRequest");

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
            }
            else {
                this.log("sendRequest unrecognized _requestMode: " + this._requestMode);
            }

            // Setup request callback
            function requestComplete () {
                self.log("requestComplete: " + finished + ", xhr.status: " + xhr.status);
                var notFoundOk,
                    httpStatus;

                //
                // older versions of IE don't properly handle 204 status codes
                // so correct when receiving a 1223 to be 204 locally
                // http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
                //
                httpStatus = (xhr.status === 1223) ? 204 : xhr.status;

                if (! finished) {
                    // may be in sync or async mode, using XMLHttpRequest or IE XDomainRequest, onreadystatechange or
                    // onload or both might fire depending upon browser, just covering all bases with event hooks and
                    // using 'finished' flag to avoid triggering events multiple times
                    finished = true;

                    notFoundOk = (cfg.ignore404 && httpStatus === 404);
                    if (httpStatus === undefined || (httpStatus >= 200 && httpStatus < 400) || notFoundOk) {
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
                        // Alert all errors except cancelled XHR requests
                        if (httpStatus > 0) {
                            requestCompleteResult = {
                                err: httpStatus,
                                xhr: xhr
                            };
                            if (self.alertOnRequestFailure) {
                                alert("[warning] There was a problem communicating with the Learning Record Store. (" + httpStatus + " | " + xhr.responseText+ ")");
                            }
                            if (cfg.callback) {
                                cfg.callback(httpStatus, xhr);
                            }
                        }
                        return requestCompleteResult;
                    }
                }
                else {
                    return requestCompleteResult;
                }
            }

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    requestComplete();
                }
            };

            xhr.onload = requestComplete;
            xhr.onerror = requestComplete;

            xhr.send(data);

            if (! cfg.callback) {
                // synchronous
                if (this._requestMode === XDR) {
                    // synchronous call in IE, with no synchronous mode available
                    until = 1000 + Date.now();
                    this.log("sendRequest - until: " + until + ", finished: " + finished);

                    while (Date.now() < until && ! finished) {
                        //this.log("calling __delay");
                        this.__delay();
                    }
                }
                return requestComplete();
            }

            //
            // for async requests give them the XHR object directly
            // as the return value, the actual stuff they should be
            // caring about is params to the callback, for sync
            // requests they got the return value above
            //
            return xhr;
        },

        /**
        Save a statement, when used from a browser sends to the endpoint using the RESTful interface.
        Use a callback to make the call asynchronous.

        @method saveStatement
        @param {Object} TinCan.Statement to send
        @param {Object} [cfg] Configuration used when saving
            @param {Function} [cfg.callback] Callback to execute on completion
        */
        saveStatement: function (stmt, cfg) {
            this.log("saveStatement");
            var requestCfg;

            // TODO: it would be better to make a subclass that knows
            //       its own environment and just implements the protocol
            //       that it needs to
            if (! TinCan.environment().isBrowser) {
                this.log("error: environment not implemented");
                return;
            }

            cfg = cfg || {};

            requestCfg = {
                url: "statements",
                data: JSON.stringify(stmt.asVersion( this.version ))
            };
            if (stmt.id !== null) {
                requestCfg.method = "PUT";
                requestCfg.params = {
                    statementId: stmt.id
                };
            }
            else {
                requestCfg.method = "POST";
            }

            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }

            return this.sendRequest(requestCfg);
        },

        /**
        Retrieve a statement, when used from a browser sends to the endpoint using the RESTful interface.

        @method retrieveStatement
        @param {String} ID of statement to retrieve
        @param {Object} [cfg] Configuration options
            @param {Function} [cfg.callback] Callback to execute on completion
        @return {Object} TinCan.Statement retrieved
        */
        retrieveStatement: function (stmtId, cfg) {
            this.log("retrieveStatement");
            var requestCfg,
                requestResult,
                callbackWrapper;

            // TODO: it would be better to make a subclass that knows
            //       its own environment and just implements the protocol
            //       that it needs to
            if (! TinCan.environment().isBrowser) {
                this.log("error: environment not implemented");
                return;
            }

            cfg = cfg || {};

            requestCfg = {
                url: "statements",
                method: "GET",
                params: {
                    statementId: stmtId
                }
            };
            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (err, xhr) {
                    var result = xhr;

                    if (err === null) {
                        result = TinCan.Statement.fromJSON(xhr.responseText);
                    }

                    cfg.callback(err, result);
                };
                requestCfg.callback = callbackWrapper;
            }

            requestResult = this.sendRequest(requestCfg);
            if (! callbackWrapper) {
                requestResult.statement = null;
                if (requestResult.err === null) {
                    requestResult.statement = TinCan.Statement.fromJSON(requestResult.xhr.responseText);
                }
            }

            return requestResult;
        },

        /**
        Retrieve a voided statement, when used from a browser sends to the endpoint using the RESTful interface.

        @method retrieveVoidedStatement
        @param {String} ID of voided statement to retrieve
        @param {Object} [cfg] Configuration options
            @param {Function} [cfg.callback] Callback to execute on completion
        @return {Object} TinCan.Statement retrieved
        */
        retrieveVoidedStatement: function (stmtId, cfg) {
            this.log("retrieveStatement");
            var requestCfg,
                requestResult,
                callbackWrapper;

            // TODO: it would be better to make a subclass that knows
            //       its own environment and just implements the protocol
            //       that it needs to
            if (! TinCan.environment().isBrowser) {
                this.log("error: environment not implemented");
                return;
            }

            cfg = cfg || {};

            requestCfg = {
                url: "statements",
                method: "GET",
                params: {}
            };
            if (this.version === "0.9" || this.version === "0.95") {
                requestCfg.params.statementId = stmtId;
            }
            else {
                requestCfg.params.voidedStatementId = stmtId;
            }

            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (err, xhr) {
                    var result = xhr;

                    if (err === null) {
                        result = TinCan.Statement.fromJSON(xhr.responseText);
                    }

                    cfg.callback(err, result);
                };
                requestCfg.callback = callbackWrapper;
            }

            requestResult = this.sendRequest(requestCfg);
            if (! callbackWrapper) {
                requestResult.statement = null;
                if (requestResult.err === null) {
                    requestResult.statement = TinCan.Statement.fromJSON(requestResult.xhr.responseText);
                }
            }

            return requestResult;
        },

        /**
        Save a set of statements, when used from a browser sends to the endpoint using the RESTful interface.
        Use a callback to make the call asynchronous.

        @method saveStatements
        @param {Array} Array of statements or objects convertable to statements
        @param {Object} [cfg] Configuration used when saving
            @param {Function} [cfg.callback] Callback to execute on completion
        */
        saveStatements: function (stmts, cfg) {
            this.log("saveStatements");
            var requestCfg,
                versionedStatements = [],
                i
            ;

            // TODO: it would be better to make a subclass that knows
            //       its own environment and just implements the protocol
            //       that it needs to
            if (! TinCan.environment().isBrowser) {
                this.log("error: environment not implemented");
                return;
            }

            cfg = cfg || {};

            if (stmts.length === 0) {
                if (typeof cfg.callback !== "undefined") {
                    cfg.callback.apply(this, ["no statements"]);
                }
                return;
            }

            for (i = 0; i < stmts.length; i += 1) {
                versionedStatements.push(
                    stmts[i].asVersion( this.version )
                );
            }

            requestCfg = {
                url: "statements",
                method: "POST",
                data: JSON.stringify(versionedStatements)
            };
            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }

            return this.sendRequest(requestCfg);
        },

        /**
        Fetch a set of statements, when used from a browser sends to the endpoint using the
        RESTful interface.  Use a callback to make the call asynchronous.

        @method queryStatements
        @param {Object} [cfg] Configuration used to query
            @param {Object} [cfg.params] Query parameters
                @param {TinCan.Agent|TinCan.Group} [cfg.params.agent] Agent matches 'actor' or 'object'
                @param {TinCan.Verb} [cfg.params.verb] Verb to query on
                @param {TinCan.Activity} [cfg.params.activity] Activity to query on
                @param {String} [cfg.params.registration] Registration UUID
                @param {Boolean} [cfg.params.related_activities] Match related activities
                @param {Boolean} [cfg.params.related_agents] Match related agents
                @param {String} [cfg.params.since] Match statements stored since specified timestamp
                @param {String} [cfg.params.until] Match statements stored at or before specified timestamp
                @param {Integer} [cfg.params.limit] Number of results to retrieve
                @param {String} [cfg.params.format] One of "ids", "exact", "canonical" (default: "exact")
                @param {Boolean} [cfg.params.attachments] Include attachments in multipart response or don't (defualt: false)
                @param {Boolean} [cfg.params.ascending] Return results in ascending order of stored time

                @param {TinCan.Agent} [cfg.params.actor] (Removed in 1.0.0, use 'agent' instead) Agent matches 'actor'
                @param {TinCan.Activity|TinCan.Agent|TinCan.Statement} [cfg.params.target] (Removed in 1.0.0, use 'activity' or 'agent' instead) Activity, Agent, or Statement matches 'object'
                @param {TinCan.Agent} [cfg.params.instructor] (Removed in 1.0.0, use 'agent' + 'related_agents' instead) Agent matches 'context:instructor'
                @param {Boolean} [cfg.params.context] (Removed in 1.0.0, use 'activity' instead) When filtering on target, include statements with matching context
                @param {Boolean} [cfg.params.authoritative] (Removed in 1.0.0) Get authoritative results
                @param {Boolean} [cfg.params.sparse] (Removed in 1.0.0, use 'format' instead) Get sparse results

            @param {Function} [cfg.callback] Callback to execute on completion
                @param {String|null} cfg.callback.err Error status or null if succcess
                @param {TinCan.StatementsResult|XHR} cfg.callback.response Receives a StatementsResult argument
        @return {Object} Request result
        */
        queryStatements: function (cfg) {
            this.log("queryStatements");
            var requestCfg,
                requestResult,
                callbackWrapper;

            // TODO: it would be better to make a subclass that knows
            //       its own environment and just implements the protocol
            //       that it needs to
            if (! TinCan.environment().isBrowser) {
                this.log("error: environment not implemented");
                return;
            }

            cfg = cfg || {};
            cfg.params = cfg.params || {};

            //
            // if they misconfigured (possibly do to version mismatches) the
            // query then don't try to send a request at all, rather than give
            // them invalid results
            //
            try {
                requestCfg = this._queryStatementsRequestCfg(cfg);
            }
            catch (ex) {
                if (TinCan.environment().isBrowser && this.alertOnRequestFailure) {
                    alert("[error] Query statements failed - " + ex);
                }
                if (typeof cfg.callback !== "undefined") {
                    cfg.callback(ex, {});
                }

                return {
                    err: ex,
                    statementsResult: null
                };
            }

            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (err, xhr) {
                    var result = xhr;

                    if (err === null) {
                        result = TinCan.StatementsResult.fromJSON(xhr.responseText);
                    }

                    cfg.callback(err, result);
                };
                requestCfg.callback = callbackWrapper;
            }

            requestResult = this.sendRequest(requestCfg);
            requestResult.config = requestCfg;

            if (! callbackWrapper) {
                requestResult.statementsResult = null;
                if (requestResult.err === null) {
                    requestResult.statementsResult = TinCan.StatementsResult.fromJSON(requestResult.xhr.responseText);
                }
            }

            return requestResult;
        },

        /**
        Build a request config object that can be passed to sendRequest() to make a query request

        @method _queryStatementsRequestCfg
        @private
        @param {Object} [cfg] See configuration for {{#crossLink "TinCan.LRS/queryStatements"}}{{/crossLink}}
        @return {Object} Request configuration object
        */
        _queryStatementsRequestCfg: function (cfg) {
            this.log("_queryStatementsRequestCfg");
            var params = {},
                returnCfg = {
                    url: "statements",
                    method: "GET",
                    params: params
                },
                jsonProps = [
                    "agent",
                    "actor",
                    "object",
                    "instructor"
                ],
                idProps = [
                    "verb",
                    "activity"
                ],
                valProps = [
                    "registration",
                    "context",
                    "since",
                    "until",
                    "limit",
                    "authoritative",
                    "sparse",
                    "ascending",
                    "related_activities",
                    "related_agents",
                    "format",
                    "attachments"
                ],
                i,
                prop,
                //
                // list of parameters that are supported in all versions (supported by
                // this library) of the spec
                //
                universal = {
                    verb: true,
                    registration: true,
                    since: true,
                    until: true,
                    limit: true,
                    ascending: true
                },
                //
                // future proofing here, "supported" is an object so that
                // in the future we can support a "deprecated" list to
                // throw warnings, hopefully the spec uses deprecation phases
                // for the removal of these things
                //
                compatibility = {
                    "0.9": {
                        supported: {
                            actor: true,
                            instructor: true,
                            target: true,
                            object: true,
                            context: true,
                            authoritative: true,
                            sparse: true
                        }
                    },
                    "1.0.0": {
                        supported: {
                            agent: true,
                            activity: true,
                            related_activities: true,
                            related_agents: true,
                            format: true,
                            attachments: true
                        }
                    }
                };

            compatibility["0.95"] = compatibility["0.9"];

            if (cfg.params.hasOwnProperty("target")) {
                cfg.params.object = cfg.params.target;
            }

            //
            // check compatibility tables, either the configured parameter is in
            // the universal list or the specific version, if not then throw an
            // error which at least for .queryStatements will prevent the request
            // and potentially alert the user
            //
            for (prop in cfg.params) {
                if (cfg.params.hasOwnProperty(prop)) {
                    if (typeof universal[prop] === "undefined" && typeof compatibility[this.version].supported[prop] === "undefined") {
                        throw "Unrecognized query parameter configured: " + prop;
                    }
                }
            }

            //
            // getting here means that all parameters are valid for this version
            // to make handling the output formats easier
            //

            for (i = 0; i < jsonProps.length; i += 1) {
                if (typeof cfg.params[jsonProps[i]] !== "undefined") {
                    params[jsonProps[i]] = JSON.stringify(cfg.params[jsonProps[i]].asVersion(this.version));
                }
            }

            for (i = 0; i < idProps.length; i += 1) {
                if (typeof cfg.params[idProps[i]] !== "undefined") {
                    params[idProps[i]] = cfg.params[idProps[i]].id;
                }
            }

            for (i = 0; i < valProps.length; i += 1) {
                if (typeof cfg.params[valProps[i]] !== "undefined") {
                    params[valProps[i]] = cfg.params[valProps[i]];
                }
            }

            return returnCfg;
        },

        /**
        Fetch more statements from a previous query, when used from a browser sends to the endpoint using the
        RESTful interface.  Use a callback to make the call asynchronous.

        @method moreStatements
        @param {Object} [cfg] Configuration used to query
            @param {String} [cfg.url] More URL
            @param {Function} [cfg.callback] Callback to execute on completion
                @param {String|null} cfg.callback.err Error status or null if succcess
                @param {TinCan.StatementsResult|XHR} cfg.callback.response Receives a StatementsResult argument
        @return {Object} Request result
        */
        moreStatements: function (cfg) {
            this.log("moreStatements: " + cfg.url);
            var requestCfg,
                requestResult,
                callbackWrapper,
                parsedURL,
                serverRoot;

            // TODO: it would be better to make a subclass that knows
            //       its own environment and just implements the protocol
            //       that it needs to
            if (! TinCan.environment().isBrowser) {
                this.log("error: environment not implemented");
                return;
            }

            cfg = cfg || {};

            // to support our interface (to support IE) we need to break apart
            // the more URL query params so that the request can be made properly later
            parsedURL = TinCan.Utils.parseURL(cfg.url);

            //Respect a more URL that is relative to either the server root 
            //or endpoint (though only the former is allowed in the spec)
            serverRoot = TinCan.Utils.getServerRoot(this.endpoint);
            if (parsedURL.path.indexOf("/statements") === 0){
                parsedURL.path = this.endpoint.replace(serverRoot, '') + parsedURL.path;
                this.log("converting non-standard more URL to " + parsedURL.path);
            }

            //The more relative URL might not start with a slash, add it if not
            if (parsedURL.path.indexOf("/") !== 0) {
                parsedURL.path = "/" + parsedURL.path;
            }

            requestCfg = {
                method: "GET",
                //For arbitrary more URLs to work, 
                //we need to make the URL absolute here
                url: serverRoot + parsedURL.path,
                params: parsedURL.params
            };
            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (err, xhr) {
                    var result = xhr;

                    if (err === null) {
                        result = TinCan.StatementsResult.fromJSON(xhr.responseText);
                    }

                    cfg.callback(err, result);
                };
                requestCfg.callback = callbackWrapper;
            }

            requestResult = this.sendRequest(requestCfg);
            requestResult.config = requestCfg;

            if (! callbackWrapper) {
                requestResult.statementsResult = null;
                if (requestResult.err === null) {
                    requestResult.statementsResult = TinCan.StatementsResult.fromJSON(requestResult.xhr.responseText);
                }
            }

            return requestResult;
        },

        /**
        Retrieve a state value, when used from a browser sends to the endpoint using the RESTful interface.

        @method retrieveState
        @param {String} key Key of state to retrieve
        @param {Object} cfg Configuration options
            @param {Object} cfg.activity TinCan.Activity
            @param {Object} cfg.agent TinCan.Agent
            @param {String} [cfg.registration] Registration
            @param {Function} [cfg.callback] Callback to execute on completion
                @param {Object|Null} cfg.callback.error
                @param {TinCan.State|null} cfg.callback.result null if state is 404
        @return {Object} TinCan.State retrieved when synchronous, or result from sendRequest
        */
        retrieveState: function (key, cfg) {
            this.log("retrieveState");
            var requestParams = {},
                requestCfg = {},
                requestResult,
                callbackWrapper
            ;

            // TODO: it would be better to make a subclass that knows
            //       its own environment and just implements the protocol
            //       that it needs to
            if (! TinCan.environment().isBrowser) {
                this.log("error: environment not implemented");
                return;
            }

            requestParams = {
                stateId: key,
                activityId: cfg.activity.id
            };
            if (this.version === "0.9") {
                requestParams.actor = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            else {
                requestParams.agent = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            if (typeof cfg.registration !== "undefined") {
                if (this.version === "0.9") {
                    requestParams.registrationId = cfg.registration;
                }
                else {
                    requestParams.registration = cfg.registration;
                }
            }

            requestCfg = {
                url: "activities/state",
                method: "GET",
                params: requestParams,
                ignore404: true
            };
            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (err, xhr) {
                    var result = xhr;

                    if (err === null) {
                        if (xhr.status === 404) {
                            result = null;
                        }
                        else {
                            result = new TinCan.State(
                                {
                                    id: key,
                                    contents: xhr.responseText
                                }
                            );
                            if (typeof xhr.getResponseHeader !== "undefined" && xhr.getResponseHeader("ETag") !== null && xhr.getResponseHeader("ETag") !== "") {
                                result.etag = xhr.getResponseHeader("ETag");
                            } else {
                                //
                                // either XHR didn't have getResponseHeader (probably cause it is an IE
                                // XDomainRequest object which doesn't) or not populated by LRS so create
                                // the hash ourselves
                                //
                                result.etag = TinCan.Utils.getSHA1String(xhr.responseText);
                            }
                        }
                    }

                    cfg.callback(err, result);
                };
                requestCfg.callback = callbackWrapper;
            }

            requestResult = this.sendRequest(requestCfg);
            if (! callbackWrapper) {
                requestResult.state = null;
                if (requestResult.err === null && requestResult.xhr.status !== 404) {
                    requestResult.state = new TinCan.State(
                        {
                            id: key,
                            contents: requestResult.xhr.responseText
                        }
                    );
                    if (typeof requestResult.xhr.getResponseHeader !== "undefined" && requestResult.xhr.getResponseHeader("ETag") !== null && requestResult.xhr.getResponseHeader("ETag") !== "") {
                        requestResult.state.etag = requestResult.xhr.getResponseHeader("ETag");
                    } else {
                        //
                        // either XHR didn't have getResponseHeader (probably cause it is an IE
                        // XDomainRequest object which doesn't) or not populated by LRS so create
                        // the hash ourselves
                        //
                        requestResult.state.etag = TinCan.Utils.getSHA1String(requestResult.xhr.responseText);
                    }
                }
            }

            return requestResult;
        },

        /**
        Save a state value, when used from a browser sends to the endpoint using the RESTful interface.

        @method saveState
        @param {String} key Key of state to save
        @param {String} val Value of state to save
        @param {Object} cfg Configuration options
            @param {Object} cfg.activity TinCan.Activity
            @param {Object} cfg.agent TinCan.Agent
            @param {String} [cfg.registration] Registration
            @param {String} [cfg.lastSHA1] SHA1 of the previously seen existing state
            @param {Function} [cfg.callback] Callback to execute on completion
        */
        saveState: function (key, val, cfg) {
            this.log("saveState");
            var requestParams,
                requestCfg,
                requestResult
            ;

            // TODO: it would be better to make a subclass that knows
            //       its own environment and just implements the protocol
            //       that it needs to
            if (! TinCan.environment().isBrowser) {
                this.log("error: environment not implemented");
                return;
            }

            if (typeof val === "object") {
                val = JSON.stringify(val);
            }

            requestParams = {
                stateId: key,
                activityId: cfg.activity.id
            };
            if (this.version === "0.9") {
                requestParams.actor = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            else {
                requestParams.agent = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            if (typeof cfg.registration !== "undefined") {
                if (this.version === "0.9") {
                    requestParams.registrationId = cfg.registration;
                }
                else {
                    requestParams.registration = cfg.registration;
                }
            }

            requestCfg = {
                url: "activities/state",
                method: "PUT",
                params: requestParams,
                data: val
            };
            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }
            if (typeof cfg.lastSHA1 !== "undefined" && cfg.lastSHA1 !== null) {
                requestCfg.headers = {
                    "If-Match": cfg.lastSHA1
                };
            }

            return this.sendRequest(requestCfg);
        },

        /**
        Drop a state value or all of the state, when used from a browser sends to the endpoint using the RESTful interface.

        @method dropState
        @param {String|null} key Key of state to delete, or null for all
        @param {Object} cfg Configuration options
            @param {Object} [cfg.activity] TinCan.Activity
            @param {Object} [cfg.agent] TinCan.Agent
            @param {String} [cfg.registration] Registration
            @param {Function} [cfg.callback] Callback to execute on completion
        */
        dropState: function (key, cfg) {
            this.log("dropState");
            var requestParams = {},
                requestCfg = {}
            ;

            // TODO: it would be better to make a subclass that knows
            //       its own environment and just implements the protocol
            //       that it needs to
            if (! TinCan.environment().isBrowser) {
                this.log("error: environment not implemented");
                return;
            }

            requestParams = {
                activityId: cfg.activity.id
            };
            if (this.version === "0.9") {
                requestParams.actor = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            else {
                requestParams.agent = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            if (key !== null) {
                requestParams.stateId = key;
            }
            if (typeof cfg.registration !== "undefined") {
                if (this.version === "0.9") {
                    requestParams.registrationId = cfg.registration;
                }
                else {
                    requestParams.registration = cfg.registration;
                }
            }

            requestCfg = {
                url: "activities/state",
                method: "DELETE",
                params: requestParams
            };
            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }

            return this.sendRequest(requestCfg);
        },

        /**
        Retrieve an activity profile value, when used from a browser sends to the endpoint using the RESTful interface.

        @method retrieveActivityProfile
        @param {String} key Key of activity profile to retrieve
        @param {Object} cfg Configuration options
            @param {Object} cfg.activity TinCan.Activity
            @param {Function} [cfg.callback] Callback to execute on completion
        @return {Object} Value retrieved
        */
        retrieveActivityProfile: function (key, cfg) {
            this.log("retrieveActivityProfile");
            var requestCfg = {},
                requestResult,
                callbackWrapper
            ;

            // TODO: it would be better to make a subclass that knows
            //       its own environment and just implements the protocol
            //       that it needs to
            if (! TinCan.environment().isBrowser) {
                this.log("error: environment not implemented");
                return;
            }

            requestCfg = {
                url: "activities/profile",
                method: "GET",
                params: {
                    profileId: key,
                    activityId: cfg.activity.id
                },
                ignore404: true
            };
            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (err, xhr) {
                    var result = xhr;

                    if (err === null) {
                        if (xhr.status === 404) {
                            result = null;
                        }
                        else {
                            result = new TinCan.ActivityProfile(
                                {
                                    id: key,
                                    activity: cfg.activity,
                                    contents: xhr.responseText
                                }
                            );
                            if (typeof xhr.getResponseHeader !== "undefined" && xhr.getResponseHeader("ETag") !== null && xhr.getResponseHeader("ETag") !== "") {
                                result.etag = xhr.getResponseHeader("ETag");
                            } else {
                                //
                                // either XHR didn't have getResponseHeader (probably cause it is an IE
                                // XDomainRequest object which doesn't) or not populated by LRS so create
                                // the hash ourselves
                                //
                                result.etag = TinCan.Utils.getSHA1String(xhr.responseText);
                            }
                        }
                    }

                    cfg.callback(err, result);
                };
                requestCfg.callback = callbackWrapper;
            }

            requestResult = this.sendRequest(requestCfg);
            if (! callbackWrapper) {
                requestResult.profile = null;
                if (requestResult.err === null && requestResult.xhr.status !== 404) {
                    requestResult.profile = new TinCan.ActivityProfile(
                        {
                            id: key,
                            activity: cfg.activity,
                            contents: requestResult.xhr.responseText
                        }
                    );
                    if (typeof requestResult.xhr.getResponseHeader !== "undefined" && requestResult.xhr.getResponseHeader("ETag") !== null && requestResult.xhr.getResponseHeader("ETag") !== "") {
                        requestResult.profile.etag = requestResult.xhr.getResponseHeader("ETag");
                    } else {
                        //
                        // either XHR didn't have getResponseHeader (probably cause it is an IE
                        // XDomainRequest object which doesn't) or not populated by LRS so create
                        // the hash ourselves
                        //
                        requestResult.profile.etag = TinCan.Utils.getSHA1String(requestResult.xhr.responseText);
                    }
                }
            }

            return requestResult;
        },

        /**
        Save an activity profile value, when used from a browser sends to the endpoint using the RESTful interface.

        @method saveActivityProfile
        @param {String} key Key of activity profile to retrieve
        @param {Object} cfg Configuration options
            @param {Object} cfg.activity TinCan.Activity
            @param {String} [cfg.lastSHA1] SHA1 of the previously seen existing profile
            @param {Function} [cfg.callback] Callback to execute on completion
        */
        saveActivityProfile: function (key, val, cfg) {
            this.log("saveActivityProfile");
            var requestCfg;

            // TODO: it would be better to make a subclass that knows
            //       its own environment and just implements the protocol
            //       that it needs to
            if (! TinCan.environment().isBrowser) {
                this.log("error: environment not implemented");
                return;
            }

            if (typeof val === "object") {
                val = JSON.stringify(val);
            }

            requestCfg = {
                url: "activities/profile",
                method: "PUT",
                params: {
                    profileId: key,
                    activityId: cfg.activity.id
                },
                data: val
            };
            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }
            if (typeof cfg.lastSHA1 !== "undefined" && cfg.lastSHA1 !== null) {
                requestCfg.headers = {
                    "If-Match": cfg.lastSHA1
                };
            }
            else {
                requestCfg.headers = {
                    "If-None-Match": "*"
                };
            }

            return this.sendRequest(requestCfg);
        },

        /**
        Drop an activity profile value or all of the activity profile, when used from a browser sends to the endpoint using the RESTful interface.

        @method dropActivityProfile
        @param {String|null} key Key of activity profile to delete, or null for all
        @param {Object} cfg Configuration options
            @param {Object} cfg.activity TinCan.Activity
            @param {Function} [cfg.callback] Callback to execute on completion
        */
        dropActivityProfile: function (key, cfg) {
            this.log("dropActivityProfile");
            var requestParams = {},
                requestCfg = {}
            ;

            // TODO: it would be better to make a subclass that knows
            //       its own environment and just implements the protocol
            //       that it needs to
            if (! TinCan.environment().isBrowser) {
                this.log("error: environment not implemented");
                return;
            }

            requestParams = {
                activityId: cfg.activity.id
            };
            if (key !== null) {
                requestParams.profileId = key;
            }

            requestCfg = {
                url: "activities/profile",
                method: "DELETE",
                params: requestParams
            };
            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }

            return this.sendRequest(requestCfg);
        },

        /**
        Non-environment safe method used to create a delay to give impression
        of synchronous response

        @method __delay
        @private
        */
        __delay: function () {
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
        }
    };
}());
