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
@submodule TinCan.ActivityDefinition
**/
(function () {
    "use strict";

    /**
    @class TinCan.ActivityDefinition
    @constructor
    */
    var ActivityDefinition = TinCan.ActivityDefinition = function (cfg) {
        this.log("constructor");

        /**
        @property name
        @type Object
        */
        this.name = null;

        /**
        @property description
        @type Object
        */
        this.description = null;

        /**
        @property type
        @type String
        */
        this.type = null;

        /**
        @property extensions
        @type Object
        */
        this.extensions = null;

        /**
        @property interactionType
        @type Object
        */
        this.interactionType = null;

        /**
        @property correctResponsesPattern
        @type Array
        */
        this.correctResponsesPattern = null;

        /**
        @property choices
        @type Array
        */
        this.choices = null;

        /**
        @property scale
        @type Array
        */
        this.scale = null;

        /**
        @property source
        @type Array
        */
        this.source = null;

        /**
        @property target
        @type Array
        */
        this.target = null;

        /**
        @property steps
        @type Array
        */
        this.steps = null;

        this.init(cfg);
    };
    ActivityDefinition.prototype = {
        /**
        @property LOG_SRC
        */
        LOG_SRC: 'ActivityDefinition',

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
                    "name",
                    "description",
                    "type",
                    "interactionType",
                    "extensions"
                ]
            ;

            cfg = cfg || {};

            // TODO: verify type is URI?
            // TODO: verify interaction types and formats
            // TODO: handle creation of interaction components

            if (cfg.hasOwnProperty("definition")) {
                // TODO: check to see if already this type
                this.definition = new TinCan.ActivityDefinition (cfg.definition);
            }

            for (i = 0; i < directProps.length; i += 1) {
                if (cfg.hasOwnProperty(directProps[i]) && cfg[directProps[i]] !== null) {
                    this[directProps[i]] = cfg[directProps[i]];
                }
            }
        },

        /**
        @method toString
        @return {String} String representation of the definition
        */
        toString: function (lang) {
            this.log("toString");

            if (this.name !== null) {
                return this.getLangDictionaryValue("name", lang);
            }

            if (this.description !== null) {
                return this.getLangDictionaryValue("description", lang);
            }

            return "";
        },

        /**
        @method asVersion
        @param {Object} [options]
        @param {String} [options.version] Version to return (defaults to newest supported)
        */
        asVersion: function (version) {
            this.log("asVersion");
            var result = {},
                directProps = [
                    "name",
                    "description",
                    "type",
                    "interactionType",
                    "extensions"
                ],
                i
            ;

            version = version || TinCan.versions()[0];

            for (i = 0; i < directProps.length; i += 1) {
                if (this[directProps[i]] !== null) {
                    result[directProps[i]] = this[directProps[i]];
                }
            }

            return result;
        },

        getLangDictionaryValue: TinCan.Utils.getLangDictionaryValue
    };

    /**
    @method fromJSON
    @return {Object} ActivityDefinition
    @static
    */
    ActivityDefinition.fromJSON = function (definitionJSON) {
        ActivityDefinition.prototype.log("fromJSON");
        var _definition = JSON.parse(definitionJSON);

        return new ActivityDefinition(_definition);
    };
}());
