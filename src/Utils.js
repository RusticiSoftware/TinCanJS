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
        /**
        @method getUUID
        @return {String} UUID
        @static

        Excerpt from: Math.uuid.js (v1.4)
        http://www.broofa.com
        mailto:robert@broofa.com
        Copyright (c) 2010 Robert Kieffer
        Dual licensed under the MIT and GPL licenses.
        */
        getUUID: function () {
            /*jslint bitwise: true eqeq: true */
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
                /[xy]/g,
                function (c) {
                    var r = Math.random() * 16|0, v = c == 'x' ? r : (r&0x3|0x8);
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
            function pad (intNum, intNumDigits){

                var strTemp,intLen,i;

                strTemp = intNum.toString();
                intLen = strTemp.length;

                if (intLen > intNumDigits){
                    strTemp = strTemp.substr(0,intNumDigits);
                }
                else{
                    for (i=intLen; i<intNumDigits; i += 1){
                        strTemp = "0" + strTemp;
                    }
                }
                return strTemp;
            }

            var Year,Month,Day,Hour,Minute,Second,strTimeStamp,
                dtm = new Date(d);
            
            Year   = dtm.getFullYear();
            Month  = dtm.getMonth() + 1;
            Day    = dtm.getDate();
            Hour   = dtm.getHours();
            Minute = dtm.getMinutes();
            Second = dtm.getSeconds();

            Month  = pad(Month, 2);
            Day    = pad(Day, 2);
            Hour   = pad(Hour, 2);
            Minute = pad(Minute, 2);
            Second = pad(Second, 2);

            strTimeStamp = Year + "-" + Month + "-" + Day + "T" + Hour + ":" + Minute + ":" + Second;

            return strTimeStamp;
        },

        /**
        @method getSHA1String
        @static
        @param {String} str Content to hash
        @return {String} SHA1 for contents
        */
        getSHA1String: function (str) {
            /*global Crypto*/
            var digestBytes = Crypto.SHA1(str, { asBytes: true }),
                sha1 = Crypto.util.bytesToHex(digestBytes);

            return sha1;
        },

        /**
        @method getLangDictionaryValue
        @param {String} prop Property name storing the dictionary
        @param {String} [lang] Language to return
        @return {String}

        Intended to be inherited by objects with properties that store
        display values in a language based "dictionary"
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
        @return {Object} Object of values
        @private
        */
        parseURL: function (url) {
            var parts = String(url).split('?'),
                pairs,
                pair,
                i,
                params = {}
            ;
            if (parts.length === 2) {
                pairs = parts[1].split('&');
                for (i = 0; i < pairs.length; i += 1) {
                    pair = pairs[i].split('=');
                    if (pair.length === 2 && pair[0]) {
                        params[pair[0]] = decodeURIComponent(pair[1]);
                    }
                }
            }

            return {
                path: parts[0],
                params: params
            };
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
        @method arrayValueIndex
        @static
        @param {Array} array object
        @param {object} needle value
        @return {int} index of the found value or -1 if not found
        
        IE does not support Array.indexOf
        */
        arrayIndexOf: function (arrayObj,value) {
            var i;
            
            for(i = 0; i < arrayObj.length; i += 1) {
                if(arrayObj[i] === value) {
                    return i;
                }
            }
            return -1;
        }
        
    };
}());
