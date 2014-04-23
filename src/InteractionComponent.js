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
@submodule TinCan.InteractionComponent
**/
(function () {
    "use strict";

    /**
    @class TinCan.InteractionComponent
    @constructor
    */
    var InteractionComponent = TinCan.InteractionComponent = function (cfg) {
        this.log("constructor");

        /**
        @property id
        @type String
        */
        this.id = null;

        /**
        @property description
        @type Object
        */
        this.description = null;

        this.init(cfg);
    };
    InteractionComponent.prototype = {
        /**
        @property LOG_SRC
        */
        LOG_SRC: "InteractionComponent",

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
                    "id",
                    "description"
                ]
            ;

            cfg = cfg || {};

            for (i = 0; i < directProps.length; i += 1) {
                if (cfg.hasOwnProperty(directProps[i]) && cfg[directProps[i]] !== null) {
                    this[directProps[i]] = cfg[directProps[i]];
                }
            }
        },

        /**
        @method asVersion
        @param {String} [version] Version to return (defaults to newest supported)
        */
        asVersion: function (version) {
            this.log("asVersion");
            var result = {
                    id: this.id
                },
                optionalDirectProps = [
                    "description"
                ],
                i,
                prop;

            version = version || TinCan.versions()[0];

            for (i = 0; i < optionalDirectProps.length; i += 1) {
                prop = optionalDirectProps[i];
                if (this[prop] !== null) {
                    result[prop] = this[prop];
                }
            }

            return result;
        },

        /**
        See {{#crossLink "TinCan.Utils/getLangDictionaryValue"}}{{/crossLink}}

        @method getLangDictionaryValue
        */
        getLangDictionaryValue: TinCan.Utils.getLangDictionaryValue
    };

    /**
    @method fromJSON
    @return {Object} InteractionComponent
    @static
    */
    InteractionComponent.fromJSON = function (icJSON) {
        InteractionComponent.prototype.log("fromJSON");
        var _ic = JSON.parse(icJSON);

        return new InteractionComponent(_ic);
    };
}());
