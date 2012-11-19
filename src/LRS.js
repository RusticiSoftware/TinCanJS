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
    var IE = "ie",

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
        this._requestMode = "native";

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
                if (env.isBrowser) {
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

            urlParts = cfg.endpoint.toLowerCase().match(/([A-Za-z]+:)\/\/([^:\/]+):?(\d+)?(\/.*)?$/);

            if (env.isBrowser) {
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
                        urlParts[3] !== null ? urlParts[3] : (urlParts[1] === "http:" ? "80" : "443")
                    )
                );
                if (isXD && env.isIE) {
                    if (schemeMatches) {
                        this._requestMode = IE;
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
            }
            else {
                this.log("Unrecognized environment not supported: " + env);
            }

            if (typeof cfg.version !== "undefined") {
                this.log("version: " + cfg.version);
                this.version = cfg.version;
            }
        },

        /**
        @method sendRequest
        @param {Object} [cfg] Configuration for request
            @param {String} [cfg.url] URL portion to add to endpoint
            @param {String} [cfg.method] GET, PUT, POST, etc.
            @param {Object} [cfg.params] Parameters to set on the querystring
            @param {String} [cfg.data] String of body content
            @param {Function} [cfg.callback] Function to run at completion
            @param {Boolean} [cfg.ignore404] Whether 404 status codes should be ignored
            @param {Object} [cfg.headers] Additional headers to set in the request
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

            // add extended LMS-specified values to the params
            if (this.extended !== null) {
                for (prop in this.extended) {
                    if (this.extended.hasOwnProperty(prop)) {
                        // TODO: don't overwrite cfg.params value
                        if (this.extended[prop] !== null && this.extended[prop].length > 0) {
                            cfg.params[prop] = this.extended[prop];
                        }
                    }
                }
            }

            // consolidate headers
            headers["Content-Type"] = "application/json";
            headers.Authorization = this.auth;
            if (this.version !== "0.90") {
                headers["X-Experience-API-Version"] = this.version;
            }

            for (prop in cfg.headers) {
                if (cfg.headers.hasOwnProperty(prop)) {
                    headers[prop] = cfg.headers[prop];
                }
            }

            if (this._requestMode === "native") {
                this.log("sendRequest using XMLHttpRequest");

                for (prop in cfg.params) {
                    if (cfg.params.hasOwnProperty(prop)) {
                        pairs.push(prop + "=" + encodeURIComponent(cfg.params[prop]));
                    }
                }
                if (pairs.length > 0) {
                    fullUrl += "?" + pairs.join("&");
                }

                xhr = new XMLHttpRequest();
                xhr.open(cfg.method, fullUrl, cfg.callback !== undefined);
                for (prop in headers) {
                    if (headers.hasOwnProperty(prop)) {
                        xhr.setRequestHeader(prop, headers[prop]);
                    }
                }
                data = cfg.data;
            }
            else if (this._requestMode === IE) {
                this.log("sendRequest using XDomainRequest");

                // method has to go on querystring, and nothing else,
                // and the actual method is then always POST
                fullUrl += "?method=" + cfg.method;

                // params end up in the body
                for (prop in cfg.params) {
                    if (cfg.params.hasOwnProperty(prop)) {
                        pairs.push(prop + "=" + encodeURIComponent(headers[prop]));
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

            //Setup request callback
            function requestComplete () {
                self.log("requestComplete: " + finished + ", xhr.status: " + xhr.status);
                var notFoundOk;

                if (! finished) {
                    // may be in sync or async mode, using XMLHttpRequest or IE XDomainRequest, onreadystatechange or
                    // onload or both might fire depending upon browser, just covering all bases with event hooks and
                    // using 'finished' flag to avoid triggering events multiple times
                    finished = true;

                    notFoundOk = (cfg.ignore404 && xhr.status === 404);
                    if (xhr.status === undefined || (xhr.status >= 200 && xhr.status < 400) || notFoundOk) {
                        if (cfg.callback) {
                            cfg.callback(xhr);
                        }
                        else {
                            requestCompleteResult = xhr;
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
                if (this._requestMode === IE) {
                    // synchronous call in IE, with no synchronous mode available
                    until = 1000 + Date.now();
                    this.log("sendRequest: until: " + until + ", finished: " + finished);

                    while (Date.now() < until && ! finished) {
                        //this.log("calling __delay");
                        this.__delay();
                    }
                }
                return requestComplete();
            }
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
            if (TinCan.environment().isBrowser) {
                requestCfg = {
                    url: "statements",
                    method: "PUT",
                    params: {
                        statementId: stmt.id
                    },
                    data: JSON.stringify(stmt.asVersion( this.version ))
                };
                if (typeof cfg.callback !== "undefined") {
                    requestCfg.callback = cfg.callback;
                }

                this.sendRequest(requestCfg);
            }
            else {
                this.log("error: environment not implemented");
            }
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
            var callbackWrapper;

            callbackWrapper = function () {
                var statement;

                cfg.callback(statement);
            };

            // TODO: it would be better to make a subclass that knows
            //       its own environment and just implements the protocol
            //       that it needs to
            if (TinCan.environment().isBrowser) {
                this.sendRequest(
                    {
                        url: "statements",
                        method: "GET",
                        params: {
                            statementId: stmtId
                        }
                        //callback: cfg.callback
                    }
                );
            }
            else {
                this.log("error: environment not implemented");
            }
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
            var versionedStatements = [],
                requestCfg,
                i
            ;

            cfg = cfg || {};

            if (stmts.length > 0) {
                for (i = 0; i < stmts.length; i += 1) {
                    versionedStatements.push(
                        stmts[i].asVersion( this.version )
                    );
                }

                // TODO: it would be better to make a subclass that knows
                //       its own environment and just implements the protocol
                //       that it needs to
                if (TinCan.environment().isBrowser) {
                    requestCfg = {
                        url: "statements",
                        method: "POST",
                        data: JSON.stringify(versionedStatements)
                    };
                    if (typeof cfg.callback !== "undefined") {
                        requestCfg.callback = cfg.callback;
                    }

                    this.sendRequest(requestCfg);
                }
                else {
                    this.log("error: environment not implemented");
                }
            }
        },

        /**
        Fetch a set of statements, when used from a browser sends to the endpoint using the
        RESTful interface.  Use a callback to make the call asynchronous.

        @method queryStatements
        @param {Object} [cfg] Configuration used to query
            @param {Object} [cfg.params] Query parameters
                @param {TinCan.Agent} [cfg.params.actor] Agent matches 'actor'
                @param {TinCan.Verb} [cfg.params.verb] Verb to query on
                @param {TinCan.Activity|TinCan.Agent|TinCan.Statement} [cfg.params.target] Activity, Agent, or Statement matches 'object'
                @param {TinCan.Agent} [cfg.params.instructor] Agent matches 'context:instructor'
                @param {String} [cfg.params.registration] Registration UUID
                @param {Boolean} [cfg.params.context] When filtering on target, include statements with matching context
                @param {String} [cfg.params.since] Match statements stored since specified timestamp
                @param {String} [cfg.params.until] Match statements stored at or before specified timestamp
                @param {Integer} [cfg.params.limit] Number of results to retrieve
                @param {Boolean} [cfg.params.authoritative] Get authoritative results
                @param {Boolean} [cfg.params.sparse] Get sparse results
                @param {Boolean} [cfg.params.ascending] Return results in ascending order of stored time
            @param {Function} [cfg.callback] Callback to execute on completion
                @param {TinCan.StatementsResult} cfg.callback.response Receives a StatementsResult argument
        @return {TinCan.StatementsResult} StatementsResult object if no callback configured
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

            if (cfg.params.hasOwnProperty("target")) {
                cfg.params.object = cfg.params.target;
            }

            requestCfg = this._queryStatementsRequestCfg(cfg);

            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (xhr) {
                    var stResult = TinCan.StatementsResult.fromJSON(xhr.responseText);

                    cfg.callback(stResult);
                };
                requestCfg.callback = callbackWrapper;
            }

            requestResult = this.sendRequest(requestCfg);

            if (typeof requestCfg.callback === "undefined") {
                return TinCan.StatementsResult.fromJSON(requestResult.responseText);
            }

            return requestCfg;
        },

        /**
        Build a request config object that can be passed to sendRequest() to make a query request

        @method _queryStatementsRequestCfg
        @private
        @param {Object} [cfg] See configuration for queryStatements()
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
                    "actor",
                    "object",
                    "instructor"
                ],
                idProps = ["verb"],
                valProps = [
                    "registration",
                    "context",
                    "since",
                    "until",
                    "limit",
                    "authoritative",
                    "sparse",
                    "ascending"
                ],
                i;

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
                @param {TinCan.StatementsResult} cfg.callback.response Receives a StatementsResult argument
        @return {TinCan.StatementsResult} StatementsResult object if no callback configured
        */
        moreStatements: function (cfg) {
            this.log("moreStatements: " + cfg.url);
            var requestCfg,
                requestResult,
                callbackWrapper,
                parsedURL;

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

            requestCfg = {
                method: "GET",
                url: parsedURL.path,
                params: parsedURL.params
            };
            if (typeof cfg.callback !== "undefined") {
                callbackWrapper = function (xhr) {
                    var stResult = TinCan.StatementsResult.fromJSON(xhr.responseText);

                    cfg.callback(stResult);
                };
                requestCfg.callback = callbackWrapper;
            }

            requestResult = this.sendRequest(requestCfg);

            if (typeof requestCfg.callback === "undefined") {
                return TinCan.StatementsResult.fromJSON(requestResult.responseText);
            }
        },

        /**
        Retrieve a state value, when used from a browser sends to the endpoint using the RESTful interface.

        @method retrieveState
        @param {String} key Key of state to retrieve
        @param {Object} cfg Configuration options
            @param {Object} activity TinCan.Activity
            @param {Object} actor TinCan.Actor
            @param {String} [registration] Registration
            @param {Function} [cfg.callback] Callback to execute on completion
        @return {Object} TinCan.State retrieved
        */
        retrieveState: function (key, cfg) {
            this.log("retrieveState");
            var requestParams = {},
                requestCfg = {},
                requestResult
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
                activityId: cfg.activity.id,
                actor: JSON.stringify(cfg.actor.asVersion(this.version))
            };
            if (typeof cfg.registration !== "undefined") {
                requestParams.registrationId = cfg.registration;
            }

            requestCfg = {
                url: "activities/state",
                method: "GET",
                params: requestParams
            };
            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }

            requestResult = this.sendRequest(requestCfg);

            // TODO: need to convert into a TinCan.State object
            // TODO: this seems like a bad interface decision
            return requestResult.responseText;
        },

        /**
        Save a state value, when used from a browser sends to the endpoint using the RESTful interface.

        @method saveState
        @param {String} key Key of state to retrieve
        @param {Object} cfg Configuration options
            @param {Object} activity TinCan.Activity
            @param {Object} actor TinCan.Actor
            @param {String} registration Registration
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
                activityId: cfg.activity.id,
                actor: JSON.stringify(cfg.actor.asVersion(this.version))
            };
            if (typeof cfg.registration !== "undefined") {
                requestParams.registrationId = cfg.registration;
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

            requestResult = this.sendRequest(requestCfg);

            // TODO: need to convert into a TinCan.State object
            // TODO: this seems like a bad interface decision
            return requestResult.responseText;
        },

        /**
        Drop a state value or all of the state, when used from a browser sends to the endpoint using the RESTful interface.

        @method dropState
        @param {String|null} key Key of state to delete, or null for all
        @param {Object} cfg Configuration options
            @param {Object} activity TinCan.Activity
            @param {Object} actor TinCan.Actor
            @param {String} [registration] Registration
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
                activityId: cfg.activity.id,
                actor: JSON.stringify(cfg.actor.asVersion(this.version))
            };
            if (key !== null) {
                requestParams.stateId = key;
            }
            if (typeof cfg.registration !== "undefined") {
                requestParams.registrationId = cfg.registration;
            }

            requestCfg = {
                url: "activities/state",
                method: "DELETE",
                params: requestParams
            };
            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }

            this.sendRequest(requestCfg);
        },

        /**
        Retrieve an activity profile value, when used from a browser sends to the endpoint using the RESTful interface.

        @method retrieveActivityProfile
        @param {String} key Key of activity profile to retrieve
        @param {Object} cfg Configuration options
            @param {Object} activity TinCan.Activity
            @param {Object} actor TinCan.Actor
            @param {String} [registration] Registration
            @param {Function} [cfg.callback] Callback to execute on completion
        @return {Object} Value retrieved
        */
        retrieveActivityProfile: function (key, cfg) {
            this.log("retrieveActivityProfile");
            var requestCfg = {},
                requestResult
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
                }
            };
            if (typeof cfg.callback !== "undefined") {
                requestCfg.callback = cfg.callback;
            }

            requestResult = this.sendRequest(requestCfg);

            // TODO: this seems like a bad interface decision
            return requestResult.responseText;
        },

        /**
        Save an activity profile value, when used from a browser sends to the endpoint using the RESTful interface.

        @method saveActivityProfile
        @param {String} key Key of activity profile to retrieve
        @param {Object} cfg Configuration options
            @param {Object} activity TinCan.Activity
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

            this.sendRequest(requestCfg);
        },

        /**
        Drop an activity profile value or all of the activity profile, when used from a browser sends to the endpoint using the RESTful interface.

        @method dropActivityProfile
        @param {String|null} key Key of activity profile to delete, or null for all
        @param {Object} cfg Configuration options
            @param {Object} activity TinCan.Activity
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

            this.sendRequest(requestCfg);
        },

        /**
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
