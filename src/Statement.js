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
@submodule TinCan.Statement
**/
(function () {
    "use strict";

    /**
    @class TinCan.Statement
    @constructor
    @param {Object} [cfg] Configuration used to initialize.
        @param {Object} [cfg.id] Statement ID
        @param {TinCan.Agent} [cfg.actor] Actor of statement
        @param {TinCan.Verb} [cfg.verb] Verb of statement
        @param {TinCan.Activity|TinCan.Agent|TinCan.StatementRef|TinCan.SubStatement} [cfg.object] Alias for 'target'
        @param {TinCan.Activity|TinCan.Agent|TinCan.StatementRef|TinCan.SubStatement} [cfg.target] Object of statement
        @param {TinCan.Result} [cfg.result] Statement Result
        @param {TinCan.Context} [cfg.context] Statement Context
        @param {Object} [cfg.authority] Statement Authority
        @param {Boolean} [cfg.voided] Whether the statement has been voided
        @param {Boolean} [cfg.inProgress] Whether the statement is in progress
    @param {Integer} [storeOriginal] Whether to store a JSON stringified version
        of the original options object, pass number of spaces used for indent
    **/
    var Statement = TinCan.Statement = function (cfg, storeOriginal) {
        this.log("constructor");

        /**
        @property id
        @type String
        */
        this.id = null;

        /**
        @property actor
        @type Object
        */
        this.actor = null;

        /**
        @property verb
        @type Object
        */
        this.verb = null;

        /**
        @property target
        @type Object
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
        @type Date
        */
        this.timestamp = null;

        /**
        @property stored
        @type Date
        */
        this.stored = null;

        /**
        @property authority
        @type Object
        */
        this.authority = null;

        /**
        @property voided
        @type Boolean
        @default false
        */
        this.voided = false;

        /**
        @property degraded
        @type Boolean
        @default false
        */
        this.degraded = false;

        /**
        @property inProgress
        @type Boolean
        @default false
        @deprecated
        */
        this.inProgress = false;

        /**
        @property originalJSON
        @type String
        */
        this.originalJSON = null;

        if (storeOriginal) {
            this.originalJSON = JSON.stringify(cfg, null, storeOriginal);
        }

        this.init(cfg);
    };

    Statement.prototype = {
        /**
        @property LOG_SRC
        */
        LOG_SRC: 'Statement',

        /**
        @method log
        */
        log: TinCan.prototype.log,

        /**
        @method init
        @param {Object} [options] Configuration used to initialize (see constructor)
        */
        init: function (cfg) {
            this.log("init");
            var i,
                directProps = [
                    "stored",
                    "timestamp",
                    "inProgress",
                    "voided"
                ],
                val
            ;

            cfg = cfg || {};

            if (this.id === null) {
                this.id = TinCan.Utils.getUUID();
            }

            if (cfg.hasOwnProperty("object")) {
                cfg.target = cfg.object;
            }

            if (cfg.hasOwnProperty("actor")) {
                // TODO: check to see if already this type
                this.actor = new TinCan.Agent (cfg.actor);
            }
            if (cfg.hasOwnProperty("verb")) {
                // TODO: check to see if already this type
                this.verb = new TinCan.Verb (cfg.verb);
            }
            if (cfg.hasOwnProperty("target")) {
                // TODO: check to see if already this type,
                //       need to look at object type rather
                //       than assuming Activity
                this.target = new TinCan.Activity (cfg.target);
            }
            if (cfg.hasOwnProperty("result")) {
                // TODO: check to see if already this type
                this.result = new TinCan.Result (cfg.result);
            }

            for (i = 0; i < directProps.length; i += 1) {
                if (cfg.hasOwnProperty(directProps[i]) && cfg[directProps[i]] !== null) {
                    this[directProps[i]] = cfg[directProps[i]];
                }
            }
        },

        /**
        @method toString
        @return {String} String representation of the statement
        */
        toString: function (lang) {
            this.log("toString");
            return this.actor.toString() + " " + this.verb.toString() + " " + this.target.toString();
        },

        /**
        @method asVersion
        @param {Object} [options]
        @param {String} [options.version] Version to return (defaults to newest supported)
        */
        asVersion: function (version) {
            this.log("asVersion");
            var result;

            version = version || TinCan.versions()[0];

            result = {
                actor: this.actor.asVersion(version),
                verb: this.verb.asVersion(version),
                object: this.target.asVersion(version)
            };
            if (this.result !== null) {
                result.result = this.result.asVersion(version);
            }

            // TODO: add timestamp

            return result;
        }
    };
}());
