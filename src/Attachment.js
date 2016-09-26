/*
    Copyright 2016 Rustici Software

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

        /**
        @property content
        @type ArrayBuffer
        */
        this.content = null;

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
                    "display",
                    "description",
                    "fileUrl"
                ]
            ;

            cfg = cfg || {};

            for (i = 0; i < directProps.length; i += 1) {
                if (cfg.hasOwnProperty(directProps[i]) && cfg[directProps[i]] !== null) {
                    this[directProps[i]] = cfg[directProps[i]];
                }
            }

            if (cfg.hasOwnProperty("content") && cfg.content !== null) {
                if (typeof cfg.content === "string") {
                    this.setContentFromString(cfg.content);
                }
                else {
                    this.setContent(cfg.content);
                }
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
                    display: this.display,
                    length: this.length,
                    sha2: this.sha2,
                    usageType: this.usageType
                };

                if (this.fileUrl !== null) {
                    result.fileUrl = this.fileUrl;
                }
                if (this.description !== null) {
                    result.description = this.description;
                }
            }

            return result;
        },

        /**
        See {{#crossLink "TinCan.Utils/getLangDictionaryValue"}}{{/crossLink}}

        @method getLangDictionaryValue
        */
        getLangDictionaryValue: TinCan.Utils.getLangDictionaryValue,

        /**
        @method setContent
        @param {ArrayBuffer} content Sets content from ArrayBuffer
        */
        setContent: function (content) {
            this.content = content;
            this.length = content.byteLength;
            this.sha2 = TinCan.Utils.getSHA256String(content);
        },

        /**
        @method setContentFromString
        @param {String} content Sets the content property of the attachment from a string
        */
        setContentFromString: function (content) {
            var _content = content;

            _content = TinCan.Utils.stringToArrayBuffer(content);

            this.setContent(_content);
        },

        /**
        @method getContentAsString
        @return {String} Value of content property as a string
        */
        getContentAsString: function () {
            return TinCan.Utils.stringFromArrayBuffer(this.content);
        }
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

    Attachment._defaultEncoding = "utf-8";
}());
