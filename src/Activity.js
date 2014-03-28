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
@submodule TinCan.Activity
**/
(function () {
    "use strict";

    /**
    @class TinCan.Activity
    @constructor
    */
    var Activity = TinCan.Activity = function (cfg) {
        this.log("constructor");

        /**
        @property objectType
        @type String
        @default Activity
        */
        this.objectType = "Activity";

        /**
        @property id
        @type String
        */
        this.id = null;

        /**
        @property definition
        @type TinCan.ActivityDefinition
        */
        this.definition = null;

        this.init(cfg);
    };
    Activity.prototype = {
        /**
        @property LOG_SRC
        */
        LOG_SRC: "Activity",

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

            cfg = cfg || {};

            if (cfg.hasOwnProperty("definition")) {
                if (cfg.definition instanceof TinCan.ActivityDefinition) {
                    this.definition = cfg.definition;
                } else {
                    this.definition = new TinCan.ActivityDefinition (cfg.definition);
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
        @return {String} String representation of the activity
        */
        toString: function (lang) {
            this.log("toString");
            var defString = "";

            if (this.definition !== null) {
                defString = this.definition.toString(lang);
                if (defString !== "") {
                    return defString;
                }
            }

            if (this.id !== null) {
                return this.id;
            }

            return "Activity: unidentified";
        },

        /**
        @method asVersion
        @param {String} [version] Version to return (defaults to newest supported)
        */
        asVersion: function (version) {
            this.log("asVersion");
            var result = {
                id: this.id,
                objectType: this.objectType
            };

            version = version || TinCan.versions()[0];

            if (this.definition !== null) {
                result.definition = this.definition.asVersion(version);
            }

            return result;
        }
    };

    /**
    @method fromJSON
    @return {Object} Activity
    @static
    */
    Activity.fromJSON = function (activityJSON) {
        Activity.prototype.log("fromJSON");
        var _activity = JSON.parse(activityJSON);

        return new Activity(_activity);
    };
}());
