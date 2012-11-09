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
        @type String
        */
        this.registration = null;

        /**
        @property instructor
        @type Object
        */
        this.instructor = null;

        /**
        @property team
        @type Object
        */
        this.team = null;

        /**
        @property contextActivities
        @type Object
        */
        this.contextActivities = {
            parent: null,
            grouping: null,
            other: null
        };

        /**
        @property revision
        @type Object
        */
        this.revision = null;

        /**
        @property platform
        @type Object
        */
        this.platform = null;

        /**
        @property language
        @type String
        */
        this.language = null;

        /**
        @property statement
        @type String
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
        LOG_SRC: 'Context',

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
                    "instructor",
                    "team",
                    "revision",
                    "platform",
                    "language",
                    "statement",
                    "extensions"
                ],
                val
            ;

            cfg = cfg || {};

            // TODO: handle contextActivities

            for (i = 0; i < directProps.length; i += 1) {
                if (cfg.hasOwnProperty(directProps[i]) && cfg[directProps[i]] !== null) {
                    this[directProps[i]] = cfg[directProps[i]];
                }
            }
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
