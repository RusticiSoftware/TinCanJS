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
    // TODO: figure out how to handle dynamic configuration of LRSes

    var session = null,
        versions = TinCan.versions(),
        i,
        version,
        doSendStatementAsyncTest,
        doGetStatementAsyncTest,
        USAGE_TYPE = "http://id.tincanapi.com/attachment/supporting_media";

    QUnit.module(
        "TinCan-async No LRS",
        {
            setup: function () {
                session = new TinCan ();
            },
            teardown: function () {
                session = null;
            }
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
                // that ought to be tested against a 1.0.0 spec
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
                        id: "http://tincanapi.com/TinCanJS/Test/TinCan_sendStatement/async"
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
        }
    );

    QUnit.module(
        "TinCan-async Single LRS",
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
                        session[v].recordStores[0].allowFail = false;
                    }
                }
            },
            teardown: function () {
                session = null;
            }
        }
    );

    doSendStatementAsyncTest = function (v) {
        asyncTest(
            "sendStatement (prepared, async): " + v,
            function () {
                var preparedStmt,
                    sendResult,
                    //
                    // Cloud is lowercasing the mbox value so just use a lowercase one
                    // and make sure it is unique to prevent merging that was previously
                    // possible, but leaving the commented version as a marker for something
                    // that ought to be tested against a 1.0.0 spec
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
                            id: "http://tincanapi.com/TinCanJS/Test/TinCan_sendStatement/async/" + v
                        }
                    }
                );
                sendResult = session[v].sendStatement(
                    preparedStmt,
                    function (results, statement) {
                        start();
                        ok(results.length === 1, "callback results argument: length (" + v + ")");
                        ok(results[0].hasOwnProperty("err"), "callback results argument 0 has property: err (" + v + ")");
                        deepEqual(results[0].err, null, "callback results argument 0 property value: err (" + v + ")");
                        ok(results[0].hasOwnProperty("xhr"), "callback results argument 0 has property: xhr (" + v + ")");
                        TinCanTest.assertHttpRequestType(results[0].xhr, "callback results argument 0 property value: xhr (" + v + ")");
                        deepEqual(statement, preparedStmt, "callback: statement matches (" + v + ")");
                    }
                );
                start();
                ok(sendResult.hasOwnProperty("statement"), "sendResult has property: statement (" + v + ")");
                deepEqual(preparedStmt, sendResult.statement, "sendResult property value: statement (" + v + ")");

                ok(sendResult.hasOwnProperty("results"), "sendResult has property: results (" + v + ")");
                strictEqual(sendResult.results.length, 1, "sendResult results property: length (" + v + ")");
                TinCanTest.assertHttpRequestType(sendResult.results[0], "sendResult results 0 value is: xhr (" + v + ")");
                stop();
            }
        );
    };

    doSendStatementWithAttachmentTest = function (v) {
        asyncTest(
            "sendStatementWithAttachment (prepared, async): " + v,
            function () {
                var preparedStmt,
                    sendResult,
                    //
                    // Cloud is lowercasing the mbox value so just use a lowercase one
                    // and make sure it is unique to prevent merging that was previously
                    // possible, but leaving the commented version as a marker for something
                    // that ought to be tested against a 1.0.0 spec
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
                            id: "http://tincanapi.com/TinCanJS/Test/TinCan_sendStatement/async/" + v
                        },
                        attachments: [
                            {
                                display: {
                                    "en-US": "Test Attachment"
                                },
                                usageType: USAGE_TYPE,
                                content: "test content",
                                contentType: "text/plain"
                            }
                        ]
                    }
                );
                sendResult = session[v].sendStatement(
                    preparedStmt,
                    function (results, statement) {
                        start();
                        ok(results.length === 1, "callback results argument: length (" + v + ")");
                        ok(results[0].hasOwnProperty("err"), "callback results argument 0 has property: err (" + v + ")");
                        deepEqual(results[0].err, null, "callback results argument 0 property value: err (" + v + ")");
                        ok(results[0].hasOwnProperty("xhr"), "callback results argument 0 has property: xhr (" + v + ")");
                        TinCanTest.assertHttpRequestType(results[0].xhr, "callback results argument 0 property value: xhr (" + v + ")");
                        deepEqual(statement, preparedStmt, "callback: statement matches (" + v + ")");
                    }
                );
                start();
                ok(sendResult.hasOwnProperty("statement"), "sendResult has property: statement (" + v + ")");
                deepEqual(preparedStmt, sendResult.statement, "sendResult property value: statement (" + v + ")");

                ok(sendResult.hasOwnProperty("results"), "sendResult has property: results (" + v + ")");
                strictEqual(sendResult.results.length, 1, "sendResult results property: length (" + v + ")");
                TinCanTest.assertHttpRequestType(sendResult.results[0], "sendResult results 0 value is: xhr (" + v + ")");
                stop();
            }
        );
    };

    doGetStatementAsyncTest = function (v) {
        asyncTest(
            "getStatement (async): " + v,
            function () {
                var sendResult,
                    //
                    // Cloud is lowercasing the mbox value so just use a lowercase one
                    // and make sure it is unique to prevent merging that was previously
                    // possible, but leaving the commented version as a marker for something
                    // that ought to be tested against a 1.0.0 spec
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
                            id: "http://tincanapi.com/TinCanJS/Test/TinCan_getStatement/async/" + v
                        }
                    },
                    function (results, sentStatement) {
                        // TODO: need to handle errors?

                        var getResult = session[v].getStatement(
                            sentStatement.id,
                            function (err, statement) {
                                start();
                                deepEqual(err, null, "callback: err argument (" + v + ")");

                                // clear the "stored" and "authority" properties since we couldn't have known them ahead of time
                                // TODO: should we check the authority?
                                statement.stored = null;
                                statement.authority = null;

                                if (v !== "0.9" && v !== "0.95") {
                                    //
                                    // in 1.0.0 the version should be 1.0.0, in 1.0.1 it was supposed to be
                                    // returned as 1.0.1 but the spec still said 1.0.0, in the future it is
                                    // expected that if the LRS supports a particular version that is what
                                    // it returns
                                    //
                                    sentStatement.version = "1.0.0";
                                }
                                if (v === "0.9") {
                                    sentStatement.inProgress = false;
                                }

                                //
                                // skip this one test on our travis-ci setup to make it pass
                                // if SCORM Cloud fixes the issue then we can restore the test
                                // but with this against the 0.95 endpoint it matters very little
                                //
                                if (v === "0.95" && session[v].recordStores[0].endpoint.match(/RHY62NUREC/)) {
                                    return;
                                }
                                deepEqual(sentStatement, statement, "callback: statement matches (" + v + ")");
                            }
                        );
                        // TODO: check getResult is an XHR?
                    }
                );
                // TODO: check return value?
            }
        );
    };

    doGetStatementsVerbIDAsyncTest = function (v) {
        asyncTest(
            "getStatementsVerbID (async): " + v,
            function () {
                var sendResult,
                //
                // Cloud is lowercasing the mbox value so just use a lowercase one
                // and make sure it is unique to prevent merging that was previously
                // possible, but leaving the commented version as a marker for something
                // that ought to be tested against a 1.0.0 spec
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
                            id: "http://tincanapi.com/TinCanJS/Test/TinCan_getStatement/async/" + v
                        }
                    },
                    function (results, sentStatement) {
                        // TODO: need to handle errors?

                        var getResult = session[v].getStatements(
                            {
                                params: {
                                    verb: "http://adlnet.gov/expapi/verbs/attempted"
                                },
                                callback: function (err, statement) {
                                    start();
                                    deepEqual(err, null, "callback: err argument (" + v + ")");
                                    deepEqual(sentStatement.verb.id, statement.statements[0].verb.id, "callback: statement verb id matches (" + v + ")");
                                }
                            }
                        );
                    }
                );
            }
        );
    };

    doGetStatementsActivityIDAsyncTest = function (v) {
        asyncTest(
            "getStatementsActivityID (async): " + v,
            function () {
                var sendResult,
                //
                // Cloud is lowercasing the mbox value so just use a lowercase one
                // and make sure it is unique to prevent merging that was previously
                // possible, but leaving the commented version as a marker for something
                // that ought to be tested against a 1.0.0 spec
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
                            id: "http://tincanapi.com/TinCanJS/Test/TinCan_getStatement/async/" + v
                        }
                    },
                    function (results, sentStatement) {
                        // TODO: need to handle errors?

                        var getResult = session[v].getStatements(
                            {
                                params: {
                                    activity: "http://tincanapi.com/TinCanJS/Test/TinCan_getStatement/async/" + v
                                },
                                callback: function (err, statement) {
                                    start();
                                    deepEqual(err, null, "callback: err argument (" + v + ")");
                                    deepEqual(sentStatement.target.id, statement.statements[0].target.id, "callback: statement verb id matches (" + v + ")");
                                }
                            }
                        );
                    }
                );
            }
        );
    };

    doGetStatementWithAttachmentTest = function (v) {
        asyncTest(
            "getStatementWithAttachment (async): " + v,
            function () {
                var sendResult,
                    //
                    // Cloud is lowercasing the mbox value so just use a lowercase one
                    // and make sure it is unique to prevent merging that was previously
                    // possible, but leaving the commented version as a marker for something
                    // that ought to be tested against a 1.0.0 spec
                    //
                    //actorMbox = "mailto:TinCanJS-test-TinCan+" + Date.now() + "@tincanapi.com";
                    actorMbox = "mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com",
                    attachment = new TinCan.Attachment(
                        {
                            display: {
                                "en-US": "Test Attachment"
                            },
                            usageType: USAGE_TYPE,
                            contentType: "text/plain"
                        }
                    );

                attachment.setContentFromString("test content");

                sendResult = session[v].sendStatement(
                    {
                        actor: {
                            mbox: actorMbox
                        },
                        verb: {
                            id: "http://adlnet.gov/expapi/verbs/attempted"
                        },
                        target: {
                            id: "http://tincanapi.com/TinCanJS/Test/TinCan_getStatementWithAttachment/async/" + v
                        },
                        attachments: [
                            attachment
                        ]
                    },
                    function (results, sentStatement) {
                        // TODO: need to handle errors?

                        var getResult = session[v].getStatement(
                            sentStatement.id,
                            function (err, statement) {
                                start();

                                // clear the "stored" and "authority" properties since we couldn't have known them ahead of time
                                // TODO: should we check the authority?
                                statement.stored = null;
                                statement.authority = null;

                                deepEqual(err, null, "callback: err argument (" + v + ")");
                                deepEqual(sentStatement.attachments[0], statement.attachments[0], "callback: statement matches (" + v + ")");
                            },
                            {
                                params: {
                                    attachments: true
                                }
                            }
                        );
                        // TODO: check getResult is an XHR?
                    }
                );
                // TODO: check return value?
            }
        );
    };

    doGetStatementsWithAttachmentTest = function (v) {
        asyncTest(
            "getStatementsWithAttachment (async): " + v,
            function () {
                var sendResult,
                    //
                    // Cloud is lowercasing the mbox value so just use a lowercase one
                    // and make sure it is unique to prevent merging that was previously
                    // possible, but leaving the commented version as a marker for something
                    // that ought to be tested against a 1.0.0 spec
                    //
                    //actorMbox = "mailto:TinCanJS-test-TinCan+" + Date.now() + "@tincanapi.com";
                    actorMbox = "mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com",
                    attachment = new TinCan.Attachment(
                        {
                            display: {
                                "en-US": "Test Attachment"
                            },
                            usageType: USAGE_TYPE,
                            contentType: "text/plain"
                        }
                    );

                attachment.setContentFromString("test content");

                sendResult = session[v].sendStatement(
                    {
                        actor: {
                            mbox: actorMbox
                        },
                        verb: {
                            id: "http://adlnet.gov/expapi/verbs/attempted"
                        },
                        target: {
                            id: "http://tincanapi.com/TinCanJS/Test/TinCan_getStatementsWithAttachment/async/" + v
                        },
                        attachments: [
                            attachment
                        ]
                    },
                    function (results, sentStatement) {
                        // TODO: need to handle errors?

                        var getResult = session[v].getStatements(
                            {
                                params: {
                                    attachments: true
                                },
                                callback: function (err, statement) {
                                    start();
                                    deepEqual(err, null, "callback: err argument (" + v + ")");
                                    deepEqual(sentStatement.attachments[0], statement.statements[0].attachments[0], "callback: statement matches (" + v + ")");
                                }
                            }
                        );
                    }
                );
            }
        );
    };

    for (i = 0; i < versions.length; i += 1) {
        version = versions[i];
        if (TinCanTestCfg.recordStores[version]) {
            doSendStatementAsyncTest(version);
            doGetStatementAsyncTest(version);
            if (version !== "0.9" && version !== "0.95") {
                doGetStatementsVerbIDAsyncTest(version);
                doGetStatementsActivityIDAsyncTest(version);
                if (TinCanTest.testAttachments) {
                    doSendStatementWithAttachmentTest(version);
                    doGetStatementWithAttachmentTest(version);
                    doGetStatementsWithAttachmentTest(version);
                }
            }
        }
    }
}());
