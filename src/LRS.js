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
@submodule TinCan.LRS
**/
(function () {
    "use strict";
    /**
    @class TinCan.LRS
    @constructor
    */
    var LRS = TinCan.LRS = function (cfg) {
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
        @property extended
        @type Object
        */
        this.extended = null;

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
            this.log("init");

            var versions = TinCan.versions(),
                versionMatch = false,
                i
            ;

            cfg = cfg || {};

            if (cfg.hasOwnProperty("alertOnRequestFailure")) {
                this.log("'alertOnRequestFailure' is deprecated (alerts have been removed) no need to set it now");
            }

            if (! cfg.hasOwnProperty("endpoint") || cfg.endpoint === null || cfg.endpoint === "") {
                this.log("[error] LRS invalid: no endpoint");
                throw {
                    code: 3,
                    mesg: "LRS invalid: no endpoint"
                };
            }

            this.endpoint = String(cfg.endpoint);
            if (this.endpoint.slice(-1) !== "/") {
                this.log("adding trailing slash to endpoint");
                this.endpoint += "/";
            }

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

            //
            // provide a hook method that environments can override
            // to handle anything necessary in the initialization
            // process that is customized to them, such as cross domain
            // setup in browsers, default implementation is empty
            //
            // this hook must run prior to version detection so that
            // request handling can be set up before requesting the
            // LRS version via the /about resource
            //
            this._initByEnvironment(cfg);

            if (typeof cfg.version !== "undefined") {
                this.log("version: " + cfg.version);
                for (i = 0; i < versions.length; i += 1) {
                    if (versions[i] === cfg.version) {
                        versionMatch = true;
                        break;
                    }
                }
                if (! versionMatch) {
                    this.log("[error] LRS invalid: version not supported (" + cfg.version + ")");
                    throw {
                        code: 5,
                        mesg: "LRS invalid: version not supported (" + cfg.version + ")"
                    };
                }
                this.version = cfg.version;
            }
            else {
                //
                // assume max supported when not specified,
                // TODO: add detection of LRS from call to endpoint
                //
                this.version = versions[0];
            }
        },

        /**
        Creates and returns a boundary for separating parts in
        requests where the statement has an attachment

        @method _getBoundary
        @private
        */
        _getBoundary: function () {
            return TinCan.Utils.getUUID().replace(/-/g, "");
        },

        /**
        Method should be overloaded by an environment to do per
        environment specifics such that the LRS can make a call
        to set the version if not provided

        @method _initByEnvironment
        @private
        */
        _initByEnvironment: function () {
            this.log("_initByEnvironment not overloaded - no environment loaded?");
        },

        /**
        Method should be overloaded by an environment to do per
        environment specifics for sending requests to the LRS

        @method _makeRequest
        @private
        */
        _makeRequest: function () {
            this.log("_makeRequest not overloaded - no environment loaded?");
        },

        /**
        Method should be overloaded by an environment to do per
        environment specifics for building multipart request data

        @method _getMultipartRequestData
        @private
        */
        _getMultipartRequestData: function () {
            this.log("_getMultipartRequestData not overloaded - no environment loaded?");
        },

        /**
        Method is overloaded by the browser environment in order to test converting an
        HTTP request that is greater than a defined length

        @method _IEModeConversion
        @private
        */
        _IEModeConversion: function () {
            this.log("_IEModeConversion not overloaded - browser environment not loaded.");
        },

        _processGetStatementResult: function (xhr, params) {
            var boundary,
                parsedResponse,
                statement,
                attachmentMap = {},
                i;

            if (! params.attachments) {
                return TinCan.Statement.fromJSON(xhr.responseText);
            }

            boundary = xhr.getResponseHeader("Content-Type").split("boundary=")[1];

            parsedResponse = this._parseMultipart(boundary, xhr.response);
            statement = JSON.parse(parsedResponse[0].body);
            for (i = 1; i < parsedResponse.length; i += 1) {
                attachmentMap[parsedResponse[i].headers["X-Experience-API-Hash"]] = parsedResponse[i].body;
            }

            this._assignAttachmentContent([statement], attachmentMap);

            return new TinCan.Statement(statement);
        },

        /**
        Method used to send a request via browser objects to the LRS

        @method sendRequest
        @param {Object} cfg Configuration for request
            @param {String} cfg.url URL portion to add to endpoint
            @param {String} [cfg.method] GET, PUT, POST, etc.
            @param {Object} [cfg.params] Parameters to set on the querystring
            @param {String|ArrayBuffer} [cfg.data] Body content as a String or ArrayBuffer
            @param {Object} [cfg.headers] Additional headers to set in the request
            @param {Function} [cfg.callback] Function to run at completion
                @param {String|Null} cfg.callback.err If an error occurred, this parameter will contain the HTTP status code.
                    If the operation succeeded, err will be null.
                @param {Object} cfg.callback.xhr XHR object
            @param {Boolean} [cfg.ignore404] Whether 404 status codes should be considered an error
            @param {Boolean} [cfg.expectMultipart] Whether to expect the response to be a multipart response
        @return {Object} XHR if called in a synchronous way (in other words no callback)
        */
        sendRequest: function (cfg) {
            this.log("sendRequest");
            var fullUrl = this.endpoint + cfg.url,
                headers = {},
                prop
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
            headers.Authorization = this.auth;
            if (this.version !== "0.9") {
                headers["X-Experience-API-Version"] = this.version;
            }

            for (prop in cfg.headers) {
                if (cfg.headers.hasOwnProperty(prop)) {
                    headers[prop] = cfg.headers[prop];
                }
            }

            return this._makeRequest(fullUrl, headers, cfg);
        },

        /**
        Method used to determine the LRS version

        @method about
        @param {Object} cfg Configuration object for the about request
            @param {Function} [cfg.callback] Callback to execute upon receiving a response
            @param {Object} [cfg.params] this is needed, but can be empty
        @return {Object} About which holds the version, or asyncrhonously calls a specified callback
        */
        about: function (cfg) {
            this.log("about");
            var requestCfg,
                requestResult,
                callbackWrapper;

            cfg = cfg || {};

            requestCfg = {
                url: "about",
                method: "GET",
                params: {}
            };
            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (err, xhr) {
                    var result = xhr;

                    if (err === null) {
                        result = TinCan.About.fromJSON(xhr.responseText);
                    }

                    cfg.callback(err, result);
                };
                requestCfg.callback = callbackWrapper;
            }

            requestResult = this.sendRequest(requestCfg);

            if (callbackWrapper) {
                return;
            }

            if (requestResult.err === null) {
                requestResult.xhr = TinCan.About.fromJSON(requestResult.xhr.responseText);
            }
            return requestResult;
        },

        /**
        Save a statement, when used from a browser sends to the endpoint using the RESTful interface.
        Use a callback to make the call asynchronous.

        @method saveStatement
        @param {TinCan.Statement} statement to send
        @param {Object} [cfg] Configuration used when saving
            @param {Function} [cfg.callback] Callback to execute on completion
        */
        saveStatement: function (stmt, cfg) {
            this.log("saveStatement");
            var requestCfg = {
                    url: "statements",
                    headers: {}
                },
                versionedStatement,
                requestAttachments = [],
                boundary,
                i;

            cfg = cfg || {};

            try {
                versionedStatement = stmt.asVersion( this.version );
            }
            catch (ex) {
                if (this.allowFail) {
                    this.log("[warning] statement could not be serialized in version (" + this.version + "): " + ex);
                    if (typeof cfg.callback !== "undefined") {
                        cfg.callback(null, null);
                        return;
                    }
                    return {
                        err: null,
                        xhr: null
                    };
                }

                this.log("[error] statement could not be serialized in version (" + this.version + "): " + ex);
                if (typeof cfg.callback !== "undefined") {
                    cfg.callback(ex, null);
                    return;
                }
                return {
                    err: ex,
                    xhr: null
                };
            }

            if (versionedStatement.hasOwnProperty("attachments") && stmt.hasAttachmentWithContent()) {
                boundary = this._getBoundary();

                requestCfg.headers["Content-Type"] = "multipart/mixed; boundary=" + boundary;

                for (i = 0; i < stmt.attachments.length; i += 1) {
                    if (stmt.attachments[i].content !== null) {
                        requestAttachments.push(stmt.attachments[i]);
                    }
                }

                try {
                    requestCfg.data = this._getMultipartRequestData(boundary, versionedStatement, requestAttachments);
                }
                catch (ex) {
                    if (this.allowFail) {
                        this.log("[warning] multipart request data could not be created (attachments probably not supported): " + ex);
                        if (typeof cfg.callback !== "undefined") {
                            cfg.callback(null, null);
                            return;
                        }
                        return {
                            err: null,
                            xhr: null
                        };
                    }

                    this.log("[error] multipart request data could not be created (attachments probably not supported): " + ex);
                    if (typeof cfg.callback !== "undefined") {
                        cfg.callback(ex, null);
                        return;
                    }
                    return {
                        err: ex,
                        xhr: null
                    };
                }
            }
            else {
                requestCfg.headers["Content-Type"] = "application/json";
                requestCfg.data = JSON.stringify(versionedStatement);
            }
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
            @param {Object} [cfg.params] Query parameters
                @param {Boolean} [cfg.params.attachments] Include attachments in multipart response or don't (default: false)
            @param {Function} [cfg.callback] Callback to execute on completion
        @return {TinCan.Statement} Statement retrieved
        */
        retrieveStatement: function (stmtId, cfg) {
            this.log("retrieveStatement");
            var requestCfg,
                requestResult,
                callbackWrapper,
                lrs = this;

            cfg = cfg || {};
            cfg.params = cfg.params || {};

            requestCfg = {
                url: "statements",
                method: "GET",
                params: {
                    statementId: stmtId
                }
            };
            if (cfg.params.attachments) {
                requestCfg.params.attachments = true;
                requestCfg.expectMultipart = true;
            }
            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (err, xhr) {
                    var result = xhr;

                    if (err === null) {
                        result = lrs._processGetStatementResult(xhr, cfg.params);
                    }

                    cfg.callback(err, result);
                };
                requestCfg.callback = callbackWrapper;
            }

            requestResult = this.sendRequest(requestCfg);
            if (! callbackWrapper) {
                requestResult.statement = null;
                if (requestResult.err === null) {
                    requestResult.statement = lrs._processGetStatementResult(requestResult.xhr, cfg.params);
                }
            }

            return requestResult;
        },

        /**
        Retrieve a voided statement, when used from a browser sends to the endpoint using the RESTful interface.

        @method retrieveVoidedStatement
        @param {String} ID of voided statement to retrieve
        @param {Object} [cfg] Configuration options
            @param {Object} [cfg.params] Query parameters
                @param {Boolean} [cfg.params.attachments] Include attachments in multipart response or don't (default: false)
            @param {Function} [cfg.callback] Callback to execute on completion
        @return {TinCan.Statement} Statement retrieved
        */
        retrieveVoidedStatement: function (stmtId, cfg) {
            this.log("retrieveVoidedStatement");
            var requestCfg,
                requestResult,
                callbackWrapper,
                lrs = this;

            cfg = cfg || {};
            cfg.params = cfg.params || {};

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
                if (cfg.params.attachments) {
                    requestCfg.params.attachments = true;
                    requestCfg.expectMultipart = true;
                }
            }

            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (err, xhr) {
                    var result = xhr;

                    if (err === null) {
                        result = lrs._processGetStatementResult(xhr, cfg.params);
                    }

                    cfg.callback(err, result);
                };
                requestCfg.callback = callbackWrapper;
            }

            requestResult = this.sendRequest(requestCfg);
            if (! callbackWrapper) {
                requestResult.statement = null;
                if (requestResult.err === null) {
                    requestResult.statement = lrs._processGetStatementResult(requestResult.xhr, cfg.params);
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
            var requestCfg = {
                    url: "statements",
                    method: "POST",
                    headers: {}
                },
                versionedStatement,
                versionedStatements = [],
                requestAttachments = [],
                boundary,
                i,
                j;

            cfg = cfg || {};

            if (stmts.length === 0) {
                if (typeof cfg.callback !== "undefined") {
                    cfg.callback(new Error("no statements"), null);
                    return;
                }
                return {
                    err: new Error("no statements"),
                    xhr: null
                };
            }

            for (i = 0; i < stmts.length; i += 1) {
                try {
                    versionedStatement = stmts[i].asVersion( this.version );
                }
                catch (ex) {
                    if (this.allowFail) {
                        this.log("[warning] statement could not be serialized in version (" + this.version + "): " + ex);
                        if (typeof cfg.callback !== "undefined") {
                            cfg.callback(null, null);
                            return;
                        }
                        return {
                            err: null,
                            xhr: null
                        };
                    }

                    this.log("[error] statement could not be serialized in version (" + this.version + "): " + ex);
                    if (typeof cfg.callback !== "undefined") {
                        cfg.callback(ex, null);
                        return;
                    }
                    return {
                        err: ex,
                        xhr: null
                    };
                }

                if (stmts[i].hasAttachmentWithContent()) {
                    for (j = 0; j < stmts[i].attachments.length; j += 1) {
                        if (stmts[i].attachments[j].content !== null) {
                            requestAttachments.push(stmts[i].attachments[j]);
                        }
                    }
                }

                versionedStatements.push(versionedStatement);
            }

            if (requestAttachments.length !== 0) {
                boundary = this._getBoundary();

                requestCfg.headers["Content-Type"] = "multipart/mixed; boundary=" + boundary;

                try {
                    requestCfg.data = this._getMultipartRequestData(boundary, versionedStatements, requestAttachments);
                }
                catch (ex) {
                    if (this.allowFail) {
                        this.log("[warning] multipart request data could not be created (attachments probably not supported): " + ex);
                        if (typeof cfg.callback !== "undefined") {
                            cfg.callback(null, null);
                            return;
                        }
                        return {
                            err: null,
                            xhr: null
                        };
                    }

                    this.log("[error] multipart request data could not be created (attachments probably not supported): " + ex);
                    if (typeof cfg.callback !== "undefined") {
                        cfg.callback(ex, null);
                        return;
                    }
                    return {
                        err: ex,
                        xhr: null
                    };
                }
            }
            else {
                requestCfg.headers["Content-Type"] = "application/json";
                requestCfg.data = JSON.stringify(versionedStatements);
            }

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
                @param {TinCan.Verb|String} [cfg.params.verb] Verb (or verb ID) to query on
                @param {TinCan.Activity|String} [cfg.params.activity] Activity (or activity ID) to query on
                @param {String} [cfg.params.registration] Registration UUID
                @param {Boolean} [cfg.params.related_activities] Match related activities
                @param {Boolean} [cfg.params.related_agents] Match related agents
                @param {String} [cfg.params.since] Match statements stored since specified timestamp
                @param {String} [cfg.params.until] Match statements stored at or before specified timestamp
                @param {Integer} [cfg.params.limit] Number of results to retrieve
                @param {String} [cfg.params.format] One of "ids", "exact", "canonical" (default: "exact")
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
                callbackWrapper,
                lrs = this;

            cfg = cfg || {};
            cfg.params = cfg.params || {};

            //
            // if they misconfigured (possibly due to version mismatches) the
            // query then don't try to send a request at all, rather than give
            // them invalid results
            //
            try {
                requestCfg = this._queryStatementsRequestCfg(cfg);

                if (cfg.params.attachments) {
                    requestCfg.expectMultipart = true;
                }
            }
            catch (ex) {
                this.log("[error] Query statements failed - " + ex);
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
                    var result = xhr,
                        parsedResponse,
                        boundary,
                        statements,
                        attachmentMap = {},
                        i;

                    if (err === null) {
                        if (! cfg.params.attachments) {
                            result = TinCan.StatementsResult.fromJSON(xhr.responseText);
                        }
                        else {
                            boundary = xhr.getResponseHeader("Content-Type").split("boundary=")[1];

                            parsedResponse = lrs._parseMultipart(boundary, xhr.response);
                            statements = JSON.parse(parsedResponse[0].body);
                            for (i = 1; i < parsedResponse.length; i += 1) {
                                attachmentMap[parsedResponse[i].headers["X-Experience-API-Hash"]] = parsedResponse[i].body;
                            }

                            lrs._assignAttachmentContent(statements.statements, attachmentMap);
                            result = new TinCan.StatementsResult({ statements: statements.statements });

                            for (i = 0; i < result.statements.length; i += 1) {
                                if (! (result.statements[i] instanceof TinCan.Statement)) {
                                    result.statements[i] = new TinCan.Statement(result.statements[i]);
                                }
                            }
                        }
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
            compatibility["1.0.1"] = compatibility["1.0.0"];
            compatibility["1.0.2"] = compatibility["1.0.0"];

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
                    if (typeof cfg.params[idProps[i]].id === "undefined") {
                        params[idProps[i]] = cfg.params[idProps[i]];
                    }
                    else {
                        params[idProps[i]] = cfg.params[idProps[i]].id;
                    }
                }
            }

            for (i = 0; i < valProps.length; i += 1) {
                if (typeof cfg.params[valProps[i]] !== "undefined" && cfg.params[valProps[i]] !== null) {
                    params[valProps[i]] = cfg.params[valProps[i]];
                }
            }

            return returnCfg;
        },

        /**
        Assigns attachment content to the correct attachment to create a StatementsResult object that is sent
        to the callback of queryStatements()

        @method _assignAttachmentContent
        @private
        @param {Array} [stmts] Array of TinCan.Statement JSON objects
        @param {Object} [attachmentMap] Map of the content to place into its attachment
        @return {Array} Array of TinCan.Statement JSON objects with correctly assigned attachment content
        */
        _assignAttachmentContent: function (stmts, attachmentMap) {
            var i,
                j;

            for (i = 0; i < stmts.length; i += 1) {
                if (stmts[i].hasOwnProperty("attachments") && stmts[i].attachments !== null) {
                    for (j = 0; j < stmts[i].attachments.length; j += 1) {
                        if (attachmentMap.hasOwnProperty(stmts[i].attachments[j].sha2)) {
                            stmts[i].attachments[j].content = attachmentMap[stmts[i].attachments[j].sha2];
                        }
                    }
                }
            }
        },

        /**
        Parses the different sections of a multipart/mixed response

        @method _parseMultipart
        @private
        @param {String} [boundary] Boundary used to mark off the sections of the response
        @param {ArrayBuffer} [response] Body of the response
        @return {Array} Array of objects containing the parsed headers and body of each part
        */
        _parseMultipart: function (boundary, response) {
            /* global Uint8Array */
            var __boundary = "--" + boundary,
                byteArray,
                bodyEncodedInString,
                fullBodyEnd,
                sliceStart,
                sliceEnd,
                headerStart,
                headerEnd,
                bodyStart,
                bodyEnd,
                headers,
                body,
                parts = [],
                CRLF = 2;

            //
            // treating the reponse as a stream of bytes and assuming that headers
            // and related mime boundaries are all US-ASCII (which is a safe assumption)
            // allows us to treat the whole response as a string when looking for offsets
            // but then slice on the raw array buffer
            //
            byteArray = new Uint8Array(response);
            bodyEncodedInString = this.__uint8ToString(byteArray);

            fullBodyEnd = bodyEncodedInString.indexOf(__boundary + "--");

            sliceStart = bodyEncodedInString.indexOf(__boundary);
            while (sliceStart !== -1) {
                sliceEnd = bodyEncodedInString.indexOf(__boundary, sliceStart + __boundary.length);

                headerStart = sliceStart + __boundary.length + CRLF;
                headerEnd = bodyEncodedInString.indexOf("\r\n\r\n", sliceStart);
                bodyStart = headerEnd + CRLF + CRLF;
                bodyEnd = sliceEnd - 2;

                headers = this._parseHeaders(
                    this.__uint8ToString(
                        new Uint8Array( response.slice(headerStart, headerEnd) )
                    )
                );
                body = response.slice(bodyStart, bodyEnd);

                //
                // we know the first slice is the statement, and we know it is a string in UTF-8 (spec requirement)
                //
                if (parts.length === 0) {
                    body = TinCan.Utils.stringFromArrayBuffer(body);
                }

                parts.push(
                    {
                        headers: headers,
                        body: body
                    }
                );

                if (sliceEnd === fullBodyEnd) {
                    sliceStart = -1;
                }
                else {
                    sliceStart = sliceEnd;
                }
            }

            return parts;
        },

        //
        // implemented as a function to avoid 'RangeError: Maximum call stack size exceeded'
        // when calling .fromCharCode on the full byteArray which results in a too long
        // argument list for large arrays
        //
        __uint8ToString: function (byteArray) {
            var result = "",
                len = byteArray.byteLength,
                i;

            for (i = 0; i < len; i += 1) {
                result += String.fromCharCode(byteArray[i]);
            }
            return result;
        },

        /**
        Parses the headers of a multipart/mixed response section

        @method _parseHeaders
        @private
        @param {String} [rawHeaders] String containing all the headers
        @return {Object} Map of the headers
        */
        _parseHeaders: function (rawHeaders) {
            var headers = {},
                headerList,
                key,
                h,
                i;

            headerList = rawHeaders.split("\n");
            for (i = 0; i < headerList.length; i += 1) {
                h = headerList[i].split(":", 2);

                if (h[1] !== null) {
                    headers[h[0]] = h[1].replace(/^\s+|\s+$/g, "");

                    key = h[0];
                }
                else {
                    if (h[0].substring(0, 1) === "\t") {
                        headers[h[0]] = h[1].replace(/^\s+|\s+$/g, "");
                    }
                }
            }

            return headers;
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

            cfg = cfg || {};

            // to support our interface (to support IE) we need to break apart
            // the more URL query params so that the request can be made properly later
            parsedURL = TinCan.Utils.parseURL(cfg.url, { allowRelative: true });

            // Respect a more URL that is relative to either the server root
            // or endpoint (though only the former is allowed in the spec)
            serverRoot = TinCan.Utils.getServerRoot(this.endpoint);
            if (parsedURL.path.indexOf("/statements") === 0){
                parsedURL.path = this.endpoint.replace(serverRoot, "") + parsedURL.path;
                this.log("converting non-standard more URL to " + parsedURL.path);
            }

            // The more relative URL might not start with a slash, add it if not
            if (parsedURL.path.indexOf("/") !== 0) {
                parsedURL.path = "/" + parsedURL.path;
            }

            requestCfg = {
                method: "GET",
                // For arbitrary more URLs to work, we need to make the URL absolute here
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
            @param {TinCan.Activity} cfg.activity Activity in document identifier
            @param {TinCan.Agent} cfg.agent Agent in document identifier
            @param {String} [cfg.registration] Registration
            @param {Function} [cfg.callback] Callback to execute on completion
                @param {Object|Null} cfg.callback.error
                @param {TinCan.State|null} cfg.callback.result null if state is 404
            @param {Object} [cfg.requestHeaders] Object containing additional headers to add to request
        @return {TinCan.State|Object} TinCan.State retrieved when synchronous, or result from sendRequest
        */
        retrieveState: function (key, cfg) {
            this.log("retrieveState");
            var requestParams = {},
                requestCfg = {},
                requestResult,
                callbackWrapper,
                requestHeaders,
                self = this;

            requestHeaders = cfg.requestHeaders || {};

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
            if ((typeof cfg.registration !== "undefined") && (cfg.registration !== null)) {
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
                ignore404: true,
                headers: requestHeaders
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
                            }
                            else {
                                //
                                // either XHR didn't have getResponseHeader (probably cause it is an IE
                                // XDomainRequest object which doesn't) or not populated by LRS so create
                                // the hash ourselves
                                //
                                // the LRS is responsible for quoting the Etag value so we need to mimic
                                // that behavior here as well
                                //
                                result.etag = "\"" + TinCan.Utils.getSHA1String(xhr.responseText) + "\"";
                            }

                            if (typeof xhr.contentType !== "undefined") {
                                // most likely an XDomainRequest which has .contentType,
                                // for the ones that it supports
                                result.contentType = xhr.contentType;
                            }
                            else if (typeof xhr.getResponseHeader !== "undefined" && xhr.getResponseHeader("Content-Type") !== null && xhr.getResponseHeader("Content-Type") !== "") {
                                result.contentType = xhr.getResponseHeader("Content-Type");
                            }

                            if (TinCan.Utils.isApplicationJSON(result.contentType)) {
                                try {
                                    result.contents = JSON.parse(result.contents);
                                } catch (ex) {
                                    self.log("retrieveState - failed to deserialize JSON: " + ex);
                                }
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
                    }
                    else {
                        //
                        // either XHR didn't have getResponseHeader (probably cause it is an IE
                        // XDomainRequest object which doesn't) or not populated by LRS so create
                        // the hash ourselves
                        //
                        // the LRS is responsible for quoting the Etag value so we need to mimic
                        // that behavior here as well
                        //
                        requestResult.state.etag = "\"" + TinCan.Utils.getSHA1String(requestResult.xhr.responseText) + "\"";
                    }
                    if (typeof requestResult.xhr.contentType !== "undefined") {
                        // most likely an XDomainRequest which has .contentType
                        // for the ones that it supports
                        requestResult.state.contentType = requestResult.xhr.contentType;
                    }
                    else if (typeof requestResult.xhr.getResponseHeader !== "undefined" && requestResult.xhr.getResponseHeader("Content-Type") !== null && requestResult.xhr.getResponseHeader("Content-Type") !== "") {
                        requestResult.state.contentType = requestResult.xhr.getResponseHeader("Content-Type");
                    }
                    if (TinCan.Utils.isApplicationJSON(requestResult.state.contentType)) {
                        try {
                            requestResult.state.contents = JSON.parse(requestResult.state.contents);
                        } catch (ex) {
                            this.log("retrieveState - failed to deserialize JSON: " + ex);
                        }
                    }
                }
            }

            return requestResult;
        },

        /**
        Retrieve the list of IDs for a state, when used from a browser sends to the endpoint using the RESTful interface.

        @method retrieveStateIds
        @param {Object} cfg Configuration options
            @param {TinCan.Activity} cfg.activity Activity in document identifier
            @param {TinCan.Agent} cfg.agent Agent in document identifier
            @param {String} [cfg.registration] Registration
            @param {Function} [cfg.callback] Callback to execute on completion
            @param {String} [cfg.since] Match activity profiles saved since given timestamp
            @param {Object} [cfg.requestHeaders] Optional object containing additional headers to add to request
        @return {Object} requestResult Request result
        */
        retrieveStateIds: function (cfg) {
            this.log("retrieveStateIds");
            var requestParams = {},
                requestCfg,
                requestHeaders,
                requestResult,
                callbackWrapper;

            cfg = cfg || {};
            requestHeaders = cfg.requestHeaders || {};

            requestParams.activityId = cfg.activity.id;
            if (this.version === "0.9") {
                requestParams.actor = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            else {
                requestParams.agent = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            if ((typeof cfg.registration !== "undefined") && (cfg.registration !== null)) {
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
                headers: requestHeaders,
                ignore404: true
            };
            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (err, xhr) {
                    var result = xhr;

                    if (err !== null) {
                        cfg.callback(err, result);
                        return;
                    }

                    if (xhr.status === 404) {
                        result = [];
                    }
                    else {
                        try {
                            result = JSON.parse(xhr.responseText);
                        }
                        catch (ex) {
                            err = "Response JSON parse error: " + ex;
                        }
                    }

                    cfg.callback(err, result);
                };
                requestCfg.callback = callbackWrapper;
            }
            if (typeof cfg.since !== "undefined") {
                requestCfg.params.since = cfg.since;
            }

            requestResult = this.sendRequest(requestCfg);
            if (! callbackWrapper) {
                requestResult.profileIds = null;
                if (requestResult.err !== null) {
                    return requestResult;
                }

                if (requestResult.xhr.status === 404) {
                    requestResult.profileIds = [];
                }
                else {
                    try {
                        requestResult.profileIds = JSON.parse(requestResult.xhr.responseText);
                    }
                    catch (ex) {
                        requestResult.err = "retrieveStateIds - JSON parse error: " + ex;
                    }
                }
            }
            return requestResult;
        },

        /**
        Save a state value, when used from a browser sends to the endpoint using the RESTful interface.

        @method saveState
        @param {String} key Key of state to save
        @param val Value to be stored
        @param {Object} cfg Configuration options
            @param {TinCan.Activity} cfg.activity Activity in document identifier
            @param {TinCan.Agent} cfg.agent Agent in document identifier
            @param {String} [cfg.registration] Registration
            @param {String} [cfg.lastSHA1] SHA1 of the previously seen existing state
            @param {String} [cfg.contentType] Content-Type to specify in headers (defaults to 'application/octet-stream')
            @param {String} [cfg.method] Method to use. Default: PUT
            @param {Function} [cfg.callback] Callback to execute on completion
            @param {Object} [cfg.requestHeaders] Optional object containing additional headers to add to request
        */
        saveState: function (key, val, cfg) {
            this.log("saveState");
            var requestParams,
                requestCfg,
                requestHeaders;

            requestHeaders = cfg.requestHeaders || {};

            if (typeof cfg.contentType === "undefined") {
                cfg.contentType = "application/octet-stream";
            }
            requestHeaders["Content-Type"] = cfg.contentType;

            if (typeof val === "object" && TinCan.Utils.isApplicationJSON(cfg.contentType)) {
                val = JSON.stringify(val);
            }

            if (typeof cfg.method === "undefined" || cfg.method !== "POST") {
                cfg.method = "PUT";
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
            if ((typeof cfg.registration !== "undefined") && (cfg.registration !== null)) {
                if (this.version === "0.9") {
                    requestParams.registrationId = cfg.registration;
                }
                else {
                    requestParams.registration = cfg.registration;
                }
            }

            requestCfg = {
                url: "activities/state",
                method: cfg.method,
                params: requestParams,
                data: val,
                headers: requestHeaders
            };

            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }
            if (typeof cfg.lastSHA1 !== "undefined" && cfg.lastSHA1 !== null) {
                requestCfg.headers["If-Match"] = cfg.lastSHA1;
            }

            return this.sendRequest(requestCfg);
        },

        /**
        Drop a state value or all of the state, when used from a browser sends to the endpoint using the RESTful interface.

        @method dropState
        @param {String|null} key Key of state to delete, or null for all
        @param {Object} cfg Configuration options
            @param {TinCan.Activity} cfg.activity Activity in document identifier
            @param {TinCan.Agent} cfg.agent Agent in document identifier
            @param {String} [cfg.registration] Registration
            @param {Function} [cfg.callback] Callback to execute on completion
            @param {Object} [cfg.requestHeaders] Optional object containing additional headers to add to request
        */
        dropState: function (key, cfg) {
            this.log("dropState");
            var requestParams,
                requestCfg,
                requestHeaders;

            requestHeaders = cfg.requestHeaders || {};

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
            if ((typeof cfg.registration !== "undefined") && (cfg.registration !== null)) {
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
                params: requestParams,
                headers: requestHeaders
            };

            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }

            return this.sendRequest(requestCfg);
        },

        /**
        Retrieve an activity, when used from a browser sends to the endpoint using the RESTful interface.

        @method retrieveActivity
        @param {String} activityId id of the Activity to retrieve
        @param {Object} cfg Configuration options
            @param {Function} [cfg.callback] Callback to execute on completion
            @param {Object} [cfg.requestHeaders] Optional object containing additional headers to add to request
        @return {Object} Value retrieved
        */
        retrieveActivity: function (activityId, cfg) {
            this.log("retrieveActivity");
            var requestCfg = {},
                requestResult,
                callbackWrapper,
                requestHeaders;

            requestHeaders = cfg.requestHeaders || {};

            requestCfg = {
                url: "activities",
                method: "GET",
                params: {
                    activityId: activityId
                },
                ignore404: true,
                headers: requestHeaders
            };

            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (err, xhr) {
                    var result = xhr;

                    if (err === null) {
                        //
                        // a 404 really shouldn't happen because the LRS can dynamically
                        // build the response based on what has been passed to it, but
                        // don't have the client fail in the condition that it does, because
                        // we can do the same thing
                        //
                        if (xhr.status === 404) {
                            result = new TinCan.Activity(
                                {
                                    id: activityId
                                }
                            );
                        }
                        else {
                            result = TinCan.Activity.fromJSON(xhr.responseText);
                        }
                    }

                    cfg.callback(err, result);
                };
                requestCfg.callback = callbackWrapper;
            }

            requestResult = this.sendRequest(requestCfg);
            if (! callbackWrapper) {
                requestResult.activity = null;
                if (requestResult.err === null) {
                    if (requestResult.xhr.status === 404) {
                        requestResult.activity = new TinCan.Activity(
                            {
                                id: activityId
                            }
                        );
                    }
                    else {
                        requestResult.activity = TinCan.Activity.fromJSON(requestResult.xhr.responseText);
                    }
                }
            }

            return requestResult;
        },

        /**
        Retrieve an activity profile value, when used from a browser sends to the endpoint using the RESTful interface.

        @method retrieveActivityProfile
        @param {String} key Key of activity profile to retrieve
        @param {Object} cfg Configuration options
            @param {TinCan.Activity} cfg.activity Activity in document identifier
            @param {Function} [cfg.callback] Callback to execute on completion
            @param {Object} [cfg.requestHeaders] Optional object containing additional headers to add to request
        @return {Object} Value retrieved
        */
        retrieveActivityProfile: function (key, cfg) {
            this.log("retrieveActivityProfile");
            var requestCfg = {},
                requestResult,
                callbackWrapper,
                requestHeaders,
                self = this;

            requestHeaders = cfg.requestHeaders || {};

            requestCfg = {
                url: "activities/profile",
                method: "GET",
                params: {
                    profileId: key,
                    activityId: cfg.activity.id
                },
                ignore404: true,
                headers: requestHeaders
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
                            }
                            else {
                                //
                                // either XHR didn't have getResponseHeader (probably cause it is an IE
                                // XDomainRequest object which doesn't) or not populated by LRS so create
                                // the hash ourselves
                                //
                                // the LRS is responsible for quoting the Etag value so we need to mimic
                                // that behavior here as well
                                //
                                result.etag = "\"" + TinCan.Utils.getSHA1String(xhr.responseText) + "\"";
                            }
                            if (typeof xhr.contentType !== "undefined") {
                                // most likely an XDomainRequest which has .contentType
                                // for the ones that it supports
                                result.contentType = xhr.contentType;
                            }
                            else if (typeof xhr.getResponseHeader !== "undefined" && xhr.getResponseHeader("Content-Type") !== null && xhr.getResponseHeader("Content-Type") !== "") {
                                result.contentType = xhr.getResponseHeader("Content-Type");
                            }
                            if (TinCan.Utils.isApplicationJSON(result.contentType)) {
                                try {
                                    result.contents = JSON.parse(result.contents);
                                } catch (ex) {
                                    self.log("retrieveActivityProfile - failed to deserialize JSON: " + ex);
                                }
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
                    }
                    else {
                        //
                        // either XHR didn't have getResponseHeader (probably cause it is an IE
                        // XDomainRequest object which doesn't) or not populated by LRS so create
                        // the hash ourselves
                        //
                        // the LRS is responsible for quoting the Etag value so we need to mimic
                        // that behavior here as well
                        //
                        requestResult.profile.etag = "\"" + TinCan.Utils.getSHA1String(requestResult.xhr.responseText) + "\"";
                    }
                    if (typeof requestResult.xhr.contentType !== "undefined") {
                        // most likely an XDomainRequest which has .contentType
                        // for the ones that it supports
                        requestResult.profile.contentType = requestResult.xhr.contentType;
                    }
                    else if (typeof requestResult.xhr.getResponseHeader !== "undefined" && requestResult.xhr.getResponseHeader("Content-Type") !== null && requestResult.xhr.getResponseHeader("Content-Type") !== "") {
                        requestResult.profile.contentType = requestResult.xhr.getResponseHeader("Content-Type");
                    }
                    if (TinCan.Utils.isApplicationJSON(requestResult.profile.contentType)) {
                        try {
                            requestResult.profile.contents = JSON.parse(requestResult.profile.contents);
                        } catch (ex) {
                            this.log("retrieveActivityProfile - failed to deserialize JSON: " + ex);
                        }
                    }
                }
            }

            return requestResult;
        },

        /**
        Retrieve the list of IDs for an activity profile, when used from a browser sends to the endpoint using the RESTful interface.

        @method retrieveActivityProfileIds
        @param {Object} cfg Configuration options
            @param {TinCan.Activity} cfg.activity Activity in document identifier
            @param {Function} [cfg.callback] Callback to execute on completion
            @param {String} [cfg.since] Match activity profiles saved since given timestamp
            @param {Object} [cfg.requestHeaders] Optional object containing additional headers to add to request
        @return {Array} List of ids for this Activity profile
        */
        retrieveActivityProfileIds: function (cfg) {
            this.log("retrieveActivityProfileIds");
            var requestCfg,
                requestHeaders,
                requestResult,
                callbackWrapper;

            cfg = cfg || {};
            requestHeaders = cfg.requestHeaders || {};

            requestCfg = {
                url: "activities/profile",
                method: "GET",
                params: {
                    activityId: cfg.activity.id
                },
                headers: requestHeaders,
                ignore404: true
            };
            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (err, xhr) {
                    var result = xhr;

                    if (err !== null) {
                        cfg.callback(err, result);
                        return;
                    }

                    if (xhr.status === 404) {
                        result = [];
                    }
                    else {
                        try {
                            result = JSON.parse(xhr.responseText);
                        }
                        catch (ex) {
                            err = "Response JSON parse error: " + ex;
                        }
                    }

                    cfg.callback(err, result);
                };
                requestCfg.callback = callbackWrapper;
            }
            if (typeof cfg.since !== "undefined") {
                requestCfg.params.since = cfg.since;
            }

            requestResult = this.sendRequest(requestCfg);
            if (! callbackWrapper) {
                requestResult.profileIds = null;
                if (requestResult.err !== null) {
                    return requestResult;
                }

                if (requestResult.xhr.status === 404) {
                    requestResult.profileIds = [];
                }
                else {
                    try {
                        requestResult.profileIds = JSON.parse(requestResult.xhr.responseText);
                    }
                    catch (ex) {
                        requestResult.err = "retrieveActivityProfileIds - JSON parse error: " + ex;
                    }
                }
            }
            return requestResult;
        },

        /**
        Save an activity profile value, when used from a browser sends to the endpoint using the RESTful interface.

        @method saveActivityProfile
        @param {String} key Key of activity profile to retrieve
        @param val Value to be stored
        @param {Object} cfg Configuration options
            @param {TinCan.Activity} cfg.activity Activity in document identifier
            @param {String} [cfg.lastSHA1] SHA1 of the previously seen existing profile
            @param {String} [cfg.contentType] Content-Type to specify in headers (defaults to 'application/octet-stream')
            @param {String} [cfg.method] Method to use. Default: PUT
            @param {Function} [cfg.callback] Callback to execute on completion
            @param {Object} [cfg.requestHeaders] Optional object containing additional headers to add to request
        */
        saveActivityProfile: function (key, val, cfg) {
            this.log("saveActivityProfile");
            var requestCfg,
                requestHeaders;

            requestHeaders = cfg.requestHeaders || {};

            if (typeof cfg.contentType === "undefined") {
                cfg.contentType = "application/octet-stream";
            }
            requestHeaders["Content-Type"] = cfg.contentType;

            if (typeof cfg.method === "undefined" || cfg.method !== "POST") {
                cfg.method = "PUT";
            }

            if (typeof val === "object" && TinCan.Utils.isApplicationJSON(cfg.contentType)) {
                val = JSON.stringify(val);
            }

            requestCfg = {
                url: "activities/profile",
                method: cfg.method,
                params: {
                    profileId: key,
                    activityId: cfg.activity.id
                },
                data: val,
                headers: requestHeaders
            };

            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }
            if (typeof cfg.lastSHA1 !== "undefined" && cfg.lastSHA1 !== null) {
                requestCfg.headers["If-Match"] = cfg.lastSHA1;
            }
            else {
                requestCfg.headers["If-None-Match"] = "*";
            }

            return this.sendRequest(requestCfg);
        },

        /**
        Drop an activity profile value, when used from a browser sends to the endpoint using the RESTful interface. Full activity profile
        delete is not supported by the spec.

        @method dropActivityProfile
        @param {String|null} key Key of activity profile to delete
        @param {Object} cfg Configuration options
            @param {TinCan.Activity} cfg.activity Activity in document identifier
            @param {Function} [cfg.callback] Callback to execute on completion
            @param {Object} [cfg.requestHeaders] Optional object containing additional headers to add to request
        */
        dropActivityProfile: function (key, cfg) {
            this.log("dropActivityProfile");
            var requestParams,
                requestCfg,
                requestHeaders;

            requestHeaders = cfg.requestHeaders || {};

            requestParams = {
                profileId: key,
                activityId: cfg.activity.id
            };

            requestCfg = {
                url: "activities/profile",
                method: "DELETE",
                params: requestParams,
                headers: requestHeaders
            };

            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }

            return this.sendRequest(requestCfg);
        },

        /**
        Retrieve an agent profile value, when used from a browser sends to the endpoint using the RESTful interface.

        @method retrieveAgentProfile
        @param {String} key Key of agent profile to retrieve
        @param {Object} cfg Configuration options
            @param {TinCan.Agent} cfg.agent Agent in document identifier
            @param {Function} [cfg.callback] Callback to execute on completion
            @param {Object} [cfg.requestHeaders] Optional object containing additional headers to add to request
        @return {Object} Value retrieved
        */
        retrieveAgentProfile: function (key, cfg) {
            this.log("retrieveAgentProfile");
            var requestCfg = {},
                requestResult,
                callbackWrapper,
                requestHeaders,
                self = this;

            requestHeaders = cfg.requestHeaders || {};

            requestCfg = {
                method: "GET",
                params: {
                    profileId: key
                },
                ignore404: true,
                headers: requestHeaders
            };

            if (this.version === "0.9") {
                requestCfg.url = "actors/profile";
                requestCfg.params.actor = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            else {
                requestCfg.url = "agents/profile";
                requestCfg.params.agent = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (err, xhr) {
                    var result = xhr;

                    if (err === null) {
                        if (xhr.status === 404) {
                            result = null;
                        }
                        else {
                            result = new TinCan.AgentProfile(
                                {
                                    id: key,
                                    agent: cfg.agent,
                                    contents: xhr.responseText
                                }
                            );
                            if (typeof xhr.getResponseHeader !== "undefined" && xhr.getResponseHeader("ETag") !== null && xhr.getResponseHeader("ETag") !== "") {
                                result.etag = xhr.getResponseHeader("ETag");
                            }
                            else {
                                //
                                // either XHR didn't have getResponseHeader (probably cause it is an IE
                                // XDomainRequest object which doesn't) or not populated by LRS so create
                                // the hash ourselves
                                //
                                // the LRS is responsible for quoting the Etag value so we need to mimic
                                // that behavior here as well
                                //
                                result.etag = "\"" + TinCan.Utils.getSHA1String(xhr.responseText) + "\"";
                            }
                            if (typeof xhr.contentType !== "undefined") {
                                // most likely an XDomainRequest which has .contentType
                                // for the ones that it supports
                                result.contentType = xhr.contentType;
                            }
                            else if (typeof xhr.getResponseHeader !== "undefined" && xhr.getResponseHeader("Content-Type") !== null && xhr.getResponseHeader("Content-Type") !== "") {
                                result.contentType = xhr.getResponseHeader("Content-Type");
                            }
                            if (TinCan.Utils.isApplicationJSON(result.contentType)) {
                                try {
                                    result.contents = JSON.parse(result.contents);
                                } catch (ex) {
                                    self.log("retrieveAgentProfile - failed to deserialize JSON: " + ex);
                                }
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
                    requestResult.profile = new TinCan.AgentProfile(
                        {
                            id: key,
                            agent: cfg.agent,
                            contents: requestResult.xhr.responseText
                        }
                    );
                    if (typeof requestResult.xhr.getResponseHeader !== "undefined" && requestResult.xhr.getResponseHeader("ETag") !== null && requestResult.xhr.getResponseHeader("ETag") !== "") {
                        requestResult.profile.etag = requestResult.xhr.getResponseHeader("ETag");
                    }
                    else {
                        //
                        // either XHR didn't have getResponseHeader (probably cause it is an IE
                        // XDomainRequest object which doesn't) or not populated by LRS so create
                        // the hash ourselves
                        //
                        // the LRS is responsible for quoting the Etag value so we need to mimic
                        // that behavior here as well
                        //
                        requestResult.profile.etag = "\"" + TinCan.Utils.getSHA1String(requestResult.xhr.responseText) + "\"";
                    }
                    if (typeof requestResult.xhr.contentType !== "undefined") {
                        // most likely an XDomainRequest which has .contentType
                        // for the ones that it supports
                        requestResult.profile.contentType = requestResult.xhr.contentType;
                    }
                    else if (typeof requestResult.xhr.getResponseHeader !== "undefined" && requestResult.xhr.getResponseHeader("Content-Type") !== null && requestResult.xhr.getResponseHeader("Content-Type") !== "") {
                        requestResult.profile.contentType = requestResult.xhr.getResponseHeader("Content-Type");
                    }
                    if (TinCan.Utils.isApplicationJSON(requestResult.profile.contentType)) {
                        try {
                            requestResult.profile.contents = JSON.parse(requestResult.profile.contents);
                        } catch (ex) {
                            this.log("retrieveAgentProfile - failed to deserialize JSON: " + ex);
                        }
                    }
                }
            }

            return requestResult;
        },

        /**
        Retrieve the list of profileIds for an agent profile, when used from a browser sends to the endpoint using the RESTful interface.

        @method retrieveAgentProfileIds
        @param {Object} cfg Configuration options
            @param {TinCan.Agent} cfg.agent Agent in document identifier
            @param {Function} [cfg.callback] Callback to execute on completion
            @param {String} [cfg.since] Match activity profiles saved since given timestamp
            @param {Object} [cfg.requestHeaders] Optional object containing additional headers to add to request
        @return {Array} List of profileIds for this Agent

        */
        retrieveAgentProfileIds: function (cfg) {
            this.log("retrieveAgentProfileIds");
            var requestParams = {},
                requestCfg,
                requestHeaders,
                requestResult,
                callbackWrapper;

            cfg = cfg || {};
            requestHeaders = cfg.requestHeaders || {};

            requestCfg = {
                method: "GET",
                params: requestParams,
                headers: requestHeaders,
                ignore404: true
            };

            if (this.version === "0.9") {
                requestCfg.url = "actors/profile";
                requestParams.actor = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            else {
                requestCfg.url = "agents/profile";
                requestParams.agent = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (err, xhr) {
                    var result = xhr;

                    if (err !== null) {
                        cfg.callback(err, result);
                        return;
                    }

                    if (xhr.status === 404) {
                        result = [];
                    }
                    else {
                        try {
                            result = JSON.parse(xhr.responseText);
                        }
                        catch (ex) {
                            err = "Response JSON parse error: " + ex;
                        }
                    }

                    cfg.callback(err, result);
                };
                requestCfg.callback = callbackWrapper;
            }
            if (typeof cfg.since !== "undefined") {
                requestCfg.params.since = cfg.since;
            }

            requestResult = this.sendRequest(requestCfg);
            if (! callbackWrapper) {
                requestResult.profileIds = null;
                if (requestResult.err !== null) {
                    return requestResult;
                }

                if (requestResult.xhr.status === 404) {
                    requestResult.profileIds = [];
                }
                else {
                    try {
                        requestResult.profileIds = JSON.parse(requestResult.xhr.responseText);
                    }
                    catch (ex) {
                        requestResult.err = "retrieveAgentProfileIds - JSON parse error: " + ex;
                    }
                }
            }
            return requestResult;
        },

        /**
        Save an agent profile value, when used from a browser sends to the endpoint using the RESTful interface.

        @method saveAgentProfile
        @param {String} key Key of agent profile to retrieve
        @param val Value to be stored
        @param {Object} cfg Configuration options
            @param {TinCan.Agent} cfg.agent Agent in document identifier
            @param {String} [cfg.lastSHA1] SHA1 of the previously seen existing profile
            @param {String} [cfg.contentType] Content-Type to specify in headers (defaults to 'application/octet-stream')
            @param {String} [cfg.method] Method to use. Default: PUT
            @param {Function} [cfg.callback] Callback to execute on completion
            @param {Object} [cfg.requestHeaders] Optional object containing additional headers to add to request
        */
        saveAgentProfile: function (key, val, cfg) {
            this.log("saveAgentProfile");
            var requestCfg,
                requestHeaders;

            requestHeaders = cfg.requestHeaders || {};

            if (typeof cfg.contentType === "undefined") {
                cfg.contentType = "application/octet-stream";
            }
            requestHeaders["Content-Type"] = cfg.contentType;

            if (typeof cfg.method === "undefined" || cfg.method !== "POST") {
                cfg.method = "PUT";
            }

            if (typeof val === "object" && TinCan.Utils.isApplicationJSON(cfg.contentType)) {
                val = JSON.stringify(val);
            }

            requestCfg = {
                method: cfg.method,
                params: {
                    profileId: key
                },
                data: val,
                headers: requestHeaders
            };

            if (this.version === "0.9") {
                requestCfg.url = "actors/profile";
                requestCfg.params.actor = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            else {
                requestCfg.url = "agents/profile";
                requestCfg.params.agent = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }
            if (typeof cfg.lastSHA1 !== "undefined" && cfg.lastSHA1 !== null) {
                requestCfg.headers["If-Match"] = cfg.lastSHA1;
            }
            else {
                requestCfg.headers["If-None-Match"] = "*";
            }

            return this.sendRequest(requestCfg);
        },

        /**
        Drop an agent profile value, when used from a browser sends to the endpoint using the RESTful interface. Full agent profile
        delete is not supported by the spec.

        @method dropAgentProfile
        @param {String|null} key Key of agent profile to delete
        @param {Object} cfg Configuration options
            @param {TinCan.Agent} cfg.agent Agent in document identifier
            @param {Function} [cfg.callback] Callback to execute on completion
            @param {Object} [cfg.requestHeaders] Optional object containing additional headers to add to request
        */
        dropAgentProfile: function (key, cfg) {
            this.log("dropAgentProfile");
            var requestParams,
                requestCfg,
                requestHeaders;

            requestHeaders = cfg.requestHeaders || {};

            requestParams = {
                profileId: key
            };
            requestCfg = {
                method: "DELETE",
                params: requestParams,
                headers: requestHeaders
            };

            if (this.version === "0.9") {
                requestCfg.url = "actors/profile";
                requestParams.actor = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            else {
                requestCfg.url = "agents/profile";
                requestParams.agent = JSON.stringify(cfg.agent.asVersion(this.version));
            }
            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }

            return this.sendRequest(requestCfg);
        }
    };

    /**
    Allows client code to determine whether their environment supports synchronous xhr handling
    @static this is a static property, set by the environment
    */
    LRS.syncEnabled = null;
}());
