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
@submodule TinCan.Result
**/
(function () {
    "use strict";

    /**
    @class TinCan.Result
    @constructor
    */
    var Result = TinCan.Result = function (cfg) {
        this.log("constructor");

        /**
        @property score
        @type TinCan.Score|null
        */
        this.score = null;

        /**
        @property success
        @type Boolean|null
        */
        this.success = null;

        /**
        @property completion
        @type Boolean|null
        */
        this.completion = null;

        /**
        @property duration
        @type String|null
        */
        this.duration = null;

        /**
        @property response
        @type String|null
        */
        this.response = null;

        /**
        @property extensions
        @type Object|null
        */
        this.extensions = null;

        this.init(cfg);
    };
    Result.prototype = {
        /**
        @property LOG_SRC
        */
        LOG_SRC: "Result",

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
                    "completion",
                    "duration",
                    "extensions",
                    "response",
                    "success"
                ]
            ;

            cfg = cfg || {};

            if (cfg.hasOwnProperty("score") && cfg.score !== null) {
                if (cfg.score instanceof TinCan.Score) {
                    this.score = cfg.score;
                }
                else {
                    this.score = new TinCan.Score (cfg.score);
                }
            }

            for (i = 0; i < directProps.length; i += 1) {
                if (cfg.hasOwnProperty(directProps[i]) && cfg[directProps[i]] !== null) {
                    this[directProps[i]] = cfg[directProps[i]];
                }
            }

            // 0.9 used a string, store it internally as a bool
            if (this.completion === "Completed") {
                this.completion = true;
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
                    "success",
                    "duration",
                    "response",
                    "extensions"
                ],
                optionalObjProps = [
                    "score"
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
            if (this.completion !== null) {
                if (version === "0.9") {
                    if (this.completion) {
                        result.completion = "Completed";
                    }
                }
                else {
                    result.completion = this.completion;
                }
            }

            return result;
        }
    };

    /**
    @method fromJSON
    @return {Object} Result
    @static
    */
    Result.fromJSON = function (resultJSON) {
        Result.prototype.log("fromJSON");
        var _result = JSON.parse(resultJSON);

        return new Result(_result);
    };
}());
