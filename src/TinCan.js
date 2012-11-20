/*!
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

TODO:

* Add statement queueing

@module TinCan
**/
var TinCan;

(function () {
    "use strict";
    var _environment = null;

    /**
    @class TinCan
    @constructor
    @param {Object} [options] Configuration used to initialize.
        @param {Array} [options.recordStores] list of pre-configured LRSes
        @param {String} [options.url] URL for determining launch provided
            configuration options
    **/
    TinCan = function (cfg) {
        this.log("constructor");

        /**
        @property environment
        @type String
        */
        this.environment = null;

        /**
        @property recordStores
        @type Array
        */
        this.recordStores = [];

        /**
        Default actor used when preparing statements that
        don't yet have an actor set

        @property actor
        @type Object
        */
        this.actor = null;

        /**
        Default activity, may be used as a statement 'target'
        or incorporated into 'context'

        @property activity
        @type Object
        */
        this.activity = null;

        /**
        Default registration, included in default context when
        provided, otherwise used in statement queries

        @property registration
        @type String
        */
        this.registration = null;

        /**
        Default context used when preparing statements that
        don't yet have a context set, or mixed in when one
        has been provided, properties do NOT override on mixing

        @property context
        @type Object
        */
        this.context = null;

        this.init(cfg);
    };

    TinCan.prototype = {
        LOG_SRC: "TinCan",

        /**
        Safe version of logging

        @method log
        @param {String} msg Message to output
        */
        log: function (msg, src) {
            if (TinCan.DEBUG && console && console.log) {
                src = src || this.LOG_SRC || "TinCan";

                console.log(src + ': ' + msg);
            }
        },

        /**
        @method init
        @param {Object} [options] Configuration used to initialize (see TinCan constructor).
        */
        init: function (cfg) {
            this.log("init");

            cfg = cfg || {};

            // TODO: check for environment and when in browser get location ourselves?

            if (cfg.hasOwnProperty("url") && cfg.url !== "") {
                this._initFromQueryString(cfg.url);
            }
        },

        /**
        @method _handleQueryString
        @param {String} url
        @private
        */
        _initFromQueryString: function (url) {
            this.log("_initFromQueryString");

            var i,
                prop,
                qsParams = TinCan.Utils.parseURL(url).params,
                lrsProps = ["endpoint", "auth"],
                lrsCfg,
                activityCfg,
                contextCfg
            ;

            if (qsParams.hasOwnProperty("actor")) {
                this.log("_initFromQueryString - found actor: " + qsParams.actor);
                try {
                    this.actor = TinCan.Agent.fromJSON(qsParams.actor);
                    delete qsParams.actor;
                }
                catch (ex) {
                    this.log("_initFromQueryString - failed to set actor: " + ex);
                }
            }

            if (qsParams.hasOwnProperty("activity_id")) {
                this.activity = new TinCan.Activity (
                    {
                        id: qsParams.activity_id
                    }
                );
            }

            if (
                qsParams.hasOwnProperty("activity_platform")
                ||
                qsParams.hasOwnProperty("registration")
                ||
                qsParams.hasOwnProperty("grouping")
            ) {
                contextCfg = {};

                if (qsParams.hasOwnProperty("activity_platform")) {
                    contextCfg.platform = qsParams.activity_platform;
                }
                if (qsParams.hasOwnProperty("registration")) {
                    //
                    // stored in two locations cause we always want it in the default
                    // context, but we also want to be able to get to it for Statement
                    // queries
                    //
                    contextCfg.registration = this.registration = qsParams.registration;
                }
                if (qsParams.hasOwnProperty("grouping")) {
                    contextCfg.contextActivities.grouping = qsParams.grouping;
                }

                this.context = new TinCan.Context (contextCfg);
            }

            //
            // order matters here, process the URL provided LRS last because it gets
            // all the remaining parameters so that they get passed through
            //
            if (qsParams.hasOwnProperty("endpoint")) {
                for (i = 0; i < lrsProps.length; i += 1) {
                    prop = lrsProps[i];
                    if (qsParams.hasOwnProperty(prop)) {
                        lrsCfg[prop] = qsParams[prop];
                        delete qsParams[prop];
                    }
                }
                lrsCfg.extended = qsParams;
                lrsCfg.allowFail = false;

                this.addRecordStore(lrsCfg);
            }
        },

        /**
        @method addRecordStore
        @param {Object} Configuration data

         * TODO:
         * check endpoint for trailing '/'
         * check for unique endpoints
        */
        addRecordStore: function (cfg) {
            this.log("addRecordStore");

            var lrs = new TinCan.LRS (cfg);
            this.recordStores.push(lrs);
        },

        /**
        @method prepareStatement
        @param {Object|TinCan.Statement} Base statement properties or
            pre-created TinCan.Statement instance
        @return {TinCan.Statement}
        */
        prepareStatement: function (stmt) {
            this.log("prepareStatement");
            if (! (stmt instanceof TinCan.Statement)) {
                stmt = new TinCan.Statement (stmt);
            }

            if (stmt.actor === null && this.actor !== null) {
                stmt.actor = this.actor;
            }

            if (this.context !== null) {
                if (stmt.context === null) {
                    stmt.context = this.context;
                }
                else {
                    if (stmt.context.registration === null) {
                        stmt.context.registration = this.context.registration;
                    }
                    if (stmt.context.platform === null) {
                        stmt.context.platform = this.context.platform;
                    }

                    if (this.context.contextActivities !== null) {
                        if (stmt.context.contextActivities === null) {
                            stmt.context.contextActivities = this.context.contextActivities;
                        }
                        else {
                            if (this.context.contextActivities.grouping !== null && stmt.context.contextActivities.grouping === null) {
                                stmt.context.contextActivities.grouping = this.context.contextActivities.grouping;
                            }
                        }
                    }
                }
            }

            return stmt;
        },

        /**
        Calls saveStatement on each configured LRS, provide callback to make it asynchronous

        @method sendStatement
        @param {TinCan.Statement} statement Send statement to LRS
        @param {Function} [callback] Callback function to execute on completion
        */
        sendStatement: function (stmt, callback) {
            this.log("sendStatement");
            var lrs,
                statement,
                callbackWrapper,
                rsCount = this.recordStores.length,
                i,
                msg
            ;

            if (rsCount > 0) {
                statement = this.prepareStatement(stmt);

                /*
                   when there are multiple LRSes configured and
                   if there is a callback that is a function then we need
                   to wrap that function with a function that becomes
                   the new callback that reduces a closure count of the
                   requests that don't have allowFail set to true and
                   when that number hits zero then the original callback
                   is executed
                */
                if (rsCount === 1) {
                    callbackWrapper = callback;
                }
                else {
                    if (typeof callback === "function") {
                        callbackWrapper = function () {
                            this.log("sendStatement - callbackWrapper: " + rsCount);
                            if (rsCount > 1) {
                                rsCount -= 1;
                            }
                            else if (rsCount === 1) {
                                callback.apply(this, arguments);
                            }
                            else {
                                this.log("sendStatement - unexpected record store count: " + rsCount);
                            }
                        };
                    }
                }

                for (i = 0; i < rsCount; i += 1) {
                    lrs = this.recordStores[i];

                    lrs.saveStatement(statement, { callback: callbackWrapper });
                }
            }
            else {
                msg = "[warning] sendStatement: No LRSs added yet (statement not sent)";
                if (TinCan.environment().isBrowser) {
                    alert(this.LOG_SRC + ": " + msg);
                }
                else {
                    this.log(msg);
                }
            }
        },

        /**
        Calls retrieveStatement on each configured LRS until it gets a result, provide callback to make it asynchronous

        @method getStatement
        @param {String} statement Statement ID to get
        @param {Function} [callback] Callback function to execute on completion
        @return {TinCan.Statement} Retrieved statement from LRS

        TODO: make TinCan track statements it has seen in a local cache to be returned easily
        */
        getStatement: function (stmtId, callback) {
            this.log("getStatement");
            var lrs,
                statement,
                callbackWrapper,
                rsCount = this.recordStores.length,
                i,
                msg
            ;

            if (rsCount > 0) {
                /*
                   when there are multiple LRSes configured and
                   if there is a callback that is a function then we need
                   to wrap that function with a function that becomes
                   the new callback that reduces a closure count of the
                   requests that don't have allowFail set to true and
                   when that number hits zero then the original callback
                   is executed
                */
                if (rsCount === 1) {
                    callbackWrapper = callback;
                }
                else {
                    if (typeof callback === "function") {
                        callbackWrapper = function () {
                            this.log("sendStatement - callbackWrapper: " + rsCount);
                            if (rsCount > 1) {
                                rsCount -= 1;
                            }
                            else if (rsCount === 1) {
                                callback.apply(this, arguments);
                            }
                            else {
                                this.log("sendStatement - unexpected record store count: " + rsCount);
                            }
                        };
                    }
                }

                for (i = 0; i < rsCount; i += 1) {
                    lrs = this.recordStores[i];

                    lrs.retrieveStatement(stmtId, callbackWrapper);
                }
            }
            else {
                msg = "[warning] getStatement: No LRSs added yet (statement not sent)";
                if (TinCan.environment().isBrowser) {
                    alert(this.LOG_SRC + ": " + msg);
                }
                else {
                    this.log(msg);
                }
            }
        },

        /**
        Calls saveStatements with list of statements

        @method sendStatements
        @param {Array} Array of statements to send
        @param {Function} Callback function to execute on completion
        */
        sendStatements: function (stmts, callback) {
            this.log("sendStatements");
            var lrs,
                statements = [],
                callbackWrapper,
                rsCount = this.recordStores.length,
                i,
                msg
            ;

            if (rsCount > 0) {
                if (stmts.length > 0) {
                    for (i = 0; i < stmts.length; i += 1) {
                        statements.push(
                            this.prepareStatement(stmts[i])
                        );
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
                                this.log("sendStatements - callbackWrapper: " + rsCount);
                                if (rsCount > 1) {
                                    rsCount -= 1;
                                }
                                else if (rsCount === 1) {
                                    callback.apply(this, arguments);
                                }
                                else {
                                    this.log("sendStatements - unexpected record store count: " + rsCount);
                                }
                            };
                        }
                    }

                    for (i = 0; i < rsCount; i += 1) {
                        lrs = this.recordStores[i];

                        lrs.saveStatements(statements, { callback: callbackWrapper });
                    }
                }
            }
            else {
                msg = "[warning] sendStatements: No LRSs added yet (statements not sent)";
                if (TinCan.environment().isBrowser) {
                    alert(this.LOG_SRC + ": " + msg);
                }
                else {
                    this.log(msg);
                }
            }
        },

        /**
        @method getStatements
        @param {Object} [cfg] Configuration for request
            @param {Object} [cfg.params] Parameters used to filter
                @param {Boolean} [cfg.params.sendActor] Include default actor in query params
                @param {Boolean} [cfg.params.sendActivity] Include default activity in query params

            @param {Function} [cfg.callback] Function to run at completion

        TODO: support multiple LRSs and flag to use single
        */
        getStatements: function (cfg) {
            this.log("getStatements");
            var queryCfg = {},
                lrs,
                params,
                msg
            ;
            if (this.recordStores.length > 0) {
                //
                // for get (for now) we only get from one (as they should be the same)
                // but it may make sense to long term try to merge statements, perhaps
                // by using statementId as unique
                //
                // TODO: make this the first non-allowFail LRS but for now it should
                // be good enough to make it the first since we know the LMS provided
                // LRS is the first
                //
                lrs = this.recordStores[0];

                cfg = cfg || {};

                // TODO: need a clone function?
                params = cfg.params || {};

                if (cfg.sendActor && this.actor !== null) {
                    params.actor = this.actor;
                }
                if (cfg.sendActivity && this.activity !== null) {
                    params.activity = this.activity;
                }
                if (this.registration !== null) {
                    params.registration = this.registration;
                }

                // TODO: do we want to hard set this?
                params.sparse = cfg.sparse || "false";

                queryCfg = {
                    params: params
                };
                if (typeof cfg.callback !== "undefined") {
                    queryCfg.callback = cfg.callback;
                }

                return lrs.queryStatements(queryCfg);
            }

            msg = "[warning] getStatements: No LRSs added yet (statements not read)";
            if (TinCan.environment().isBrowser) {
                alert(this.LOG_SRC + ": " + msg);
            }
            else {
                this.log(msg);
            }
        },

        /**
        @method getState
        @param {String} key Key to retrieve from the state
        @param {Object} [cfg] Configuration for request
            @param {Object} [cfg.actor] Actor used in query,
                defaults to 'actor' property if empty
            @param {Object} [cfg.activity] Activity used in query,
                defaults to 'activity' property if empty
            @param {Object} [cfg.registration] Registration used in query,
                defaults to 'registration' property if empty
            @param {Function} [cfg.callback] Function to run with state
        */
        getState: function (key, cfg) {
            this.log("getState");
            var queryCfg,
                lrs,
                msg
            ;

            if (this.recordStores.length > 0) {
                //
                // for state (for now) we are only going to store to the first LRS
                // so only get from there too
                //
                // TODO: make this the first non-allowFail LRS but for now it should
                // be good enough to make it the first since we know the LMS provided
                // LRS is the first
                //
                lrs = this.recordStores[0];

                cfg = cfg || {};

                queryCfg = {
                    actor: (typeof cfg.actor !== "undefined" ? cfg.actor : this.actor),
                    activity: (typeof cfg.activity !== "undefined" ? cfg.activity : this.activity)
                };
                if (typeof cfg.registration !== "undefined") {
                    queryCfg.registration = cfg.registration;
                }
                else if (this.registration !== null) {
                    queryCfg.registration = this.registration;
                }
                if (typeof cfg.callback !== "undefined") {
                    queryCfg.callback = cfg.callback;
                }

                return lrs.retrieveState(key, queryCfg);
            }

            msg = "[warning] getState: No LRSs added yet (state not retrieved)";
            if (TinCan.environment().isBrowser) {
                alert(this.LOG_SRC + ": " + msg);
            }
            else {
                this.log(msg);
            }
        },

        /**
        @method setState
        @param {String} key Key to store into the state
        @param {String|Object} val Value to store into the state, objects will be stringified to JSON
        @param {Object} [cfg] Configuration for request
            @param {Object} [cfg.actor] Actor used in query,
                defaults to 'actor' property if empty
            @param {Object} [cfg.activity] Activity used in query,
                defaults to 'activity' property if empty
            @param {Object} [cfg.registration] Registration used in query,
                defaults to 'registration' property if empty
            @param {Function} [cfg.callback] Function to run with state
        */
        setState: function (key, val, cfg) {
            this.log("setState");
            var queryCfg,
                lrs,
                msg
            ;

            if (this.recordStores.length > 0) {
                //
                // for state (for now) we are only going to store to the first LRS
                // so only get from there too
                //
                // TODO: make this the first non-allowFail LRS but for now it should
                // be good enough to make it the first since we know the LMS provided
                // LRS is the first
                //
                lrs = this.recordStores[0];

                cfg = cfg || {};

                queryCfg = {
                    actor: (typeof cfg.actor !== "undefined" ? cfg.actor : this.actor),
                    activity: (typeof cfg.activity !== "undefined" ? cfg.activity : this.activity)
                };
                if (typeof cfg.registration !== "undefined") {
                    queryCfg.registration = cfg.registration;
                }
                else if (this.registration !== null) {
                    queryCfg.registration = this.registration;
                }
                if (typeof cfg.callback !== "undefined") {
                    queryCfg.callback = cfg.callback;
                }

                return lrs.saveState(key, val, queryCfg);
            }

            msg = "[warning] setState: No LRSs added yet (state not saved)";
            if (TinCan.environment().isBrowser) {
                alert(this.LOG_SRC + ": " + msg);
            }
            else {
                this.log(msg);
            }
        },

        /**
        @method deleteState
        @param {String|null} key Key to remove from the state, or null to clear all
        @param {Object} [cfg] Configuration for request
            @param {Object} [cfg.actor] Actor used in query,
                defaults to 'actor' property if empty
            @param {Object} [cfg.activity] Activity used in query,
                defaults to 'activity' property if empty
            @param {Object} [cfg.registration] Registration used in query,
                defaults to 'registration' property if empty
            @param {Function} [cfg.callback] Function to run with state
        */
        deleteState: function (key, cfg) {
            this.log("deleteState");
            var queryCfg,
                lrs,
                msg
            ;

            if (this.recordStores.length > 0) {
                //
                // for state (for now) we are only going to store to the first LRS
                // so only get from there too
                //
                // TODO: make this the first non-allowFail LRS but for now it should
                // be good enough to make it the first since we know the LMS provided
                // LRS is the first
                //
                lrs = this.recordStores[0];

                cfg = cfg || {};

                queryCfg = {
                    actor: (typeof cfg.actor !== "undefined" ? cfg.actor : this.actor),
                    activity: (typeof cfg.activity !== "undefined" ? cfg.activity : this.activity)
                };
                if (typeof cfg.registration !== "undefined") {
                    queryCfg.registration = cfg.registration;
                }
                else if (this.registration !== null) {
                    queryCfg.registration = this.registration;
                }
                if (typeof cfg.callback !== "undefined") {
                    queryCfg.callback = cfg.callback;
                }

                return lrs.dropState(key, queryCfg);
            }

            msg = "[warning] deleteState: No LRSs added yet (state not deleted)";
            if (TinCan.environment().isBrowser) {
                alert(this.LOG_SRC + ": " + msg);
            }
            else {
                this.log(msg);
            }
        },

        /**
        @method getActivityProfile
        @param {String} key Key to retrieve from the profile
        @param {Object} [cfg] Configuration for request
            @param {Object} [cfg.activity] Activity used in query,
                defaults to 'activity' property if empty
            @param {Function} [cfg.callback] Function to run with activity profile
        */
        getActivityProfile: function (key, cfg) {
            this.log("getActivityProfile");
            var queryCfg,
                lrs,
                msg
            ;

            if (this.recordStores.length > 0) {
                //
                // for activity profiles (for now) we are only going to store to the first LRS
                // so only get from there too
                //
                // TODO: make this the first non-allowFail LRS but for now it should
                // be good enough to make it the first since we know the LMS provided
                // LRS is the first
                //
                lrs = this.recordStores[0];

                cfg = cfg || {};

                queryCfg = {
                    activity: (typeof cfg.activity !== "undefined" ? cfg.activity : this.activity)
                };
                if (typeof cfg.callback !== "undefined") {
                    queryCfg.callback = cfg.callback;
                }

                return lrs.retrieveActivityProfile(key, queryCfg);
            }

            msg = "[warning] getActivityProfile: No LRSs added yet (activity profile not retrieved)";
            if (TinCan.environment().isBrowser) {
                alert(this.LOG_SRC + ": " + msg);
            }
            else {
                this.log(msg);
            }
        },

        /**
        @method setActivityProfile
        @param {String} key Key to store into the activity profile
        @param {String|Object} val Value to store into the activity profile, objects will be stringified to JSON
        @param {Object} [cfg] Configuration for request
            @param {Object} [cfg.activity] Activity used in query,
                defaults to 'activity' property if empty
            @param {Function} [cfg.callback] Function to run with activity profile
        */
        setActivityProfile: function (key, val, cfg) {
            this.log("setActivityProfile");
            var queryCfg,
                lrs,
                msg
            ;

            if (this.recordStores.length > 0) {
                //
                // for activity profile (for now) we are only going to store to the first LRS
                // so only get from there too
                //
                // TODO: make this the first non-allowFail LRS but for now it should
                // be good enough to make it the first since we know the LMS provided
                // LRS is the first
                //
                lrs = this.recordStores[0];

                cfg = cfg || {};

                queryCfg = {
                    activity: (typeof cfg.activity !== "undefined" ? cfg.activity : this.activity)
                };
                if (typeof cfg.callback !== "undefined") {
                    queryCfg.callback = cfg.callback;
                }

                return lrs.saveActivityProfile(key, val, queryCfg);
            }

            msg = "[warning] setActivityProfile: No LRSs added yet (activity profile not saved)";
            if (TinCan.environment().isBrowser) {
                alert(this.LOG_SRC + ": " + msg);
            }
            else {
                this.log(msg);
            }
        },

        /**
        @method deleteActivityProfile
        @param {String|null} key Key to remove from the activity profile, or null to clear all
        @param {Object} [cfg] Configuration for request
            @param {Object} [cfg.activity] Activity used in query,
                defaults to 'activity' property if empty
            @param {Function} [cfg.callback] Function to run with activity profile
        */
        deleteActivityProfile: function (key, cfg) {
            this.log("deleteActivityProfile");
            var queryCfg,
                lrs,
                msg
            ;

            if (this.recordStores.length > 0) {
                //
                // for activity profile (for now) we are only going to store to the first LRS
                // so only get from there too
                //
                // TODO: make this the first non-allowFail LRS but for now it should
                // be good enough to make it the first since we know the LMS provided
                // LRS is the first
                //
                lrs = this.recordStores[0];

                cfg = cfg || {};

                queryCfg = {
                    activity: (typeof cfg.activity !== "undefined" ? cfg.activity : this.activity)
                };
                if (typeof cfg.callback !== "undefined") {
                    queryCfg.callback = cfg.callback;
                }

                return lrs.dropActivityProfile(key, queryCfg);
            }

            msg = "[warning] deleteActivityProfile: No LRSs added yet (activity profile not deleted)";
            if (TinCan.environment().isBrowser) {
                alert(this.LOG_SRC + ": " + msg);
            }
            else {
                this.log(msg);
            }
        }
    };

    /**
    @property DEBUG
    @static
    @default false
    */
    TinCan.DEBUG = false;

    /**
    Turn on debug logging

    @method enableDebug
    @static
    */
    TinCan.enableDebug = function () {
        TinCan.DEBUG = true;
    };

    /**
    Turn off debug logging

    @method disableDebug
    @static
    */
    TinCan.disableDebug = function () {
        TinCan.DEBUG = false;
    };

    /**
    @method versions
    @return {Array} Array of supported version numbers
    @static
    */
    TinCan.versions = function () {
        // newest first so we can use the first as the default
        return [
            "0.95",
            "0.90"
        ];
    };

    /**
    @method environment
    @return {Object} Object with properties depending on execution environment
    @static
    */
    TinCan.environment = function () {
        if (_environment === null) {
            _environment = {};
            if (typeof window !== "undefined") {
                _environment.isBrowser = true;
                _environment.isIE = false;
                if (typeof XDomainRequest !== "undefined") {
                    _environment.isIE = true;
                }
            }
            else {
                _environment.isBrowser = false;
            }
        }

        return _environment;
    };

    // Make sure we have JSON in general
    if (TinCan.environment().isBrowser) {
        /*
         * Make JSON safe for IE6
         * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/JSON#Browser_compatibility
        */
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
    }
}());
