/*!
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
(function () {
    var session = null,
        mockAlerts = null,
        alertFunc = function (msg) {
            mockAlerts.push(msg);
        },
        alertBuiltin;

    QUnit.module("Utils Statics");

    test(
        "getUUID",
        function () {
            var re = /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}/,
                i,
                val,
                list = [],
                seen = {},
                noDupe = true;
            for (i = 0; i < 500; i += 1) {
                val = TinCan.Utils.getUUID();
                ok(re.test(val), "formatted correctly: " + i);

                list.push(val);
            }
            for (i = 0; i < 500; i += 1) {
                if (seen.hasOwnProperty(list[i])) {
                    noDupe = false;
                }
                seen[list[i]] = true;
            }
            ok(noDupe, "no duplicates in 500");
        }
    );
    test(
        "getISODateString",
        function () {
            var d = new Date (
                Date.UTC(2013, 2, 1, 8, 4, 6, 3)
            );
            result = TinCan.Utils.getISODateString(d);

            ok(result === "2013-03-01T08:04:06.003Z", "return value");
        }
    );
    test(
        "getSHA1String",
        function () {
            ok(TinCan.Utils.getSHA1String("test") === "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3", "return value");
        }
    );
    test(
        "getBase64String",
        function () {
            ok(TinCan.Utils.getBase64String("a94a8fe5ccb19ba61c4c0873d391e987982fbbd3") === "YTk0YThmZTVjY2IxOWJhNjFjNGMwODczZDM5MWU5ODc5ODJmYmJkMw==", "return value");
        }
    );
    test(
        "parseURL",
        function () {
            var result;

            result = TinCan.Utils.parseURL("http://tincanapi.com:8080/TinCanJS/Test/TinCan.Utils_parseURL/test");
            deepEqual(
                result,
                {
                    params: {},
                    path: "http://tincanapi.com:8080/TinCanJS/Test/TinCan.Utils_parseURL/test"
                },
                 "return value: no params"
            );

            result = TinCan.Utils.parseURL("http://tincanapi.com:8080/TinCanJS/Test/TinCan.Utils_parseURL/test?paramA=1&paramB=2");
            deepEqual(
                result,
                {
                    params: {
                        paramA: "1",
                        paramB: "2"
                    },
                    path: "http://tincanapi.com:8080/TinCanJS/Test/TinCan.Utils_parseURL/test"
                },
                 "return value: with params"
             );
        }
    );
    test(
        "getServerRoot",
        function () {
            var result;

            result = TinCan.Utils.getServerRoot("http://tincanapi.com/TinCanJS/Test/TinCan.Utils_getServerRoot/test");
            ok(result === "http://tincanapi.com", "return value: no port");

            result = TinCan.Utils.getServerRoot("http://tincanapi.com:8080/TinCanJS/Test/TinCan.Utils_getServerRoot/test");
            ok(result === "http://tincanapi.com:8080", "return value: with port");
        }
    );
    test(
        "getContentTypeFromHeader",
        function () {
            var appJSON = "application/json",
                strings = {
                    "application/json": appJSON,
                    "application/json; charset=UTF-8": appJSON,
                    "text/plain;charset=UTF-8": "text/plain"
                },
                prop;
            for (prop in strings) {
                ok(TinCan.Utils.getContentTypeFromHeader(prop) === strings[prop], "'" + prop + "' matches '" + strings[prop]);
            }
        }
    );
    test(
        "isApplicationJSON",
        function () {
            var okStrings = [
                    "application/json",
                    "application/json; charset=UTF-8",
                    "application/json ",
                    "Application/JSON",
                    "Application/JSON   "
                ],
                notOkStrings = [
                    "application/octet-stream",
                    "text/plain"
                ],
                i;
            for (i = 0; i < okStrings.length; i += 1) {
                ok(TinCan.Utils.isApplicationJSON(okStrings[i]), "'" + okStrings[i] + "' matched");
            }
            for (i = 0; i < notOkStrings.length; i += 1) {
                ok(! TinCan.Utils.isApplicationJSON(notOkStrings[i]), "'" + notOkStrings[i] + "' not matched");
            }
        }
    );
}());
