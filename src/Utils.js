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
@submodule TinCan.Utils
**/
(function () {
    "use strict";

    /**
    @class TinCan.Utils
    */
    TinCan.Utils = {
        defaultEncoding: "utf8",

        /**
        Generates a UUIDv4 compliant string that should be reasonably unique

        @method getUUID
        @return {String} UUID
        @static

        Excerpt from: http://www.broofa.com/Tools/Math.uuid.js (v1.4)
        http://www.broofa.com
        mailto:robert@broofa.com
        Copyright (c) 2010 Robert Kieffer
        Dual licensed under the MIT and GPL licenses.
        */
        getUUID: function () {
            /*jslint bitwise: true, eqeq: true */
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
                /[xy]/g,
                function (c) {
                    var r = Math.random() * 16|0, v = c == "x" ? r : (r&0x3|0x8);
                    return v.toString(16);
                }
            );
        },

        /**
        @method getISODateString
        @static
        @param {Date} date Date to stringify
        @return {String} ISO date String
        */
        getISODateString: function (d) {
            function pad (val, n) {
                var padder,
                    tempVal;
                if (typeof val === "undefined" || val === null) {
                    val = 0;
                }
                if (typeof n === "undefined" || n === null) {
                    n = 2;
                }
                padder = Math.pow(10, n-1);
                tempVal = val.toString();

                while (val < padder && padder > 1) {
                    tempVal = "0" + tempVal;
                    padder = padder / 10;
                }

                return tempVal;
            }

            return d.getUTCFullYear() + "-" +
                pad(d.getUTCMonth() + 1) + "-" +
                pad(d.getUTCDate()) + "T" +
                pad(d.getUTCHours()) + ":" +
                pad(d.getUTCMinutes()) + ":" +
                pad(d.getUTCSeconds()) + "." +
                pad(d.getUTCMilliseconds(), 3) + "Z";
        },

        /**
        @method convertISO8601DurationToMilliseconds
        @static
        @param {String} ISO8601Duration Duration in ISO8601 format
        @return {Int} Duration in milliseconds

        Note: does not handle input strings with years, months and days
        */
        convertISO8601DurationToMilliseconds: function (ISO8601Duration) {
            var isValueNegative = (ISO8601Duration.indexOf("-") >= 0),
                indexOfT = ISO8601Duration.indexOf("T"),
                indexOfH = ISO8601Duration.indexOf("H"),
                indexOfM = ISO8601Duration.indexOf("M"),
                indexOfS = ISO8601Duration.indexOf("S"),
                hours,
                minutes,
                seconds,
                durationInMilliseconds;

            if ((indexOfT === -1) || ((indexOfM !== -1) && (indexOfM < indexOfT)) || (ISO8601Duration.indexOf("D") !== -1) || (ISO8601Duration.indexOf("Y") !== -1)) {
                throw new Error("ISO 8601 timestamps including years, months and/or days are not currently supported");
            }

            if (indexOfH === -1) {
                indexOfH = indexOfT;
                hours = 0;
            }
            else {
                hours = parseInt(ISO8601Duration.slice(indexOfT + 1, indexOfH), 10);
            }

            if (indexOfM === -1) {
                indexOfM = indexOfT;
                minutes = 0;
            }
            else {
                minutes = parseInt(ISO8601Duration.slice(indexOfH + 1, indexOfM), 10);
            }

            seconds = parseFloat(ISO8601Duration.slice(indexOfM + 1, indexOfS));

            durationInMilliseconds = parseInt((((((hours * 60) + minutes) * 60) + seconds) * 1000), 10);
            if (isNaN(durationInMilliseconds)){
                durationInMilliseconds = 0;
            }
            if (isValueNegative) {
                durationInMilliseconds = durationInMilliseconds * -1;
            }

            return durationInMilliseconds;
        },

        /**
        @method convertMillisecondsToISO8601Duration
        @static
        @param {Int} inputMilliseconds Duration in milliseconds
        @return {String} Duration in ISO8601 format
        */
        convertMillisecondsToISO8601Duration: function (inputMilliseconds) {
            var hours,
                minutes,
                seconds,
                i_inputMilliseconds = parseInt(inputMilliseconds, 10),
                i_inputCentiseconds,
                inputIsNegative = "",
                rtnStr = "";

            //round to nearest 0.01 seconds
            i_inputCentiseconds = Math.round(i_inputMilliseconds / 10);

            if (i_inputCentiseconds < 0) {
                inputIsNegative = "-";
                i_inputCentiseconds = i_inputCentiseconds * -1;
            }

            hours = parseInt(((i_inputCentiseconds) / 360000), 10);
            minutes = parseInt((((i_inputCentiseconds) % 360000) / 6000), 10);
            seconds = (((i_inputCentiseconds) % 360000) % 6000) / 100;

            rtnStr = inputIsNegative + "PT";
            if (hours > 0) {
                rtnStr += hours + "H";
            }

            if (minutes > 0) {
                rtnStr += minutes + "M";
            }

            rtnStr += seconds + "S";

            return rtnStr;
        },

        /**
        @method getSHA1String
        @static
        @param {String} str Content to hash
        @return {String} SHA1 for contents
        */
        getSHA1String: function (str) {
            /*global CryptoJS*/

            return CryptoJS.SHA1(str).toString(CryptoJS.enc.Hex);
        },

        /**
        @method getSHA256String
        @static
        @param {ArrayBuffer|String} content Content to hash
        @return {String} SHA256 for contents
        */
        getSHA256String: function (content) {
            /*global CryptoJS*/

            if (Object.prototype.toString.call(content) === "[object ArrayBuffer]") {
                content = CryptoJS.lib.WordArray.create(content);
            }
            return CryptoJS.SHA256(content).toString(CryptoJS.enc.Hex);
        },

        /**
        @method getBase64String
        @static
        @param {String} str Content to encode
        @return {String} Base64 encoded contents
        */
        getBase64String: function (str) {
            /*global CryptoJS*/

            return CryptoJS.enc.Base64.stringify(
                CryptoJS.enc.Latin1.parse(str)
            );
        },

        /**
        Intended to be inherited by objects with properties that store
        display values in a language based "dictionary"

        @method getLangDictionaryValue
        @param {String} prop Property name storing the dictionary
        @param {String} [lang] Language to return
        @return {String}
        */
        getLangDictionaryValue: function (prop, lang) {
            var langDict = this[prop],
                key;

            if (typeof lang !== "undefined" && typeof langDict[lang] !== "undefined") {
                return langDict[lang];
            }
            if (typeof langDict.und !== "undefined") {
                return langDict.und;
            }
            if (typeof langDict["en-US"] !== "undefined") {
                return langDict["en-US"];
            }
            for (key in langDict) {
                if (langDict.hasOwnProperty(key)) {
                    return langDict[key];
                }
            }

            return "";
        },

        /**
        @method parseURL
        @param {String} url
        @param {Object} [options]
            @param {Boolean} [options.allowRelative] Option to allow relative URLs
        @return {Object} Object of values
        @private
        */
        parseURL: function (url, cfg) {
            //
            // see http://stackoverflow.com/a/21553982
            // and http://stackoverflow.com/a/2880929
            //
            var isRelative = url.charAt(0) === "/",
                _reURLInformation = [
                    "(/[^?#]*)", // pathname
                    "(\\?[^#]*|)", // search
                    "(#.*|)$" // hash
                ],
                reURLInformation,
                match,
                result,
                paramMatch,
                pl     = /\+/g,  // Regex for replacing addition symbol with a space
                search = /([^&=]+)=?([^&]*)/g,
                decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };

            cfg = cfg || {};

            //
            // this method in an earlier version supported relative URLs, mostly to provide
            // support to the `LRS.moreStatements` method, that functionality was removed and
            // subsequently restored but with the addition of the option for allowing relative
            // URLs to be accepted which is the reason for the "helpful" exception message here
            //
            if (! isRelative) {
                //
                // not relative so make sure they have a scheme, host, etc.
                //
                _reURLInformation.unshift(
                    "^(https?:)//", // scheme
                    "(([^:/?#]*)(?::([0-9]+))?)" // host (hostname and port)
                );

                //
                // our regex requires there to be a '/' for the detection of the start
                // of the path, we can detect a '/' using indexOf beyond the part of the
                // scheme, since we've restricted scheme to 'http' or 'https' and because
                // a hostname is guaranteed to be there we can detect beyond the '://'
                // based on position, then tack on a trailing '/' because it can't be
                // part of the path
                //
                if (url.indexOf("/", 8) === -1) {
                    url = url + "/";
                }
            }
            else {
                //
                // relative so make sure they allow that explicitly
                //
                if (typeof cfg.allowRelative === "undefined" || ! cfg.allowRelative) {
                    throw new Error("Refusing to parse relative URL without 'allowRelative' option");
                }
            }

            reURLInformation = new RegExp(_reURLInformation.join(""));
            match = url.match(reURLInformation);
            if (match === null) {
                throw new Error("Unable to parse URL regular expression did not match: '" + url + "'");
            }

            // 'path' is for backwards compatibility
            if (isRelative) {
                result = {
                    protocol: null,
                    host: null,
                    hostname: null,
                    port: null,
                    path: null,
                    pathname: match[1],
                    search: match[2],
                    hash: match[3],
                    params: {}
                };

                result.path = result.pathname;
            }
            else {
                result = {
                    protocol: match[1],
                    host: match[2],
                    hostname: match[3],
                    port: match[4],
                    pathname: match[5],
                    search: match[6],
                    hash: match[7],
                    params: {}
                };

                result.path = result.protocol + "//" + result.host + result.pathname;
            }

            if (result.search !== "") {
                // extra parens to let jshint know this is an expression
                while ((paramMatch = search.exec(result.search.substring(1)))) {
                    result.params[decode(paramMatch[1])] = decode(paramMatch[2]);
                }
            }

            return result;
        },

        /**
        @method getServerRoot
        @param {String} absoluteUrl
        @return {String} server root of url
        @private
        */
        getServerRoot: function (absoluteUrl) {
            var urlParts = absoluteUrl.split("/");
            return urlParts[0] + "//" + urlParts[2];
        },

        /**
        @method getContentTypeFromHeader
        @static
        @param {String} header Content-Type header value
        @return {String} Primary value from Content-Type
        */
        getContentTypeFromHeader: function (header) {
            return (String(header).split(";"))[0];
        },

        /**
        @method isApplicationJSON
        @static
        @param {String} header Content-Type header value
        @return {Boolean} whether "application/json" was matched
        */
        isApplicationJSON: function (header) {
            return TinCan.Utils.getContentTypeFromHeader(header).toLowerCase().indexOf("application/json") === 0;
        },

        /**
        @method stringToArrayBuffer
        @static
        @param {String} content String of content to convert to an ArrayBuffer
        @param {String} [encoding] Encoding to use for conversion
        @return {ArrayBuffer} Converted content
        */
        stringToArrayBuffer: function () {
            TinCan.prototype.log("stringToArrayBuffer not overloaded - no environment loaded?");
        },

        /**
        @method stringFromArrayBuffer
        @static
        @param {ArrayBuffer} content ArrayBuffer of content to convert to a String
        @param {String} [encoding] Encoding to use for conversion
        @return {String} Converted content
        */
        stringFromArrayBuffer: function () {
            TinCan.prototype.log("stringFromArrayBuffer not overloaded - no environment loaded?");
        }
    };
}());
