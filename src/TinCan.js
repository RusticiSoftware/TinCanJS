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
    var _reservedQSParams = {
        //
        // these are TC spec reserved words that may end up in queries to the endpoint
        //
        statementId:       true,
        voidedStatementId: true,
        verb:              true,
        object:            true,
        registration:      true,
        context:           true,
        actor:             true,
        since:             true,
        until:             true,
        limit:             true,
        authoritative:     true,
        sparse:            true,
        instructor:        true,
        ascending:         true,
        continueToken:     true,
        agent:             true,
        activityId:        true,
        stateId:           true,
        profileId:         true,

        //
        // these are suggested by the LMS launch spec addition that TinCanJS consumes
        //
        activity_platform: true,
        grouping:          true,
        "Accept-Language": true
    };

    /**
    @class TinCan
    @constructor
    @param {Object} [options] Configuration used to initialize.
        @param {String} [options.url] URL for determining launch provided
            configuration options
        @param {Array} [options.recordStores] list of pre-configured LRSes
        @param {Object|TinCan.Agent} [options.actor] default actor
        @param {Object|TinCan.Activity} [options.activity] default activity
        @param {String} [options.registration] default registration
        @param {Object|TinCan.Context} [options.context] default context
    **/
    TinCan = function (cfg) {
        this.log("constructor");

        /**
        @property recordStores
        @type Array
        */
        this.recordStores = [];

        /**
        Default actor used when preparing statements that
        don't yet have an actor set, and for saving state, etc.

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
        Safe version of logging, only displays when .DEBUG is true, and console.log
        is available

        @method log
        @param {String} msg Message to output
        */
        log: function (msg, src) {
            /* globals console */
            if (TinCan.DEBUG && typeof console !== "undefined" && console.log) {
                src = src || this.LOG_SRC || "TinCan";

                console.log("TinCan." + src + ": " + msg);
            }
        },

        /**
        @method init
        @param {Object} [options] Configuration used to initialize (see TinCan constructor).
        */
        init: function (cfg) {
            this.log("init");
            var i;

            cfg = cfg || {};

            if (cfg.hasOwnProperty("url") && cfg.url !== "") {
                this._initFromQueryString(cfg.url);
            }

            if (cfg.hasOwnProperty("recordStores") && cfg.recordStores !== undefined) {
                for (i = 0; i < cfg.recordStores.length; i += 1) {
                    this.addRecordStore(cfg.recordStores[i]);
                }
            }
            if (cfg.hasOwnProperty("activity")) {
                if (cfg.activity instanceof TinCan.Activity) {
                    this.activity = cfg.activity;
                }
                else {
                    this.activity = new TinCan.Activity (cfg.activity);
                }
            }
            if (cfg.hasOwnProperty("actor")) {
                if (cfg.actor instanceof TinCan.Agent) {
                    this.actor = cfg.actor;
                }
                else {
                    this.actor = new TinCan.Agent (cfg.actor);
                }
            }
            if (cfg.hasOwnProperty("context")) {
                if (cfg.context instanceof TinCan.Context) {
                    this.context = cfg.context;
                }
                else {
                    this.context = new TinCan.Context (cfg.context);
                }
            }
            if (cfg.hasOwnProperty("registration")) {
                this.registration = cfg.registration;
            }
        },

        /**
        @method _initFromQueryString
        @param {String} url
        @private
        */
        _initFromQueryString: function (url) {
            this.log("_initFromQueryString");

            var i,
                prop,
                qsParams = TinCan.Utils.parseURL(url).params,
                lrsProps = ["endpoint", "auth"],
                lrsCfg = {},
                contextCfg,
                extended = null
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
                delete qsParams.activity_id;
            }

            if (
                qsParams.hasOwnProperty("activity_platform") ||
                qsParams.hasOwnProperty("registration") ||
                qsParams.hasOwnProperty("grouping")
            ) {
                contextCfg = {};

                if (qsParams.hasOwnProperty("activity_platform")) {
                    contextCfg.platform = qsParams.activity_platform;
                    delete qsParams.activity_platform;
                }
                if (qsParams.hasOwnProperty("registration")) {
                    //
                    // stored in two locations cause we always want it in the default
                    // context, but we also want to be able to get to it for Statement
                    // queries
                    //
                    contextCfg.registration = this.registration = qsParams.registration;
                    delete qsParams.registration;
                }
                if (qsParams.hasOwnProperty("grouping")) {
                    contextCfg.contextActivities = {};
                    contextCfg.contextActivities.grouping = qsParams.grouping;
                    delete qsParams.grouping;
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

                // remove our reserved params so they don't end up  in the extended object
                for (i in qsParams) {
                    if (qsParams.hasOwnProperty(i)) {
                        if (_reservedQSParams.hasOwnProperty(i)) {
                            delete qsParams[i];
                        } else {
                            extended = extended || {};
                            extended[i] = qsParams[i];
                        }
                    }
                }
                if (extended !== null) {
                    lrsCfg.extended = extended;
                }

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
            var lrs;
            if (cfg instanceof TinCan.LRS) {
                lrs = cfg;
            }
            else {
                lrs = new TinCan.LRS (cfg);
            }
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
            if (stmt.target === null && this.activity !== null) {
                stmt.target = this.activity;
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
                            if (this.context.contextActivities.parent !== null && stmt.context.contextActivities.parent === null) {
                                stmt.context.contextActivities.parent = this.context.contextActivities.parent;
                            }
                            if (this.context.contextActivities.other !== null && stmt.context.contextActivities.other === null) {
                                stmt.context.contextActivities.other = this.context.contextActivities.other;
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
        @param {TinCan.Statement|Object} statement Send statement to LRS
        @param {Function} [callback] Callback function to execute on completion
        */
        sendStatement: function (stmt, callback) {
            this.log("sendStatement");

            // would prefer to use .bind instead of 'self'
            var self = this,
                lrs,
                statement = this.prepareStatement(stmt),
                rsCount = this.recordStores.length,
                i,
                results = [],
                callbackWrapper,
                callbackResults = []
            ;

            if (rsCount > 0) {
                /*
                   if there is a callback that is a function then we need
                   to wrap that function with a function that becomes
                   the new callback that reduces a closure count of the
                   requests that don't have allowFail set to true and
                   when that number hits zero then the original callback
                   is executed
                */
                if (typeof callback === "function") {
                    callbackWrapper = function (err, xhr) {
                        var args;

                        self.log("sendStatement - callbackWrapper: " + rsCount);
                        if (rsCount > 1) {
                            rsCount -= 1;
                            callbackResults.push(
                                {
                                    err: err,
                                    xhr: xhr
                                }
                            );
                        }
                        else if (rsCount === 1) {
                            callbackResults.push(
                                {
                                    err: err,
                                    xhr: xhr
                                }
                            );
                            args = [
                                callbackResults,
                                statement
                            ];
                            callback.apply(this, args);
                        }
                        else {
                            self.log("sendStatement - unexpected record store count: " + rsCount);
                        }
                    };
                }

                for (i = 0; i < rsCount; i += 1) {
                    lrs = this.recordStores[i];

                    results.push(
                        lrs.saveStatement(statement, { callback: callbackWrapper })
                    );
                }
            }
            else {
                this.log("[warning] sendStatement: No LRSs added yet (statement not sent)");
                if (typeof callback === "function") {
                    callback.apply(this, [ null, statement ]);
                }
            }

            return {
                statement: statement,
                results: results
            };
        },

        /**
        Calls retrieveStatement on the first LRS, provide callback to make it asynchronous

        @method getStatement
        @param {String} statement Statement ID to get
        @param {Function} [callback] Callback function to execute on completion
        @return {Array|Result} Array of results, or single result

        TODO: make TinCan track statements it has seen in a local cache to be returned easily
        */
        getStatement: function (stmtId, callback) {
            this.log("getStatement");

            var lrs;

            if (this.recordStores.length > 0) {
                //
                // for statements (for now) we only need to read from the first LRS
                // in the future it may make sense to get all from all LRSes and
                // compare to remove duplicates or allow inspection of them for differences?
                //
                // TODO: make this the first non-allowFail LRS but for now it should
                // be good enough to make it the first since we know the LMS provided
                // LRS is the first
                //
                lrs = this.recordStores[0];

                return lrs.retrieveStatement(stmtId, { callback: callback });
            }

            this.log("[warning] getStatement: No LRSs added yet (statement not retrieved)");
        },

        /**
        Creates a statement used for voiding the passed statement/statement ID and calls
        send statement with the voiding statement.

        @method voidStatement
        @param {TinCan.Statement|String} statement Statement or statement ID to void
        @param {Function} [callback] Callback function to execute on completion
        @param {Object} [options] Options used to build voiding statement
            @param {TinCan.Agent} [options.actor] Agent to be used as 'actor' in voiding statement
        */
        voidStatement: function (stmt, callback, options) {
            this.log("voidStatement");

            // would prefer to use .bind instead of 'self'
            var self = this,
                lrs,
                actor,
                voidingStatement,
                rsCount = this.recordStores.length,
                i,
                results = [],
                callbackWrapper,
                callbackResults = []
            ;

            if (stmt instanceof TinCan.Statement) {
                stmt = stmt.id;
            }

            if (typeof options.actor !== "undefined") {
                actor = options.actor;
            }
            else if (this.actor !== null) {
                actor = this.actor;
            }

            voidingStatement = new TinCan.Statement(
                {
                    actor: actor,
                    verb: {
                        id: "http://adlnet.gov/expapi/verbs/voided"
                    },
                    target: {
                        objectType: "StatementRef",
                        id: stmt
                    }
                }
            );

            if (rsCount > 0) {
                /*
                   if there is a callback that is a function then we need
                   to wrap that function with a function that becomes
                   the new callback that reduces a closure count of the
                   requests that don't have allowFail set to true and
                   when that number hits zero then the original callback
                   is executed
                */
                if (typeof callback === "function") {
                    callbackWrapper = function (err, xhr) {
                        var args;

                        self.log("voidStatement - callbackWrapper: " + rsCount);
                        if (rsCount > 1) {
                            rsCount -= 1;
                            callbackResults.push(
                                {
                                    err: err,
                                    xhr: xhr
                                }
                            );
                        }
                        else if (rsCount === 1) {
                            callbackResults.push(
                                {
                                    err: err,
                                    xhr: xhr
                                }
                            );
                            args = [
                                callbackResults,
                                voidingStatement
                            ];
                            callback.apply(this, args);
                        }
                        else {
                            self.log("voidStatement - unexpected record store count: " + rsCount);
                        }
                    };
                }

                for (i = 0; i < rsCount; i += 1) {
                    lrs = this.recordStores[i];

                    results.push(
                        lrs.saveStatement(voidingStatement, { callback: callbackWrapper })
                    );
                }
            }
            else {
                this.log("[warning] voidStatement: No LRSs added yet (statement not sent)");
                if (typeof callback === "function") {
                    callback.apply(this, [ null, voidingStatement ]);
                }
            }

            return {
                statement: voidingStatement,
                results: results
            };
        },

        /**
        Calls retrieveVoidedStatement on the first LRS, provide callback to make it asynchronous

        @method getVoidedStatement
        @param {String} statement Statement ID to get
        @param {Function} [callback] Callback function to execute on completion
        @return {Array|Result} Array of results, or single result

        TODO: make TinCan track voided statements it has seen in a local cache to be returned easily
        */
        getVoidedStatement: function (stmtId, callback) {
            this.log("getVoidedStatement");

            var lrs;

            if (this.recordStores.length > 0) {
                //
                // for statements (for now) we only need to read from the first LRS
                // in the future it may make sense to get all from all LRSes and
                // compare to remove duplicates or allow inspection of them for differences?
                //
                // TODO: make this the first non-allowFail LRS but for now it should
                // be good enough to make it the first since we know the LMS provided
                // LRS is the first
                //
                lrs = this.recordStores[0];

                return lrs.retrieveVoidedStatement(stmtId, { callback: callback });
            }

            this.log("[warning] getVoidedStatement: No LRSs added yet (statement not retrieved)");
        },

        /**
        Calls saveStatements with list of prepared statements

        @method sendStatements
        @param {Array} Array of statements to send
        @param {Function} Callback function to execute on completion
        */
        sendStatements: function (stmts, callback) {
            this.log("sendStatements");
            var self = this,
                lrs,
                statements = [],
                rsCount = this.recordStores.length,
                i,
                results = [],
                callbackWrapper,
                callbackResults = []
            ;
            if (stmts.length === 0) {
                if (typeof callback === "function") {
                    callback.apply(this, [ null, statements ]);
                }
            }
            else {
                for (i = 0; i < stmts.length; i += 1) {
                    statements.push(
                        this.prepareStatement(stmts[i])
                    );
                }

                if (rsCount > 0) {
                    /*
                       if there is a callback that is a function then we need
                       to wrap that function with a function that becomes
                       the new callback that reduces a closure count of the
                       requests that don't have allowFail set to true and
                       when that number hits zero then the original callback
                       is executed
                    */

                    if (typeof callback === "function") {
                        callbackWrapper = function (err, xhr) {
                            var args;

                            self.log("sendStatements - callbackWrapper: " + rsCount);
                            if (rsCount > 1) {
                                rsCount -= 1;
                                callbackResults.push(
                                    {
                                        err: err,
                                        xhr: xhr
                                    }
                                );
                            }
                            else if (rsCount === 1) {
                                callbackResults.push(
                                    {
                                        err: err,
                                        xhr: xhr
                                    }
                                );
                                args = [
                                    callbackResults,
                                    statements
                                ];
                                callback.apply(this, args);
                            }
                            else {
                                self.log("sendStatements - unexpected record store count: " + rsCount);
                            }
                        };
                    }

                    for (i = 0; i < rsCount; i += 1) {
                        lrs = this.recordStores[i];

                        results.push(
                            lrs.saveStatements(statements, { callback: callbackWrapper })
                        );
                    }
                }
                else {
                    this.log("[warning] sendStatements: No LRSs added yet (statements not sent)");
                    if (typeof callback === "function") {
                        callback.apply(this, [ null, statements ]);
                    }
                }
            }

            return {
                statements: statements,
                results: results
            };
        },

        /**
        @method getStatements
        @param {Object} [cfg] Configuration for request
            @param {Boolean} [cfg.sendActor] Include default actor in query params
            @param {Boolean} [cfg.sendActivity] Include default activity in query params
            @param {Object} [cfg.params] Parameters used to filter

            @param {Function} [cfg.callback] Function to run at completion

        TODO: support multiple LRSs and flag to use single
        */
        getStatements: function (cfg) {
            this.log("getStatements");
            var queryCfg = {},
                lrs,
                params
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
                    if (lrs.version === "0.9" || lrs.version === "0.95") {
                        params.actor = this.actor;
                    }
                    else {
                        params.agent = this.actor;
                    }
                }
                if (cfg.sendActivity && this.activity !== null) {
                    if (lrs.version === "0.9" || lrs.version === "0.95") {
                        params.target = this.activity;
                    }
                    else {
                        params.activity = this.activity;
                    }
                }
                if (typeof params.registration === "undefined" && this.registration !== null) {
                    params.registration = this.registration;
                }

                queryCfg = {
                    params: params
                };
                if (typeof cfg.callback !== "undefined") {
                    queryCfg.callback = cfg.callback;
                }

                return lrs.queryStatements(queryCfg);
            }

            this.log("[warning] getStatements: No LRSs added yet (statements not read)");
        },

        /**
        @method getState
        @param {String} key Key to retrieve from the state
        @param {Object} [cfg] Configuration for request
            @param {Object} [cfg.agent] Agent used in query,
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
                lrs
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
                    agent: (typeof cfg.agent !== "undefined" ? cfg.agent : this.actor),
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

            this.log("[warning] getState: No LRSs added yet (state not retrieved)");
        },

        /**
        @method setState
        @param {String} key Key to store into the state
        @param {String|Object} val Value to store into the state, objects will be stringified to JSON
        @param {Object} [cfg] Configuration for request
            @param {Object} [cfg.agent] Agent used in query,
                defaults to 'actor' property if empty
            @param {Object} [cfg.activity] Activity used in query,
                defaults to 'activity' property if empty
            @param {Object} [cfg.registration] Registration used in query,
                defaults to 'registration' property if empty
            @param {String} [cfg.lastSHA1] SHA1 of the previously seen existing state
            @param {String} [cfg.contentType] Content-Type to specify in headers
            @param {Function} [cfg.callback] Function to run with state
        */
        setState: function (key, val, cfg) {
            this.log("setState");
            var queryCfg,
                lrs
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
                    agent: (typeof cfg.agent !== "undefined" ? cfg.agent : this.actor),
                    activity: (typeof cfg.activity !== "undefined" ? cfg.activity : this.activity)
                };
                if (typeof cfg.registration !== "undefined") {
                    queryCfg.registration = cfg.registration;
                }
                else if (this.registration !== null) {
                    queryCfg.registration = this.registration;
                }
                if (typeof cfg.lastSHA1 !== "undefined") {
                    queryCfg.lastSHA1 = cfg.lastSHA1;
                }
                if (typeof cfg.contentType !== "undefined") {
                    queryCfg.contentType = cfg.contentType;
                }
                if (typeof cfg.callback !== "undefined") {
                    queryCfg.callback = cfg.callback;
                }

                return lrs.saveState(key, val, queryCfg);
            }

            this.log("[warning] setState: No LRSs added yet (state not saved)");
        },

        /**
        @method deleteState
        @param {String|null} key Key to remove from the state, or null to clear all
        @param {Object} [cfg] Configuration for request
            @param {Object} [cfg.agent] Agent used in query,
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
                lrs
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
                    agent: (typeof cfg.agent !== "undefined" ? cfg.agent : this.actor),
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

            this.log("[warning] deleteState: No LRSs added yet (state not deleted)");
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
                lrs
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

            this.log("[warning] getActivityProfile: No LRSs added yet (activity profile not retrieved)");
        },

        /**
        @method setActivityProfile
        @param {String} key Key to store into the activity profile
        @param {String|Object} val Value to store into the activity profile, objects will be stringified to JSON
        @param {Object} [cfg] Configuration for request
            @param {Object} [cfg.activity] Activity used in query,
                defaults to 'activity' property if empty
            @param {String} [cfg.lastSHA1] SHA1 of the previously seen existing profile
            @param {String} [cfg.contentType] Content-Type to specify in headers
            @param {Function} [cfg.callback] Function to run with activity profile
        */
        setActivityProfile: function (key, val, cfg) {
            this.log("setActivityProfile");
            var queryCfg,
                lrs
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
                if (typeof cfg.lastSHA1 !== "undefined") {
                    queryCfg.lastSHA1 = cfg.lastSHA1;
                }
                if (typeof cfg.contentType !== "undefined") {
                    queryCfg.contentType = cfg.contentType;
                }

                return lrs.saveActivityProfile(key, val, queryCfg);
            }

            this.log("[warning] setActivityProfile: No LRSs added yet (activity profile not saved)");
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
                lrs
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

            this.log("[warning] deleteActivityProfile: No LRSs added yet (activity profile not deleted)");
        },

        /**
        @method getAgentProfile
        @param {String} key Key to retrieve from the profile
        @param {Object} [cfg] Configuration for request
            @param {Object} [cfg.agent] Agent used in query,
                defaults to 'actor' property if empty
            @param {Function} [cfg.callback] Function to run with agent profile
        */
        getAgentProfile: function (key, cfg) {
            this.log("getAgentProfile");
            var queryCfg,
                lrs
            ;

            if (this.recordStores.length > 0) {
                //
                // for agent profiles (for now) we are only going to store to the first LRS
                // so only get from there too
                //
                // TODO: make this the first non-allowFail LRS but for now it should
                // be good enough to make it the first since we know the LMS provided
                // LRS is the first
                //
                lrs = this.recordStores[0];

                cfg = cfg || {};

                queryCfg = {
                    agent: (typeof cfg.agent !== "undefined" ? cfg.agent : this.actor)
                };
                if (typeof cfg.callback !== "undefined") {
                    queryCfg.callback = cfg.callback;
                }

                return lrs.retrieveAgentProfile(key, queryCfg);
            }

            this.log("[warning] getAgentProfile: No LRSs added yet (agent profile not retrieved)");
        },

        /**
        @method setAgentProfile
        @param {String} key Key to store into the agent profile
        @param {String|Object} val Value to store into the agent profile, objects will be stringified to JSON
        @param {Object} [cfg] Configuration for request
            @param {Object} [cfg.agent] Agent used in query,
                defaults to 'actor' property if empty
            @param {String} [cfg.lastSHA1] SHA1 of the previously seen existing profile
            @param {String} [cfg.contentType] Content-Type to specify in headers
            @param {Function} [cfg.callback] Function to run with agent profile
        */
        setAgentProfile: function (key, val, cfg) {
            this.log("setAgentProfile");
            var queryCfg,
                lrs
            ;

            if (this.recordStores.length > 0) {
                //
                // for agent profile (for now) we are only going to store to the first LRS
                // so only get from there too
                //
                // TODO: make this the first non-allowFail LRS but for now it should
                // be good enough to make it the first since we know the LMS provided
                // LRS is the first
                //
                lrs = this.recordStores[0];

                cfg = cfg || {};

                queryCfg = {
                    agent: (typeof cfg.agent !== "undefined" ? cfg.agent : this.actor)
                };
                if (typeof cfg.callback !== "undefined") {
                    queryCfg.callback = cfg.callback;
                }
                if (typeof cfg.lastSHA1 !== "undefined") {
                    queryCfg.lastSHA1 = cfg.lastSHA1;
                }
                if (typeof cfg.contentType !== "undefined") {
                    queryCfg.contentType = cfg.contentType;
                }

                return lrs.saveAgentProfile(key, val, queryCfg);
            }

            this.log("[warning] setAgentProfile: No LRSs added yet (agent profile not saved)");
        },

        /**
        @method deleteAgentProfile
        @param {String|null} key Key to remove from the agent profile, or null to clear all
        @param {Object} [cfg] Configuration for request
            @param {Object} [cfg.agent] Agent used in query,
                defaults to 'actor' property if empty
            @param {Function} [cfg.callback] Function to run with agent profile
        */
        deleteAgentProfile: function (key, cfg) {
            this.log("deleteAgentProfile");
            var queryCfg,
                lrs
            ;

            if (this.recordStores.length > 0) {
                //
                // for agent profile (for now) we are only going to store to the first LRS
                // so only get from there too
                //
                // TODO: make this the first non-allowFail LRS but for now it should
                // be good enough to make it the first since we know the LMS provided
                // LRS is the first
                //
                lrs = this.recordStores[0];

                cfg = cfg || {};

                queryCfg = {
                    agent: (typeof cfg.agent !== "undefined" ? cfg.agent : this.actor)
                };
                if (typeof cfg.callback !== "undefined") {
                    queryCfg.callback = cfg.callback;
                }

                return lrs.dropAgentProfile(key, queryCfg);
            }

            this.log("[warning] deleteAgentProfile: No LRSs added yet (agent profile not deleted)");
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
            "1.0.1",
            "1.0.0",
            "0.95",
            "0.9"
        ];
    };

    /*global module*/
    // Support the CommonJS method for exporting our single global
    if (typeof module === "object") {
        module.exports = TinCan;
    }
}());
