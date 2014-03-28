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
@submodule TinCan.Context
**/
(function () {
    "use strict";

    /**
    @class TinCan.Context
    @constructor
    */
    var Context = TinCan.Context = function (cfg) {
        this.log("constructor");

        /**
        @property registration
        @type String|null
        */
        this.registration = null;

        /**
        @property instructor
        @type TinCan.Agent|TinCan.Group|null
        */
        this.instructor = null;

        /**
        @property team
        @type TinCan.Agent|TinCan.Group|null
        */
        this.team = null;

        /**
        @property contextActivities
        @type ContextActivities|null
        */
        this.contextActivities = null;

        /**
        @property revision
        @type String|null
        */
        this.revision = null;

        /**
        @property platform
        @type Object|null
        */
        this.platform = null;

        /**
        @property language
        @type String|null
        */
        this.language = null;

        /**
        @property statement
        @type StatementRef|null
        */
        this.statement = null;

        /**
        @property extensions
        @type String
        */
        this.extensions = null;

        this.init(cfg);
    };
    Context.prototype = {
        /**
        @property LOG_SRC
        */
        LOG_SRC: "Context",

        /**
        @method log
        */
        log: TinCan.prototype.log,

        /**
        @method init
        @param {Object} [options] Configuration used to initialize
        */
        init: function (cfg) {
            this.log("init");

            var i,
                directProps = [
                    "registration",
                    "revision",
                    "platform",
                    "language",
                    "statement",
                    "extensions"
                ],
                agentGroupProps = [
                    "instructor",
                    "team"
                ],
                prop,
                val
            ;

            cfg = cfg || {};

            for (i = 0; i < directProps.length; i += 1) {
                prop = directProps[i];
                if (cfg.hasOwnProperty(prop) && cfg[prop] !== null) {
                    this[prop] = cfg[prop];
                }
            }
            for (i = 0; i < agentGroupProps.length; i += 1) {
                prop = agentGroupProps[i];
                if (cfg.hasOwnProperty(prop) && cfg[prop] !== null) {
                    val = cfg[prop];

                    if (typeof val.objectType === "undefined" || val.objectType === "Person") {
                        val.objectType = "Agent";
                    }

                    if (val.objectType === "Agent" && ! (val instanceof TinCan.Agent)) {
                        val = new TinCan.Agent (val);
                    } else if (val.objectType === "Group" && ! (val instanceof TinCan.Group)) {
                        val = new TinCan.Group (val);
                    }

                    this[prop] = val;
                }
            }

            if (cfg.hasOwnProperty("contextActivities") && cfg.contextActivities !== null) {
                if (cfg.contextActivities instanceof TinCan.ContextActivities) {
                    this.contextActivities = cfg.contextActivities;
                }
                else {
                    this.contextActivities = new TinCan.ContextActivities(cfg.contextActivities);
                }
            }
        },

        /**
        @method asVersion
        @param {String} [version] Version to return (defaults to newest supported)
        */
        asVersion: function (version) {
            this.log("asVersion");
            var result = {},
                optionalDirectProps = [
                    "registration",
                    "revision",
                    "platform",
                    "language",
                    "extensions"
                ],
                optionalObjProps = [
                    "instructor",
                    "team",
                    "contextActivities",
                    "statement"
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

            return result;
        }
    };

    /**
    @method fromJSON
    @return {Object} Context
    @static
    */
    Context.fromJSON = function (contextJSON) {
        Context.prototype.log("fromJSON");
        var _context = JSON.parse(contextJSON);

        return new Context(_context);
    };
}());
