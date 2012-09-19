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
@submodule TinCan.Score
**/
(function () {
    "use strict";

    /**
    @class TinCan.Score
    @constructor
    */
    var Score = TinCan.Score = function (cfg) {
        this.log("constructor");

        /**
        @property scaled
        @type String
        */
        this.scaled = null;

        /**
        @property raw
        @type String
        */
        this.raw = null;

        /**
        @property min
        @type String
        */
        this.min = null;

        /**
        @property max
        @type String
        */
        this.max = null;
    };
    Score.prototype = {
        /**
        @property LOG_SRC
        */
        LOG_SRC: 'Score',

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
        }
    };

    /**
    @method fromJSON
    @return {Object} Score
    @static
    */
    Score.fromJSON = function (scoreJSON) {
        Score.prototype.log("fromJSON");
        var _score = JSON.parse(scoreJSON);

        return new Score(_score);
    };
}());
