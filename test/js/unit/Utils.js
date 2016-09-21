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
        "convertISO8601DurationToMilliseconds",
        function () {
            ok(TinCan.Utils.convertISO8601DurationToMilliseconds("PT1H34M42.475S") === 5682475, "return value");
        }
    );
    test(
        "convertMillisecondsToISO8601Duration",
        function () {
            ok(TinCan.Utils.convertMillisecondsToISO8601Duration(5682475) === "PT1H34M42.48S", "return value");
        }
    );
    test(
        "getSHA1String",
        function () {
            ok(TinCan.Utils.getSHA1String("test") === "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3", "return value");
        }
    );

    if (TinCanTest.testAttachments) {
        test(
            "getSHA256String",
            function () {
                var str = "test",
                    strAB = TinCan.Utils.stringToArrayBuffer(str);

                ok(TinCan.Utils.getSHA256String(str) === "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", "string content return value");

                if (Object.prototype.toString.call(strAB) === "[object ArrayBuffer]") {
                    ok(TinCan.Utils.getSHA256String(strAB) === "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", "array buffer content return value");
                }
            }
        );
    }
    test(
        "getBase64String",
        function () {
            ok(TinCan.Utils.getBase64String("a94a8fe5ccb19ba61c4c0873d391e987982fbbd3") === "YTk0YThmZTVjY2IxOWJhNjFjNGMwODczZDM5MWU5ODc5ODJmYmJkMw==", "return value");
        }
    );
    test(
        "parseURL",
        function () {
            var result,
                handleUndefined = undefined;

            // check to see if this browser splices undefined normally
            // cause IE 8 doesn't
            match = "someString".match(/(.+)(?::([0-9]+))?/);
            if (match[2] === "") {
                handleUndefined = "";
            }

            result = TinCan.Utils.parseURL("http://tincanapi.com");
            deepEqual(
                result,
                {
                    protocol: "http:",
                    host: "tincanapi.com",
                    hostname: "tincanapi.com",
                    port: handleUndefined,
                    pathname: "/",
                    search: "",
                    hash: "",
                    params: {},
                    path: "http://tincanapi.com/"
                },
                "return value: basic URL no path"
            );

            result = TinCan.Utils.parseURL("https://tincanapi.com");
            deepEqual(
                result,
                {
                    protocol: "https:",
                    host: "tincanapi.com",
                    hostname: "tincanapi.com",
                    port: handleUndefined,
                    pathname: "/",
                    search: "",
                    hash: "",
                    params: {},
                    path: "https://tincanapi.com/"
                },
                "return value: basic https URL no path"
            );

            result = TinCan.Utils.parseURL("http://tincanapi.com/");
            deepEqual(
                result,
                {
                    protocol: "http:",
                    host: "tincanapi.com",
                    hostname: "tincanapi.com",
                    port: handleUndefined,
                    pathname: "/",
                    search: "",
                    hash: "",
                    params: {},
                    path: "http://tincanapi.com/"
                },
                "return value: basic URL empty path"
            );

            result = TinCan.Utils.parseURL("https://tincanapi.com/");
            deepEqual(
                result,
                {
                    protocol: "https:",
                    host: "tincanapi.com",
                    hostname: "tincanapi.com",
                    port: handleUndefined,
                    pathname: "/",
                    search: "",
                    hash: "",
                    params: {},
                    path: "https://tincanapi.com/"
                },
                "return value: basic https URL empty path"
            );

            result = TinCan.Utils.parseURL("https://tincanapi.com/TinCanJS");
            deepEqual(
                result,
                {
                    protocol: "https:",
                    host: "tincanapi.com",
                    hostname: "tincanapi.com",
                    port: handleUndefined,
                    pathname: "/TinCanJS",
                    search: "",
                    hash: "",
                    params: {},
                    path: "https://tincanapi.com/TinCanJS"
                },
                "return value: basic https URL simple path"
            );

            result = TinCan.Utils.parseURL("https://tincanapi.com/TinCanJS/");
            deepEqual(
                result,
                {
                    protocol: "https:",
                    host: "tincanapi.com",
                    hostname: "tincanapi.com",
                    port: handleUndefined,
                    pathname: "/TinCanJS/",
                    search: "",
                    hash: "",
                    params: {},
                    path: "https://tincanapi.com/TinCanJS/"
                },
                "return value: basic https URL simple path with trailing slash"
            );

            result = TinCan.Utils.parseURL("http://localhost");
            deepEqual(
                result,
                {
                    protocol: "http:",
                    host: "localhost",
                    hostname: "localhost",
                    port: handleUndefined,
                    pathname: "/",
                    search: "",
                    hash: "",
                    params: {},
                    path: "http://localhost/"
                },
                "return value: localhost URL no path"
            );

            result = TinCan.Utils.parseURL("http://localhost/TinCanJS/Test");
            deepEqual(
                result,
                {
                    protocol: "http:",
                    host: "localhost",
                    hostname: "localhost",
                    port: handleUndefined,
                    pathname: "/TinCanJS/Test",
                    search: "",
                    hash: "",
                    params: {},
                    path: "http://localhost/TinCanJS/Test"
                },
                "return value: localhost URL"
            );

            result = TinCan.Utils.parseURL("http://tincanapi.com:8080/TinCanJS/Test/TinCan.Utils_parseURL/test");
            deepEqual(
                result,
                {
                    protocol: "http:",
                    host: "tincanapi.com:8080",
                    hostname: "tincanapi.com",
                    port: "8080",
                    pathname: "/TinCanJS/Test/TinCan.Utils_parseURL/test",
                    search: "",
                    hash: "",
                    params: {},
                    path: "http://tincanapi.com:8080/TinCanJS/Test/TinCan.Utils_parseURL/test"
                },
                "return value: no params"
            );

            result = TinCan.Utils.parseURL("http://tincanapi.com:8080/TinCanJS/Test/TinCan.Utils_parseURL/test?paramA=1&paramB=2");
            deepEqual(
                result,
                {
                    protocol: "http:",
                    host: "tincanapi.com:8080",
                    hostname: "tincanapi.com",
                    port: "8080",
                    pathname: "/TinCanJS/Test/TinCan.Utils_parseURL/test",
                    search: "?paramA=1&paramB=2",
                    hash: "",
                    params: {
                        paramA: "1",
                        paramB: "2"
                    },
                    path: "http://tincanapi.com:8080/TinCanJS/Test/TinCan.Utils_parseURL/test"
                },
                "return value: with params"
            );

            result = TinCan.Utils.parseURL("https://tincanapi.com/TinCanJS/Test/TinCan.Utils_parseURL/test?paramA=1&paramB=2&weirdParam=odd?secondQuestionMark#withHash");
            deepEqual(
                result,
                {
                    protocol: "https:",
                    host: "tincanapi.com",
                    hostname: "tincanapi.com",
                    port: handleUndefined,
                    pathname: "/TinCanJS/Test/TinCan.Utils_parseURL/test",
                    search: "?paramA=1&paramB=2&weirdParam=odd?secondQuestionMark",
                    hash: "#withHash",
                    params: {
                        paramA: "1",
                        paramB: "2",
                        weirdParam: "odd?secondQuestionMark"
                    },
                    path: "https://tincanapi.com/TinCanJS/Test/TinCan.Utils_parseURL/test"
                },
                "return value: with odd params, https no port, and hash"
            );

            result = TinCan.Utils.parseURL("http://tincanapi.com:8080/TinCanJS/Test/TinCan.Utils_parseURL/test?paramA=1&paramB=2&paramC=%23isahashsymbol#theRealHash");
            deepEqual(
                result,
                {
                    protocol: "http:",
                    host: "tincanapi.com:8080",
                    hostname: "tincanapi.com",
                    port: "8080",
                    pathname: "/TinCanJS/Test/TinCan.Utils_parseURL/test",
                    search: "?paramA=1&paramB=2&paramC=%23isahashsymbol",
                    hash: "#theRealHash",
                    params: {
                        paramA: "1",
                        paramB: "2",
                        paramC: "#isahashsymbol"
                    },
                    path: "http://tincanapi.com:8080/TinCanJS/Test/TinCan.Utils_parseURL/test"
                },
                "return value: with params"
            );

            throws(
                function () {
                    result = TinCan.Utils.parseURL("/RelativeNotAllowed");
                },
                Error,
                "relative without option"
            );

            result = TinCan.Utils.parseURL(
                "/TinCanJS/Test/TinCan.Utils_parseURL/testRelative?paramA=1",
                { allowRelative: true }
            );
            deepEqual(
                result,
                {
                    protocol: null,
                    host: null,
                    hostname: null,
                    port: null,
                    pathname: "/TinCanJS/Test/TinCan.Utils_parseURL/testRelative",
                    search: "?paramA=1",
                    hash: "",
                    params: {
                        paramA: "1"
                    },
                    path: "/TinCanJS/Test/TinCan.Utils_parseURL/testRelative"
                },
                "return value: relative with params"
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

    test(
        "stringToArrayBuffer/stringFromArrayBuffer",
        function () {
            var str = "string of test content",
                bytes = [115, 116, 114, 105, 110, 103, 32, 111, 102, 32, 116, 101, 115, 116, 32, 99, 111, 110, 116, 101, 110, 116],
                ab = new ArrayBuffer(str.length),
                abView = new Uint8Array(ab);

            if (Object.prototype.toString.call(ab) !== "[object ArrayBuffer]") {
                expect(0);
                return;
            }

            for (i = 0; i < bytes.length; i += 1) {
                abView[i] = bytes[i];
            }

            result = TinCan.Utils.stringFromArrayBuffer(ab);
            equal(Object.prototype.toString.call(result), "[object String]", "string from array buffer: toString type");
            ok(str === result, "string from array buffer: result");

            result = TinCan.Utils.stringToArrayBuffer(str);
            equal(Object.prototype.toString.call(result), "[object ArrayBuffer]", "string to array buffer: toString type");
            equal(result.byteLength, bytes.length, "string to array buffer: byteLength");
            deepEqual(bytes, Array.prototype.slice.call(new Uint8Array(result)), "string to array buffer: result");
        }
    );
}());
