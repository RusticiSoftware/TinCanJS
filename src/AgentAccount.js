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
@submodule TinCan.AgentAccount
**/
(function () {
    "use strict";

    /**
    @class TinCan.AgentAccount
    @constructor
    */
    var AgentAccount = TinCan.AgentAccount = function (cfg) {
        this.log("constructor");

        /**
        @property homePage
        @type String
        */
        this.homePage = null;

        /**
        @property name
        @type String
        */
        this.name = null;

        this.init(cfg);
    };
    AgentAccount.prototype = {
        /**
        @property LOG_SRC
        */
        LOG_SRC: 'AgentAccount',

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
                    "homePage"
                ],
                val
            ;

            cfg = cfg || {};

            // handle .9 name changes
            if (typeof cfg.accountServiceHomePage !== "undefined") {
                cfg.homePage = cfg.accountServiceHomePage;
            }
            if (typeof cfg.accountName !== "undefined") {
                cfg.name = cfg.accountName;
            }

            for (i = 0; i < directProps.length; i += 1) {
                if (cfg.hasOwnProperty(directProps[i]) && cfg[directProps[i]] !== null) {
                    this[directProps[i]] = cfg[directProps[i]];
                }
            }
        }
    };
}());
