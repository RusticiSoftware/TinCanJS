/*
    Copyright 2014 Rustici Software

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
@submodule TinCan.Attachment
**/
(function () {
    "use strict";

    /**
    @class TinCan.Attachment
    @constructor
    */
    var Attachment = TinCan.Attachment = function (cfg) {
        this.log("constructor");

        /**
        @property usageType
        @type String
        */
        this.usageType = null;

        /**
        @property display
        @type Object
        */
        this.display = null;

        /**
        @property contentType
        @type String
        */
        this.contentType = null;

        /**
        @property length
        @type int
        */
        this.length = null;

        /**
        @property sha2
        @type String
        */
        this.sha2 = null;

        /**
        @property description
        @type Object
        */
        this.description = null;

        /**
        @property fileUrl
        @type String
        */
        this.fileUrl = null;

        this.init(cfg);
    };
    Attachment.prototype = {
        /**
        @property LOG_SRC
        */
        LOG_SRC: "Attachment",

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
                    "contentType",
                    "length",
                    "sha2",
                    "usageType",
                    "display"
                ]
            ;

            cfg = cfg || {};

            if (cfg.hasOwnProperty("description") && typeof cfg.description !== "undefined" && cfg.description !== null) {
                this.description = cfg.description;
            }
            if (cfg.hasOwnProperty("fileUrl") && typeof cfg.fileUrl !== "undefined" && cfg.fileUrl !== null) {
                this.fileUrl = cfg.fileUrl;
            }

            for (i = 0; i < directProps.length; i += 1) {
                if (cfg.hasOwnProperty(directProps[i]) && cfg[directProps[i]] !== null) {
                    this[directProps[i]] = cfg[directProps[i]];
                }
            }

            if (cfg.hasOwnProperty("content") && typeof cfg.content !== "undefined" && cfg.content !== null) {
                this.content = cfg.content;
                this.length = cfg.content.length;
                this.sha2 = TinCan.Utils.getSHA256String(cfg.content);
            }
        },

        /**
        @method asVersion
        @param {String} [version] Version to return (defaults to newest supported)
        */
        asVersion: function (version) {
            this.log("asVersion");
            var result;

            version = version || TinCan.versions()[0];

            if (version === "0.9" || version === "0.95") {
                result = null;
            }
            else {
                result = {
                    contentType: this.contentType,
                    description: this.description,
                    display: this.display,
                    fileUrl: this.fileUrl,
                    length: this.length,
                    sha2: this.sha2,
                    usageType: this.usageType
                };
                if (this.hasOwnProperty("content") && typeof this.content !== "undefined" && this.content !== null) {
                    result.content = this.content;
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
    @return {Object} Attachment
    @static
    */
    Attachment.fromJSON = function (attachmentJSON) {
        Attachment.prototype.log("fromJSON");
        var _attachment = JSON.parse(attachmentJSON);

        return new Attachment(_attachment);
    };
}());
