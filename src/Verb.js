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
@submodule TinCan.Verb
*/
(function () {
    "use strict";

    /**
    @class TinCan.Verb
    @constructor
    */
    var Verb = TinCan.Verb = function (cfg) {
        this.log("constructor");

        /**
        @property id
        @type String
        */
        this.id = null;

        this.init(cfg);
    };
    Verb.prototype = {
        /**
        @property LOG_SRC
        */
        LOG_SRC: 'Verb',

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
                    "id"
                ]
            ;

            if (typeof cfg === "string") {
                this.id = cfg;
            }
            else {
                cfg = cfg || {};

                for (i = 0; i < directProps.length; i += 1) {
                    if (cfg.hasOwnProperty(directProps[i]) && cfg[directProps[i]] !== null) {
                        this[directProps[i]] = cfg[directProps[i]];
                    }
                }
            }

            // TODO: check for acceptable verb list in 0.90
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

            if (version === "0.95") {
                result = {
                    id: this.id
                };
            }
            else if (version === "0.90") {
                result = this.id;
            }

            return result;
        }
    };

    /**
    @method fromJSON
    @return {Object} Verb
    @static
    */
    Verb.fromJSON = function (verbJSON) {
        Verb.prototype.log("fromJSON");
        var _verb = JSON.parse(verbJSON);

        return new Verb(_verb);
    };
}());
