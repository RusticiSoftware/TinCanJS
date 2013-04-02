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
    // TODO: figure out how to handle dynamic configuration of LRSes

    var session = null,
        mockAlerts = null,
        alertFunc = function (msg) {
            mockAlerts.push(msg);
        },
        alertBuiltin,
        versions = TinCan.versions(),
        i,
        v,
        doSendStatementAsyncTest,
        doGetStatementAsyncTest;

    module("TinCan Statics");

    test(
        "TinCan debugging",
        function () {
            ok(TinCan.hasOwnProperty("DEBUG"), "TinCan has property: DEBUG");
            ok(!TinCan.DEBUG, "TinCan.DEBUG initial value");

            TinCan.enableDebug()
            ok(TinCan.DEBUG, "TinCan.enableDebug()");

            TinCan.disableDebug()
            ok(!TinCan.DEBUG, "TinCan.disableDebug()");
        }
    );
    test(
        "TinCan.versions",
        function () {
            deepEqual(TinCan.versions(), ["1.0", "0.95", "0.9"], "Supported spec versions");
        }
    );
    test(
        "TinCan.environment",
        function () {
            var env = TinCan.environment();
            ok(typeof env === "object", "TinCan.environment returns object");
            ok(env.isBrowser, "TinCan.environment property: isBrowser");
            ok(env.hasOwnProperty("hasCORS"), "TinCan.environment has property: hasCORS");
            ok(env.hasOwnProperty("useXDR"), "TinCan.environment has property: useXDR");
        }
    );

    module("TinCan Instance");

    test(
        "tincan Object",
        function () {
            var tincan = new TinCan ();

            ok(tincan instanceof TinCan, "tincan is TinCan");

            // test direct properties from construction
            ok(tincan.hasOwnProperty("environment"), "tincan has property: environment");
            strictEqual(tincan.environment, null, "tincan.environment property initial value");
            ok(tincan.hasOwnProperty("recordStores"), "tincan has property: recordStores");
            deepEqual(tincan.recordStores, [], "tincan.recordStores property initial value");
            ok(tincan.hasOwnProperty("actor"), "tincan has property: actor");
            strictEqual(tincan.actor, null, "tincan.actor property initial value");
            ok(tincan.hasOwnProperty("activity"), "tincan has property: activity");
            strictEqual(tincan.activity, null, "tincan.activity property initial value");
            ok(tincan.hasOwnProperty("registration"), "tincan has property: registration");
            strictEqual(tincan.registration, null, "tincan.registration property initial value");
            ok(tincan.hasOwnProperty("context"), "tincan has property: context");
            strictEqual(tincan.context, null, "tincan.context property initial value");

            // test properties from prototype
            strictEqual(tincan.LOG_SRC, "TinCan", "tincan property LOG_SRC initial value");
        }
    );

    module(
        "TinCan No LRS",
        {
            setup: function () {
                session = new TinCan ();
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
        "tincan.sendStatement (prepared, sync)",
        function () {
            var preparedStmt,
                sendResult,
                //
                // Cloud is lowercasing the mbox value so just use a lowercase one
                // and make sure it is unique to prevent merging that was previously
                // possible, but leaving the commented version as a marker for something
                // that ought to be tested against a 1.0 spec
                //
                //actorMbox = "mailto:TinCanJS-test-TinCan+" + Date.now() + "@tincanapi.com";
                actorMbox = "mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com";

            preparedStmt = session.prepareStatement(
                {
                    actor: {
                        mbox: actorMbox
                    },
                    verb: {
                        id: "http://adlnet.gov/expapi/verbs/attempted"
                    },
                    target: {
                        id: "http://tincanapi.com/TinCanJS/Test/TinCan_sendStatement/prepared-sync"
                    }
                }
            );
            sendResult = session.sendStatement(preparedStmt);

            ok(sendResult.hasOwnProperty("statement"), "sendResult has property: statement");
            deepEqual(sendResult.statement, preparedStmt, "sendResult property value: statement");

            ok(sendResult.hasOwnProperty("results"), "sendResult has property: results");
            ok(sendResult.results.length === 0, "sendResult results property: length");
            deepEqual(mockAlerts, ["TinCan: [warning] sendStatement: No LRSs added yet (statement not sent)"], "caught alert: statement not sent");
        }
    );

    // even though this is an async test in so far as sendStatement receives a callback
    // because no request will get fired it ends up appearing as if it was sync cause
    // the callback is called right away
    test(
        "tincan.sendStatement (prepared, async)",
        function () {
            var preparedStmt,
                sendResult,
                //
                // Cloud is lowercasing the mbox value so just use a lowercase one
                // and make sure it is unique to prevent merging that was previously
                // possible, but leaving the commented version as a marker for something
                // that ought to be tested against a 1.0 spec
                //
                //actorMbox = "mailto:TinCanJS-test-TinCan+" + Date.now() + "@tincanapi.com";
                actorMbox = "mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com";

            preparedStmt = session.prepareStatement(
                {
                    actor: {
                        mbox: actorMbox
                    },
                    verb: {
                        id: "http://adlnet.gov/expapi/verbs/attempted"
                    },
                    target: {
                        id: "http://tincanapi.com/TinCanJS/Test/TinCan_getStatement/sync"
                    }
                }
            );
            sendResult = session.sendStatement(
                preparedStmt,
                function (results, statement) {
                    deepEqual(results, null, "callback results argument: length");
                    deepEqual(preparedStmt, statement, "callback: statement matches");
                }
            );
            ok(sendResult.hasOwnProperty("statement"), "sendResult has property: statement");
            deepEqual(sendResult.statement, preparedStmt, "sendResult property value: statement");

            ok(sendResult.hasOwnProperty("results"), "sendResult has property: results");
            ok(sendResult.results.length === 0, "sendResult results property: length");
            deepEqual(mockAlerts, ["TinCan: [warning] sendStatement: No LRSs added yet (statement not sent)"], "caught alert: statement not sent");
        }
    );

    module(
        "TinCan Single LRS",
        {
            setup: function () {
                session = {};

                for (i = 0; i < versions.length; i += 1) {
                    v = versions[i];
                    if (TinCanTestCfg.recordStores[v]) {
                        session[v] = new TinCan (
                            {
                                recordStores: [
                                    TinCanTestCfg.recordStores[v]
                                ]
                            }
                        );
                    }
                }
            },
            teardown: function () {
                session = null;
            }
        }
    );

    for (i = 0; i < versions.length; i += 1) {
        v = versions[i];
        if (TinCanTestCfg.recordStores[v]) {
            test(
                "tincan.sendStatement (prepared, sync): " + v,
                function () {
                    var preparedStmt,
                        sendResult,
                        //
                        // Cloud is lowercasing the mbox value so just use a lowercase one
                        // and make sure it is unique to prevent merging that was previously
                        // possible, but leaving the commented version as a marker for something
                        // that ought to be tested against a 1.0 spec
                        //
                        //actorMbox = "mailto:TinCanJS-test-TinCan+" + Date.now() + "@tincanapi.com";
                        actorMbox = "mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com";

                    preparedStmt = session[v].prepareStatement(
                        {
                            actor: {
                                mbox: actorMbox
                            },
                            verb: {
                                id: "http://adlnet.gov/expapi/verbs/attempted"
                            },
                            target: {
                                id: "http://tincanapi.com/TinCanJS/Test/TinCan_sendStatement/prepared-sync"
                            }
                        }
                    );
                    sendResult = session[v].sendStatement(preparedStmt);

                    ok(sendResult.hasOwnProperty("statement"), "sendResult has property: statement (" + v + ")");
                    deepEqual(sendResult.statement, preparedStmt, "sendResult property value: statement (" + v + ")");

                    ok(sendResult.hasOwnProperty("results"), "sendResult has property: results (" + v + ")");
                    ok(sendResult.results.length === 1, "sendResult results property: length (" + v + ")");
                    ok(sendResult.results[0].hasOwnProperty("err"), "sendResult result 0 has property: err (" + v + ")");
                    ok(sendResult.results[0].hasOwnProperty("xhr"), "sendResult result 0 has property: xhr (" + v + ")");
                    deepEqual(sendResult.results[0].err, null, "sendResult result 0 property value: err (" + v + ")");
                }
            );
        }
    }

    for (i = 0; i < versions.length; i += 1) {
        v = versions[i];
        if (TinCanTestCfg.recordStores[v]) {
            test(
                "tincan.getStatement (sync): " + v,
                function () {
                    var sendResult,
                        getResult,
                        //
                        // Cloud is lowercasing the mbox value so just use a lowercase one
                        // and make sure it is unique to prevent merging that was previously
                        // possible, but leaving the commented version as a marker for something
                        // that ought to be tested against a 1.0 spec
                        //
                        //actorMbox = "mailto:TinCanJS-test-TinCan+" + Date.now() + "@tincanapi.com";
                        actorMbox = "mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com";

                    sendResult = session[v].sendStatement(
                        {
                            actor: {
                                mbox: actorMbox
                            },
                            verb: {
                                id: "http://adlnet.gov/expapi/verbs/attempted"
                            },
                            target: {
                                id: "http://tincanapi.com/TinCanJS/Test/TinCan_getStatement/sync"
                            }
                        }
                    );

                    getResult = session[v].getStatement(sendResult.statement.id);

                    ok(getResult.hasOwnProperty("statement"), "getResult has property: statement (" + v + ")");
                    ok(getResult.hasOwnProperty("err"), "getResult has property: err (" + v + ")");
                    ok(getResult.hasOwnProperty("xhr"), "getResult has property: xhr (" + v + ")");
                    deepEqual(getResult.err, null, "getResult property value: err (" + v + ")");
                    TinCanTest.assertHttpRequestType(getResult.xhr, "getResult property value is: xhr (" + v + ")");

                    // clear the "stored" and "authority" properties since we couldn't have known them ahead of time
                    getResult.statement.stored = null;
                    getResult.statement.authority = null;
                    if (v === "0.9") {
                        sendResult.statement.inProgress = false;
                    }
                    deepEqual(getResult.statement, sendResult.statement, "getResult property value: statement (" + v + ")");
                }
            );
        }
    }

    doSendStatementAsyncTest = function (version) {
        asyncTest(
            "sendStatement (prepared, async): " + version,
            function () {
                var preparedStmt,
                    sendResult,
                    //
                    // Cloud is lowercasing the mbox value so just use a lowercase one
                    // and make sure it is unique to prevent merging that was previously
                    // possible, but leaving the commented version as a marker for something
                    // that ought to be tested against a 1.0 spec
                    //
                    //actorMbox = "mailto:TinCanJS-test-TinCan+" + Date.now() + "@tincanapi.com";
                    actorMbox = "mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com";

                preparedStmt = session[version].prepareStatement(
                    {
                        actor: {
                            mbox: actorMbox
                        },
                        verb: {
                            id: "http://adlnet.gov/expapi/verbs/attempted"
                        },
                        target: {
                            id: "http://tincanapi.com/TinCanJS/Test/TinCan_getStatement/sync"
                        }
                    }
                );
                sendResult = session[version].sendStatement(
                    preparedStmt,
                    function (results, statement) {
                        start();
                        ok(results.length === 1, "callback results argument: length (" + version + ")");
                        ok(results[0].hasOwnProperty("err"), "callback results argument 0 has property: err (" + version + ")");
                        deepEqual(results[0].err, null, "callback results argument 0 property value: err (" + version + ")");
                        ok(results[0].hasOwnProperty("xhr"), "callback results argument 0 has property: xhr (" + version + ")");
                        TinCanTest.assertHttpRequestType(results[0].xhr, "callback results argument 0 property value: xhr (" + version + ")");
                        deepEqual(statement, preparedStmt, "callback: statement matches (" + version + ")");
                    }
                );
                start();
                ok(sendResult.hasOwnProperty("statement"), "sendResult has property: statement (" + version + ")");
                deepEqual(preparedStmt, sendResult.statement, "sendResult property value: statement (" + version + ")");

                ok(sendResult.hasOwnProperty("results"), "sendResult has property: results (" + version + ")");
                strictEqual(sendResult.results.length, 1, "sendResult results property: length (" + version + ")");
                TinCanTest.assertHttpRequestType(sendResult.results[0], "sendResult results 0 value is: xhr (" + version + ")");
                stop();
            }
        );
    };

    for (i = 0; i < versions.length; i += 1) {
        v = versions[i];
        if (TinCanTestCfg.recordStores[v]) {
            doSendStatementAsyncTest(v);
        }
    }

    doGetStatementAsyncTest = function (version) {
        asyncTest(
            "getStatement (async): " + version,
            function () {
                var sendResult,
                    getResult,
                    //
                    // Cloud is lowercasing the mbox value so just use a lowercase one
                    // and make sure it is unique to prevent merging that was previously
                    // possible, but leaving the commented version as a marker for something
                    // that ought to be tested against a 1.0 spec
                    //
                    //actorMbox = "mailto:TinCanJS-test-TinCan+" + Date.now() + "@tincanapi.com";
                    actorMbox = "mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com";

                sendResult = session[version].sendStatement(
                    {
                        actor: {
                            mbox: actorMbox
                        },
                        verb: {
                            id: "http://adlnet.gov/expapi/verbs/attempted"
                        },
                        target: {
                            id: "http://tincanapi.com/TinCanJS/Test/TinCan_getStatement/sync"
                        }
                    }
                );

                getResult = session[version].getStatement(
                    sendResult.statement.id,
                    function (err, statement) {
                        start();
                        deepEqual(err, null, "callback: err argument (" + version + ")");

                        // clear the "stored" and "authority" properties since we couldn't have known them ahead of time
                        // TODO: should we check the authority?
                        statement.stored = null;
                        statement.authority = null;
                        if (version === "0.9") {
                            sendResult.statement.inProgress = false;
                        }
                        deepEqual(sendResult.statement, statement, "callback: statement matches (" + version + ")");
                    }
                );
                // TODO: check getResult is an XHR?
            }
        );
    };

    for (i = 0; i < versions.length; i += 1) {
        v = versions[i];
        if (TinCanTestCfg.recordStores[v]) {
            doGetStatementAsyncTest(v);
        }
    }
}());
