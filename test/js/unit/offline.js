/*!
    Copyright 2013 Rustici Software

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

    QUnit.module(
        "LRS .sendRequest to CORS denied server or offline",
        {
            setup: function () {
                //
                // endpoint here shouldn't really matter much cause
                // it should be offline and not get through, alternatively
                // we get the same processing for a server that denies
                // CORS requests (by not specifying correct headers) which
                // is why I chose what I did here, so can also use this
                // test online for testing CORS failure
                //
                session = new TinCan.LRS (
                    {
                        endpoint: "http://tincanapi.com",
                        auth: "test"
                    }
                );
                mockAlerts = [];
                alertBuiltin = window.alert;
                window.alert = alertFunc;
            },
            teardown: function () {
                session = null;
                mockAlerts = null;
                window.alert = alertBuiltin;
            }
        }
    );

    test(
        "basic (sync)",
        function () {
            var result = session.sendRequest(
                {
                    url: "test"
                }
            );
            ok(result.hasOwnProperty("err"), "result has property: err");
            deepEqual(result.err, 0, "result property value: err");
            ok(result.hasOwnProperty("xhr"), "result has property: xhr");
            TinCanTest.assertHttpRequestType(result.xhr, "result property value: xhr");
            deepEqual(mockAlerts, ["[warning] There was a problem communicating with the Learning Record Store. Aborted, offline, or invalid CORS endpoint (0)"], "caught alert: 0");
        }
    );
    test(
        "no alert (sync)",
        function () {
            session.alertOnRequestFailure = false;

            var result = session.sendRequest(
                {
                    url: "test"
                }
            );
            ok(result.hasOwnProperty("err"), "result has property: err");
            deepEqual(result.err, 0, "result property value: err");
            ok(result.hasOwnProperty("xhr"), "result has property: xhr");
            TinCanTest.assertHttpRequestType(result.xhr, "result property value: xhr");
            deepEqual(mockAlerts, [], "no alerts since turned off");
        }
    );

    asyncTest(
        "basic (async)",
        function () {
            var result = session.sendRequest(
                {
                    url: "test",
                    callback: function (err, xhr) {
                        start();
                        deepEqual(err, 0, "err arg value");
                        TinCanTest.assertHttpRequestType(xhr, "xhr arg value");
                        deepEqual(mockAlerts, ["[warning] There was a problem communicating with the Learning Record Store. Aborted, offline, or invalid CORS endpoint (0)"], "caught alert: 0");
                    }
                }
            );
        }
    );
    asyncTest(
        "no alert (async)",
        function () {
            session.alertOnRequestFailure = false;

            var result = session.sendRequest(
                {
                    url: "test",
                    callback: function (err, xhr) {
                        start();
                        deepEqual(err, 0, "err arg value");
                        TinCanTest.assertHttpRequestType(xhr, "xhr arg value");
                        deepEqual(mockAlerts, [], "no alerts since turned off");
                    }
                }
            );
        }
    );
}());
