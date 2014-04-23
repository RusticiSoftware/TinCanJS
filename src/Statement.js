/*
    Copyright 2012-3 Rustici Software

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
@submodule TinCan.Statement
**/
(function () {
    "use strict";

    /**
    @class TinCan.Statement
    @constructor
    @param {Object} [cfg] Values to set in properties
        @param {String} [cfg.id] Statement ID (UUID)
        @param {TinCan.Agent} [cfg.actor] Actor of statement
        @param {TinCan.Verb} [cfg.verb] Verb of statement
        @param {TinCan.Activity|TinCan.Agent|TinCan.Group|TinCan.StatementRef|TinCan.SubStatement} [cfg.object] Alias for 'target'
        @param {TinCan.Activity|TinCan.Agent|TinCan.Group|TinCan.StatementRef|TinCan.SubStatement} [cfg.target] Object of statement
        @param {TinCan.Result} [cfg.result] Statement Result
        @param {TinCan.Context} [cfg.context] Statement Context
        @param {TinCan.Agent} [cfg.authority] Statement Authority
        @param {String} [cfg.timestamp] ISO8601 Date/time value
        @param {String} [cfg.stored] ISO8601 Date/time value
        @param {String} [cfg.version] Version of the statement (post 0.95)
    @param {Object} [initCfg] Configuration of initialization process
        @param {Integer} [initCfg.storeOriginal] Whether to store a JSON stringified version
            of the original options object, pass number of spaces used for indent
        @param {Boolean} [initCfg.doStamp] Whether to automatically set the 'id' and 'timestamp'
            properties (default: true)
    **/
    var Statement = TinCan.Statement = function (cfg, initCfg) {
        this.log("constructor");

        // check for true value for API backwards compat
        if (typeof initCfg === "number") {
            initCfg = {
                storeOriginal: initCfg
            };
        } else {
            initCfg = initCfg || {};
        }
        if (typeof initCfg.storeOriginal === "undefined") {
            initCfg.storeOriginal = null;
        }
        if (typeof initCfg.doStamp === "undefined") {
            initCfg.doStamp = true;
        }

        /**
        @property id
        @type String
        */
        this.id = null;

        /**
        @property actor
        @type TinCan.Agent|TinCan.Group|null
        */
        this.actor = null;

        /**
        @property verb
        @type TinCan.Verb|null
        */
        this.verb = null;

        /**
        @property target
        @type TinCan.Activity|TinCan.Agent|TinCan.Group|TinCan.StatementRef|TinCan.SubStatement|null
        */
        this.target = null;

        /**
        @property result
        @type Object
        */
        this.result = null;

        /**
        @property context
        @type Object
        */
        this.context = null;

        /**
        @property timestamp
        @type String
        */
        this.timestamp = null;

        /**
        @property stored
        @type String
        */
        this.stored = null;

        /**
        @property authority
        @type TinCan.Agent|null
        */
        this.authority = null;

        /**
        @property version
        @type String
        */
        this.version = null;

        /**
        @property degraded
        @type Boolean
        @default false
        */
        this.degraded = false;

        /**
        @property voided
        @type Boolean
        @default null
        @deprecated
        */
        this.voided = null;

        /**
        @property inProgress
        @type Boolean
        @deprecated
        */
        this.inProgress = null;

        /**
        @property originalJSON
        @type String
        */
        this.originalJSON = null;

        this.init(cfg, initCfg);
    };

    Statement.prototype = {
        /**
        @property LOG_SRC
        */
        LOG_SRC: "Statement",

        /**
        @method log
        */
        log: TinCan.prototype.log,

        /**
        @method init
        @param {Object} [properties] Configuration used to set properties (see constructor)
        @param {Object} [cfg] Configuration used to initialize (see constructor)
        */
        init: function (cfg, initCfg) {
            this.log("init");
            var i,
                directProps = [
                    "id",
                    "stored",
                    "timestamp",
                    "version",
                    "inProgress",
                    "voided"
                ];

            cfg = cfg || {};

            if (initCfg.storeOriginal) {
                this.originalJSON = JSON.stringify(cfg, null, initCfg.storeOriginal);
            }

            if (cfg.hasOwnProperty("object")) {
                cfg.target = cfg.object;
            }

            if (cfg.hasOwnProperty("actor")) {
                if (typeof cfg.actor.objectType === "undefined" || cfg.actor.objectType === "Person") {
                    cfg.actor.objectType = "Agent";
                }

                if (cfg.actor.objectType === "Agent") {
                    if (cfg.actor instanceof TinCan.Agent) {
                        this.actor = cfg.actor;
                    } else {
                        this.actor = new TinCan.Agent (cfg.actor);
                    }
                } else if (cfg.actor.objectType === "Group") {
                    if (cfg.actor instanceof TinCan.Group) {
                        this.actor = cfg.actor;
                    } else {
                        this.actor = new TinCan.Group (cfg.actor);
                    }
                }
            }
            if (cfg.hasOwnProperty("authority")) {
                if (typeof cfg.authority.objectType === "undefined" || cfg.authority.objectType === "Person") {
                    cfg.authority.objectType = "Agent";
                }

                if (cfg.authority.objectType === "Agent") {
                    if (cfg.authority instanceof TinCan.Agent) {
                        this.authority = cfg.authority;
                    } else {
                        this.authority = new TinCan.Agent (cfg.authority);
                    }
                } else if (cfg.authority.objectType === "Group") {
                    if (cfg.actor instanceof TinCan.Group) {
                        this.authority = cfg.authority;
                    } else {
                        this.authority = new TinCan.Group (cfg.authority);
                    }
                }
            }
            if (cfg.hasOwnProperty("verb")) {
                if (cfg.verb instanceof TinCan.Verb) {
                    this.verb = cfg.verb;
                } else {
                    this.verb = new TinCan.Verb (cfg.verb);
                }
            }
            if (cfg.hasOwnProperty("target")) {
                if (cfg.target instanceof TinCan.Activity ||
                    cfg.target instanceof TinCan.Agent ||
                    cfg.target instanceof TinCan.Group ||
                    cfg.target instanceof TinCan.SubStatement ||
                    cfg.target instanceof TinCan.StatementRef
                ) {
                    this.target = cfg.target;
                } else {
                    if (typeof cfg.target.objectType === "undefined") {
                        cfg.target.objectType = "Activity";
                    }

                    if (cfg.target.objectType === "Activity") {
                        this.target = new TinCan.Activity (cfg.target);
                    } else if (cfg.target.objectType === "Agent") {
                        this.target = new TinCan.Agent (cfg.target);
                    } else if (cfg.target.objectType === "Group") {
                        this.target = new TinCan.Group (cfg.target);
                    } else if (cfg.target.objectType === "SubStatement") {
                        this.target = new TinCan.SubStatement (cfg.target);
                    } else if (cfg.target.objectType === "StatementRef") {
                        this.target = new TinCan.StatementRef (cfg.target);
                    } else {
                        this.log("Unrecognized target type: " + cfg.target.objectType);
                    }
                }
            }
            if (cfg.hasOwnProperty("result")) {
                if (cfg.result instanceof TinCan.Result) {
                    this.result = cfg.result;
                } else {
                    this.result = new TinCan.Result (cfg.result);
                }
            }
            if (cfg.hasOwnProperty("context")) {
                if (cfg.context instanceof TinCan.Context) {
                    this.context = cfg.context;
                } else {
                    this.context = new TinCan.Context (cfg.context);
                }
            }

            for (i = 0; i < directProps.length; i += 1) {
                if (cfg.hasOwnProperty(directProps[i]) && cfg[directProps[i]] !== null) {
                    this[directProps[i]] = cfg[directProps[i]];
                }
            }

            if (initCfg.doStamp) {
                this.stamp();
            }
        },

        /**
        @method toString
        @return {String} String representation of the statement
        */
        toString: function (lang) {
            this.log("toString");
            return (this.actor !== null ? this.actor.toString(lang) : "") +
                    " " +
                    (this.verb !== null ? this.verb.toString(lang) : "") +
                    " " +
                    (this.target !== null ? this.target.toString(lang) : "");
        },

        /**
        @method asVersion
        @param {String} [version] Version to return (defaults to newest supported)
        */
        asVersion: function (version) {
            this.log("asVersion");
            var result = {},
                optionalDirectProps = [
                    "id",
                    "timestamp"
                ],
                optionalObjProps = [
                    "actor",
                    "verb",
                    "result",
                    "context",
                    "authority"
                ],
                i;

            version = version || TinCan.versions()[0];

            for (i = 0; i < optionalDirectProps.length; i += 1) {
                if (this[optionalDirectProps[i]] !== null) {
                    result[optionalDirectProps[i]] = this[optionalDirectProps[i]];
                }
            }
            for (i = 0; i < optionalObjProps.length; i += 1) {
                if (this[optionalObjProps[i]] !== null) {
                    result[optionalObjProps[i]] = this[optionalObjProps[i]].asVersion(version);
                }
            }
            if (this.target !== null) {
                result.object = this.target.asVersion(version);
            }

            if (version === "0.9" || version === "0.95") {
                if (this.voided !== null) {
                    result.voided = this.voided;
                }
            }
            if (version === "0.9" && this.inProgress !== null) {
                result.inProgress = this.inProgress;
            }

            return result;
        },

        /**
        Sets 'id' and 'timestamp' properties if not already set

        @method stamp
        */
        stamp: function () {
            this.log("stamp");
            if (this.id === null) {
                this.id = TinCan.Utils.getUUID();
            }
            if (this.timestamp === null) {
                this.timestamp = TinCan.Utils.getISODateString(new Date());
            }
        }
    };

    /**
    @method fromJSON
    @return {Object} Statement
    @static
    */
    Statement.fromJSON = function (stJSON) {
        Statement.prototype.log("fromJSON");
        var _st = JSON.parse(stJSON);

        return new Statement(_st);
    };
}());
