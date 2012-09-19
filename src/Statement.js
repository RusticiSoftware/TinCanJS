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
    @param {Object} [options] Configuration used to initialize.
        @param {Object} [options.actor] Actor of statement
        @param {Object} [options.verb] Verb of statement
        @param {Object} [options.object] Object of statement
    **/
    var Statement = TinCan.Statement = function (cfg) {
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
        @property object
        @type Object
        */
        this.object = null;

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
        @property authority
        @type Object
        */
        this.authority = null;

        /**
        @property voided
        @type Boolean
        */
        this.voided = false;

        /**
        @property inProgress
        @type Boolean
        */
        this.inProgress = false;

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
        @param {Object} [options] Configuration used to initialize
        */
        init: function (cfg) {
            this.log("init");

            cfg = cfg || {};

            if (this.id === null) {
                this.id = TinCan.Utils.getUUID();
            }

            if (cfg.hasOwnProperty("actor")) {
                this.actor = new TinCan.Agent (cfg.actor);
            }
            if (cfg.hasOwnProperty("verb")) {
                this.verb = new TinCan.Verb (cfg.verb);
            }
            if (cfg.hasOwnProperty("target")) {
                this.target = new TinCan.Activity (cfg.target);
            }
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
