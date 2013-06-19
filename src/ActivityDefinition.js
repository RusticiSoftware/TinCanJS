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

    //
    // this represents the full set of activity definition types that were
    // allowed by the .9 spec version, if an object is created with one of
    // the short forms it will be upconverted to the matching long form,
    // for local storage and use and if an object is needed in .9 version
    // consequently down converted
    //
    // hopefully this list will never grow (or change) and only the exact
    // ADL compatible URLs should be matched
    //
    var _downConvertMap = {
        "http://adlnet.gov/expapi/activities/course": "course",
        "http://adlnet.gov/expapi/activities/module": "module",
        "http://adlnet.gov/expapi/activities/meeting": "meeting",
        "http://adlnet.gov/expapi/activities/media": "media",
        "http://adlnet.gov/expapi/activities/performance": "performance",
        "http://adlnet.gov/expapi/activities/simulation": "simulation",
        "http://adlnet.gov/expapi/activities/assessment": "assessment",
        "http://adlnet.gov/expapi/activities/interaction": "interaction",
        "http://adlnet.gov/expapi/activities/cmi.interaction": "cmi.interaction",
        "http://adlnet.gov/expapi/activities/question": "question",
        "http://adlnet.gov/expapi/activities/objective": "objective",
        "http://adlnet.gov/expapi/activities/link": "link"
    },

    /**
    @class TinCan.ActivityDefinition
    @constructor
    */
    ActivityDefinition = TinCan.ActivityDefinition = function (cfg) {
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
        @property moreInfo
        @type String
        */
        this.moreInfo = null;

        /**
        @property extensions
        @type Object
        */
        this.extensions = null;

        /**
        @property interactionType
        @type String
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
        LOG_SRC: "ActivityDefinition",

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
                j,
                prop,
                directProps = [
                    "name",
                    "description",
                    "moreInfo",
                    "extensions",
                    "correctResponsesPattern"
                ],
                interactionComponentProps = []
            ;

            cfg = cfg || {};

            if (cfg.hasOwnProperty("type") && cfg.type !== null) {
                // TODO: verify type is URI?
                for (prop in _downConvertMap) {
                    if (_downConvertMap.hasOwnProperty(prop) && _downConvertMap[prop] === cfg.type) {
                        cfg.type = _downConvertMap[prop];
                    }
                }
                this.type = cfg.type;
            }

            if (cfg.hasOwnProperty("interactionType") && cfg.interactionType !== null) {
                // TODO: verify interaction type in acceptable set?
                this.interactionType = cfg.interactionType;
                if (cfg.interactionType === "choice" || cfg.interactionType === "sequencing") {
                    interactionComponentProps.push("choices");
                }
                else if (cfg.interactionType === "likert") {
                    interactionComponentProps.push("scale");
                }
                else if (cfg.interactionType === "matching") {
                    interactionComponentProps.push("source");
                    interactionComponentProps.push("target");
                }
                else if (cfg.interactionType === "performance") {
                    interactionComponentProps.push("steps");
                }

                if (interactionComponentProps.length > 0) {
                    for (i = 0; i < interactionComponentProps.length; i += 1) {
                        prop = interactionComponentProps[i];
                        if (cfg.hasOwnProperty(prop) && cfg[prop] !== null) {
                            this[prop] = [];
                            for (j = 0; j < cfg[prop].length; j += 1) {
                                if (cfg[prop][j] instanceof TinCan.InteractionComponent) {
                                    this[prop].push(cfg[prop][j]);
                                } else {
                                    this[prop].push(
                                        new TinCan.InteractionComponent (
                                            cfg[prop][j]
                                        )
                                    );
                                }
                            }
                        }
                    }
                }
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
        @param {String} [version] Version to return (defaults to newest supported)
        */
        asVersion: function (version) {
            this.log("asVersion");
            var result = {},
                directProps = [
                    "name",
                    "description",
                    "interactionType",
                    "correctResponsesPattern",
                    "extensions"
                ],
                interactionComponentProps = [
                    "choices",
                    "scale",
                    "source",
                    "target",
                    "steps"
                ],
                i,
                j,
                prop
            ;

            version = version || TinCan.versions()[0];

            if (this.type !== null) {
                if (version === "0.9") {
                    result.type = _downConvertMap[this.type];
                }
                else {
                    result.type = this.type;
                }
            }

            for (i = 0; i < directProps.length; i += 1) {
                prop = directProps[i];
                if (this[prop] !== null) {
                    result[prop] = this[prop];
                }
            }

            for (i = 0; i < interactionComponentProps.length; i += 1) {
                prop = interactionComponentProps[i];
                if (this[prop] !== null) {
                    result[prop] = [];
                    for (j = 0; j < this[prop].length; j += 1) {
                        result[prop].push(
                            this[prop][j].asVersion(version)
                        );
                    }
                }
            }

            if (version.indexOf("0.9") !== 0) {
                if (this.moreInfo !== null) {
                    result.moreInfo = this.moreInfo;
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
    @return {Object} ActivityDefinition
    @static
    */
    ActivityDefinition.fromJSON = function (definitionJSON) {
        ActivityDefinition.prototype.log("fromJSON");
        var _definition = JSON.parse(definitionJSON);

        return new ActivityDefinition(_definition);
    };
}());
