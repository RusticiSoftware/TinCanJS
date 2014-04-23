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
@submodule TinCan.ActivityProfile
**/
(function () {
    "use strict";

    /**
    @class TinCan.ActivityProfile
    @constructor
    */
    var ActivityProfile = TinCan.ActivityProfile = function (cfg) {
        this.log("constructor");

        /**
        @property id
        @type String
        */
        this.id = null;

        /**
        @property activity
        @type TinCan.Activity
        */
        this.activity = null;

        /**
        @property updated
        @type String
        */
        this.updated = null;

        /**
        @property contents
        @type String
        */
        this.contents = null;

        /**
        SHA1 of contents as provided by the server during last fetch,
        this should be passed through to saveActivityProfile

        @property etag
        @type String
        */
        this.etag = null;

        /**
        @property contentType
        @type String
        */
        this.contentType = null;

        this.init(cfg);
    };
    ActivityProfile.prototype = {
        /**
        @property LOG_SRC
        */
        LOG_SRC: "ActivityProfile",

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
                    "contents",
                    "etag",
                    "contentType"
                ];

            cfg = cfg || {};

            if (cfg.hasOwnProperty("activity")) {
                if (cfg.activity instanceof TinCan.Activity) {
                    this.activity = cfg.activity;
                }
                else {
                    this.activity = new TinCan.Activity (cfg.activity);
                }
            }

            for (i = 0; i < directProps.length; i += 1) {
                if (cfg.hasOwnProperty(directProps[i]) && cfg[directProps[i]] !== null) {
                    this[directProps[i]] = cfg[directProps[i]];
                }
            }

            this.updated = false;
        }
    };

    /**
    @method fromJSON
    @return {Object} ActivityProfile
    @static
    */
    ActivityProfile.fromJSON = function (stateJSON) {
        ActivityProfile.prototype.log("fromJSON");
        var _state = JSON.parse(stateJSON);

        return new ActivityProfile(_state);
    };
}());
