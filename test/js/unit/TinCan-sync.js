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
        versions = TinCan.versions(),
        i,
        version,
        doSendStatementSyncTest,
        doGetStatementSyncTest,
        doVoidStatementSyncTest,
        doStateSyncTest,
        doStateSyncContentTypeJSONTest,
        doActivityProfileSyncTest,
        doActivityProfileSyncContentTypeJSONTest,
        NATIVE_CORS = false;

    if (typeof XMLHttpRequest !== "undefined" && typeof (new XMLHttpRequest()).withCredentials !== "undefined") {
        NATIVE_CORS = true;
    }

    QUnit.module(
        "TinCan-sync No LRS",
        {
            setup: function () {
                session = new TinCan ();
            },
            teardown: function () {
                session = null;
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
                        id: "http://tincanapi.com/TinCanJS/Test/TinCan_sendStatement/prepared-sync"
                    }
                }
            );
            sendResult = session.sendStatement(preparedStmt);

            ok(sendResult.hasOwnProperty("statement"), "sendResult has property: statement");
            deepEqual(sendResult.statement, preparedStmt, "sendResult property value: statement");

            ok(sendResult.hasOwnProperty("results"), "sendResult has property: results");
            ok(sendResult.results.length === 0, "sendResult results property: length");
        }
    );

    QUnit.module(
        "TinCan-sync Single LRS",
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

    doSendStatementSyncTest = function (v) {
        test(
            "tincan.sendStatement (prepared, sync): " + v,
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
                            id: "http://tincanapi.com/TinCanJS/Test/TinCan_sendStatement/prepared-sync/" + v
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
    };

    doGetStatementSyncTest = function (v) {
        test(
            "tincan.getStatement (sync): " + v,
            function () {
                var sendResult,
                    getResult,
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
                            id: "http://tincanapi.com/TinCanJS/Test/TinCan_getStatement/sync/" + v
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
                if (v !== "0.9" && v !== "0.95") {
                    //
                    // in 1.0.0 the version should be 1.0.0, in 1.0.1 it was supposed to be
                    // returned as 1.0.1 but the spec still said 1.0.0, in the future it is
                    // expected that if the LRS supports a particular version that is what
                    // it returns
                    //
                    sendResult.statement.version = "1.0.0";
                }
                deepEqual(getResult.statement, sendResult.statement, "getResult property value: statement (" + v + ")");
            }
        );
    };

    doVoidStatementSyncTest = function (v) {
        test(
            "tincan.getVoidedStatement (sync): " + v,
            function () {
                var sendResult,
                    getResult,
                    //
                    // Cloud is lowercasing the mbox value so just use a lowercase one
                    // and make sure it is unique to prevent merging that was previously
                    // possible, but leaving the commented version as a marker for something
                    // that ought to be tested against a 1.0.0 spec
                    //
                    //actorMbox = "mailto:TinCanJS-test-TinCan+" + Date.now() + "@tincanapi.com";
                    actorMbox = "mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com",
                    actor = new TinCan.Agent(
                        { mbox: actorMbox }
                    ),
                    compareVoidSt;

                // need to create a new statement that we can then void
                sendResult = session[v].sendStatement(
                    {
                        actor: actor,
                        verb: {
                            id: "http://adlnet.gov/expapi/verbs/attempted"
                        },
                        target: {
                            id: "http://tincanapi.com/TinCanJS/Test/TinCan_getVoidedStatement/sync/" + v
                        }
                    }
                );

                voidResult = session[v].voidStatement(
                    sendResult.statement,
                    null,
                    {
                        actor: actor
                    }
                );

                compareVoidSt = new TinCan.Statement(
                    {
                        actor: actor,
                        verb: new TinCan.Verb(
                            {
                                id: "http://adlnet.gov/expapi/verbs/voided"
                            }
                        ),
                        target: new TinCan.StatementRef(
                            {
                                id: sendResult.statement.id
                            }
                        )
                    },
                    {
                        doStamp: false
                    }
                );

                ok(voidResult.hasOwnProperty("statement"), "voidResult has property: statement (" + v + ")");

                compareVoidSt.id = voidResult.statement.id;
                compareVoidSt.timestamp = voidResult.statement.timestamp;
                deepEqual(voidResult.statement, compareVoidSt, "voidResult property value: statement (" + v + ")");

                ok(voidResult.hasOwnProperty("results"), "voidResult has property: results (" + v + ")");
                ok(voidResult.results.length === 1, "voidResult results property: length (" + v + ")");
                ok(voidResult.results[0].hasOwnProperty("err"), "voidResult result 0 has property: err (" + v + ")");
                ok(voidResult.results[0].hasOwnProperty("xhr"), "voidResult result 0 has property: xhr (" + v + ")");
                deepEqual(voidResult.results[0].err, null, "voidResult result 0 property value: err (" + v + ")");
                TinCanTest.assertHttpRequestType(voidResult.results[0].xhr, "voidResult result 0 property value is: xhr (" + v + ")");

                getVoidedResult = session[v].getVoidedStatement(sendResult.statement.id);

                ok(getVoidedResult.hasOwnProperty("statement"), "getResult has property: statement (" + v + ")");
                ok(getVoidedResult.hasOwnProperty("err"), "getResult has property: err (" + v + ")");
                ok(getVoidedResult.hasOwnProperty("xhr"), "getResult has property: xhr (" + v + ")");
                deepEqual(getVoidedResult.err, null, "getResult property value: err (" + v + ")");
                TinCanTest.assertHttpRequestType(getVoidedResult.xhr, "getResult property value is: xhr (" + v + ")");

                // clear the "stored" and "authority" properties since we couldn't have known them ahead of time
                getVoidedResult.statement.stored = null;
                getVoidedResult.statement.authority = null;
                if (v === "0.9") {
                    sendResult.statement.inProgress = false;
                }
                if (v === "0.9" || v === "0.95") {
                    sendResult.statement.voided = true;
                }
                if (v !== "0.9" && v !== "0.95") {
                    //
                    // in 1.0.0 the version should be 1.0.0, in 1.0.1 it was supposed to be
                    // returned as 1.0.1 but the spec still said 1.0.0, in the future it is
                    // expected that if the LRS supports a particular version that is what
                    // it returns
                    //
                    sendResult.statement.version = "1.0.0";
                }
                deepEqual(getVoidedResult.statement, sendResult.statement, "getVoidedResult property value: statement (" + v + ")");
            }
        );
    };

    doStateSyncTest = function (v) {
        test(
            "tincan state (sync): " + v,
            function () {
                var setResult,
                    key = "setState (sync)",
                    val = "TinCanJS",
                    mbox ="mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com",
                    options = {
                        agent: new TinCan.Agent(
                            {
                                mbox: mbox
                            }
                        ),
                        activity: new TinCan.Activity(
                            {
                                id: "http://tincanapi.com/TinCanJS/Test/TinCan_setState/sync/" + v
                            }
                        )
                    };

                setResult = session[v].setState(key, val, options);

                if (! NATIVE_CORS) {
                    deepEqual(
                        setResult,
                        {
                            xhr: null,
                            err: new Error("Unsupported content type for IE Mode request")
                        },
                        "setResult when using XDomainRequest"
                    );

                    return;
                }

                ok(setResult.hasOwnProperty("err"), "setResult has property: err (" + v + ")");
                ok(setResult.hasOwnProperty("xhr"), "setResult has property: xhr (" + v + ")");
                ok(setResult.err === null, "setResult.err is null");

                getResult = session[v].getState(key, options);
                ok(getResult.hasOwnProperty("state"), "getResult has property: state (" + v + ")");
                ok(getResult.state instanceof TinCan.State, "getResult state property is TinCan.State (" + v + ")");
                deepEqual(getResult.state.contents, val, "getResult state property contents (" + v + ")");
                deepEqual(TinCan.Utils.getContentTypeFromHeader(getResult.state.contentType), "application/octet-stream", "getResult state property contentType (" + v + ")");

                //
                // reset the state to make sure we test the concurrency handling
                //
                options.lastSHA1 = getResult.state.etag;
                setResult = session[v].setState(key, val + 1, options);
                delete options.lastSHA1;

                deleteResult = session[v].deleteState(key, options);
            }
        );
    };

    doStateSyncContentTypeJSONTest = function (v) {
        test(
            "tincan state (sync, JSON content type): " + v,
            function () {
                var setResult,
                    key = "setState (sync, json content)",
                    val = {
                        testObj: {
                            key1: "val1"
                        },
                        testBool: true,
                        testNum: 1
                    },
                    mbox ="mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com",
                    options = {
                        contentType: "application/json",
                        agent: new TinCan.Agent(
                            {
                                mbox: mbox
                            }
                        ),
                        activity: new TinCan.Activity(
                            {
                                id: "http://tincanapi.com/TinCanJS/Test/TinCan_setState/syncContentType/" + v
                            }
                        )
                    };

                setResult = session[v].setState(key, val, options);

                ok(setResult.hasOwnProperty("err"), "setResult has property: err (" + v + ")");
                ok(setResult.hasOwnProperty("xhr"), "setResult has property: xhr (" + v + ")");

                getResult = session[v].getState(key, options);
                ok(getResult.hasOwnProperty("state"), "getResult has property: state (" + v + ")");
                ok(getResult.state instanceof TinCan.State, "getResult state property is TinCan.State (" + v + ")");
                deepEqual(getResult.state.contents, val, "getResult state property contents (" + v + ")");
                deepEqual(TinCan.Utils.getContentTypeFromHeader(getResult.state.contentType), "application/json", "getResult state property contentType (" + v + ")");

                //
                // reset the state to make sure we test the concurrency handling
                //
                options.lastSHA1 = getResult.state.etag;
                setResult = session[v].setState(key, val + 1, options);
                delete options.lastSHA1;

                deleteResult = session[v].deleteState(key, options);
            }
        );
    };

    doActivityProfileSyncTest = function (v) {
        test(
            "tincan activityProfile (sync): " + v,
            function () {
                var setResult,
                    key = "activityProfile (sync)",
                    val = "TinCanJS",
                    options = {
                        activity: new TinCan.Activity(
                            {
                                id: "http://tincanapi.com/TinCanJS/Test/TinCan_setActivityProfile/sync/" + v
                            }
                        )
                    };

                setResult = session[v].setActivityProfile(key, val, options);
                if (! NATIVE_CORS) {
                    deepEqual(
                        setResult,
                        {
                            xhr: null,
                            err: new Error("Unsupported content type for IE Mode request")
                        },
                        "setResult when using XDomainRequest"
                    );

                    return;
                }

                ok(setResult.hasOwnProperty("err"), "setResult has property: err (" + v + ")");
                ok(setResult.hasOwnProperty("xhr"), "setResult has property: xhr (" + v + ")");

                getResult = session[v].getActivityProfile(key, options);
                ok(getResult.hasOwnProperty("profile"), "getResult has property: profile (" + v + ")");
                ok(getResult.profile instanceof TinCan.ActivityProfile, "getResult profile property is TinCan.ActivityProfile (" + v + ")");
                deepEqual(getResult.profile.contents, val, "getResult profile property contents (" + v + ")");
                deepEqual(TinCan.Utils.getContentTypeFromHeader(getResult.profile.contentType), "application/octet-stream", "getResult profile property contentType (" + v + ")");

                setResult = session[v].setActivityProfile(key, val + 1, options);

                //
                // reset the profile to make sure we test the concurrency handling
                //
                options.lastSHA1 = getResult.profile.etag;
                setResult = session[v].setActivityProfile(key, val + 2, options);
                delete options.lastSHA1;

                deleteResult = session[v].deleteActivityProfile(key, options);
            }
        );
    };

    doActivityProfileSyncContentTypeJSONTest = function (v) {
        test(
            "tincan activityProfile (sync, JSON content type): " + v,
            function () {
                var setResult,
                    key = "activityProfile (sync)",
                    val = {
                        testObj: {
                            key1: "val1"
                        },
                        testBool: true,
                        testNum: 1
                    },
                    options = {
                        activity: new TinCan.Activity(
                            {
                                id: "http://tincanapi.com/TinCanJS/Test/TinCan_setActivityProfile/syncJSON/" + v
                            }
                        ),
                        contentType: "application/json"
                    };

                setResult = session[v].setActivityProfile(key, val, options);

                ok(setResult.hasOwnProperty("err"), "setResult has property: err (" + v + ")");
                ok(setResult.hasOwnProperty("xhr"), "setResult has property: xhr (" + v + ")");

                getResult = session[v].getActivityProfile(key, options);
                ok(getResult.hasOwnProperty("profile"), "getResult has property: profile (" + v + ")");
                ok(getResult.profile instanceof TinCan.ActivityProfile, "getResult profile property is TinCan.ActivityProfile (" + v + ")");
                deepEqual(getResult.profile.contents, val, "getResult profile property contents (" + v + ")");
                deepEqual(TinCan.Utils.getContentTypeFromHeader(getResult.profile.contentType), "application/json", "getResult profile property contentType (" + v + ")");

                setResult = session[v].setActivityProfile(key, val + 1, options);

                //
                // reset the profile to make sure we test the concurrency handling
                //
                options.lastSHA1 = getResult.profile.etag;
                setResult = session[v].setActivityProfile(key, val + 2, options);
                delete options.lastSHA1;

                deleteResult = session[v].deleteActivityProfile(key, options);
            }
        );
    };

    doAgentProfileSyncTest = function (v) {
        test(
            "tincan agentProfile (sync): " + v,
            function () {
                var setResult,
                    key = "agentProfile (sync)",
                    val = "TinCanJS",
                    mbox ="mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com",
                    options = {
                        agent: new TinCan.Agent(
                            {
                                mbox: mbox
                            }
                        )
                    };

                setResult = session[v].setAgentProfile(key, val, options);
                if (! NATIVE_CORS) {
                    deepEqual(
                        setResult,
                        {
                            xhr: null,
                            err: new Error("Unsupported content type for IE Mode request")
                        },
                        "setResult when using XDomainRequest"
                    );

                    return;
                }

                ok(setResult.hasOwnProperty("err"), "setResult has property: err (" + v + ")");
                ok(setResult.hasOwnProperty("xhr"), "setResult has property: xhr (" + v + ")");

                getResult = session[v].getAgentProfile(key, options);
                ok(getResult.hasOwnProperty("profile"), "getResult has property: profile (" + v + ")");
                ok(getResult.profile instanceof TinCan.AgentProfile, "getResult profile property is TinCan.AgentProfile (" + v + ")");
                deepEqual(getResult.profile.contents, val, "getResult profile property contents (" + v + ")");
                deepEqual(TinCan.Utils.getContentTypeFromHeader(getResult.profile.contentType), "application/octet-stream", "getResult profile property contentType (" + v + ")");

                setResult = session[v].setAgentProfile(key, val + 1, options);

                //
                // reset the profile to make sure we test the concurrency handling
                //
                options.lastSHA1 = getResult.profile.etag;
                setResult = session[v].setAgentProfile(key, val + 2, options);
                delete options.lastSHA1;

                deleteResult = session[v].deleteAgentProfile(key, options);
            }
        );
    };

    doAgentProfileSyncContentTypeJSONTest = function (v) {
        test(
            "tincan agentProfile (sync, JSON content type): " + v,
            function () {
                var setResult,
                    key = "agentProfile (sync)",
                    val = {
                        testObj: {
                            key1: "val1"
                        },
                        testBool: true,
                        testNum: 1
                    },
                    mbox ="mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com",
                    options = {
                        agent: new TinCan.Agent(
                            {
                                mbox: mbox
                            }
                        ),
                        contentType: "application/json"
                    };

                setResult = session[v].setAgentProfile(key, val, options);

                ok(setResult.hasOwnProperty("err"), "setResult has property: err (" + v + ")");
                ok(setResult.hasOwnProperty("xhr"), "setResult has property: xhr (" + v + ")");

                getResult = session[v].getAgentProfile(key, options);
                ok(getResult.hasOwnProperty("profile"), "getResult has property: profile (" + v + ")");
                ok(getResult.profile instanceof TinCan.AgentProfile, "getResult profile property is TinCan.AgentProfile (" + v + ")");
                deepEqual(getResult.profile.contents, val, "getResult profile property contents (" + v + ")");
                deepEqual(TinCan.Utils.getContentTypeFromHeader(getResult.profile.contentType), "application/json", "getResult profile property contentType (" + v + ")");

                setResult = session[v].setAgentProfile(key, val + 1, options);

                //
                // reset the profile to make sure we test the concurrency handling
                //
                options.lastSHA1 = getResult.profile.etag;
                setResult = session[v].setAgentProfile(key, val + 2, options);
                delete options.lastSHA1;

                deleteResult = session[v].deleteAgentProfile(key, options);
            }
        );
    };

    for (i = 0; i < versions.length; i += 1) {
        version = versions[i];
        if (TinCanTestCfg.recordStores[version]) {
            doSendStatementSyncTest(version);
            doGetStatementSyncTest(version);
            doVoidStatementSyncTest(version);
            doStateSyncTest(version);
            doStateSyncContentTypeJSONTest(version);
            doActivityProfileSyncTest(version);
            doActivityProfileSyncContentTypeJSONTest(version);
            doAgentProfileSyncTest(version);
            doAgentProfileSyncContentTypeJSONTest(version);
        }
    }
}());
