/*!
    Copyright 2012-2013 Rustici Software

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
        versions = TinCan.versions(),
        endpoint = "https://cloud.scorm.com/tc/public/";

    QUnit.module("LRS Instance");
    test(
        "LRS init failure: no endpoint",
        function () {
            throws(
                function () {
                    var obj = new TinCan.LRS ();
                },
                "exception"
            );
        }
    );

    test(
        "LRS init failure: invalid URL",
        function () {
            throws(
                function () {
                    var obj = new TinCan.LRS (
                        {
                            endpoint: ""
                        }
                    );
                },
                "exception"
            );
            throws(
                function () {
                    var obj = new TinCan.LRS (
                        {
                            endpoint: null
                        }
                    );
                },
                "exception"
            );
        }
    );

    test(
        "LRS init failure: invalid version",
        function () {
            throws(
                function () {
                    var obj = new TinCan.LRS (
                        {
                            endpoint: endpoint,
                            version: "test"
                        }
                    );
                },
                "exception"
            );
        }
    );

    test(
        "LRS variants",
        function () {
            var set = [
                    {
                        name: "basic",
                        instanceConfig: {
                            endpoint: endpoint
                        },
                        checkProps: {
                            endpoint: endpoint,
                            LOG_SRC: "LRS",
                            auth: null,
                            extended: null,
                            version: TinCan.versions()[0],
                            allowFail: true
                        }
                    },
                    {
                        name: "endpoint correction (trailing slash)",
                        instanceConfig: {
                            endpoint: "https://cloud.scorm.com/tc/public"
                        },
                        checkProps: {
                            endpoint: endpoint
                        }
                    },
                    {
                        name: "main properties",
                        instanceConfig: {
                            endpoint: endpoint,
                            auth: "Basic dGVzdDpwYXNzd29yZA==",
                            extended: {
                                test: "TEST"
                            },
                            allowFail: false
                        },
                        checkProps: {
                            auth: "Basic dGVzdDpwYXNzd29yZA==",
                            extended: {
                                test: "TEST"
                            },
                            allowFail: false
                        }
                    },
                    {
                        name: "username/password to basic auth",
                        instanceConfig: {
                            endpoint: endpoint,
                            username: "test",
                            password: "password"
                        },
                        checkProps: {
                            auth: "Basic dGVzdDpwYXNzd29yZA=="
                        }
                    },
                    {
                        name: "version: 1.0.0",
                        instanceConfig: {
                            endpoint: endpoint,
                            version: "1.0.0"
                        },
                        checkProps: {
                            version: "1.0.0"
                        }
                    },
                    {
                        name: "version: 0.95",
                        instanceConfig: {
                            endpoint: endpoint,
                            version: "0.95"
                        },
                        checkProps: {
                            version: "0.95"
                        }
                    },
                    {
                        name: "version: 0.9",
                        instanceConfig: {
                            endpoint: endpoint,
                            version: "0.9"
                        },
                        checkProps: {
                            version: "0.9"
                        }
                    }
                ],
                i,
                obj,
                result
            ;

            for (i = 0; i < set.length; i += 1) {
                row = set[i];
                try {
                    obj = new TinCan.LRS (row.instanceConfig);
                } catch (ex) {
                    // TODO: check environment for IE and detect exception
                    //       purposefully and then run proper assertions for it
                    expect(0);
                    break;
                }

                ok(obj instanceof TinCan.LRS, "object is TinCan.LRS (" + row.name + ")");
                if (typeof row.checkProps !== "undefined") {
                    for (key in row.checkProps) {
                        deepEqual(obj[key], row.checkProps[key], "object property initial value: " + key + " (" + row.name + ")");
                    }
                }
            }
        }
    );

    QUnit.module("LRS method calls");

    test(
        "_getBoundary",
        function () {
            var re = /[a-f0-9]{8}[a-f0-9]{4}4[a-f0-9]{3}[89ab][a-f0-9]{3}[a-f0-9]{12}/,
                i,
                val,
                list = [],
                seen = {},
                noDupe = true,
                lrs;

            for (i = 0; i < versions.length; i += 1) {
                if (typeof TinCanTestCfg.recordStores[versions[i]] !== "undefined") {
                    lrs = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
                    break;
                }
            }

            for (i = 0; i < 500; i += 1) {
                val = lrs._getBoundary();
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

    (function () {
        var versions = TinCan.versions(),
            doAsyncStateTest,
            doAsyncAgentProfileTest,
            doAsyncActivityProfileTest,
            doAsyncActivityTest,
            _queryStatementsRequestCfgTest,
            i;

        session = {};

        for (i = 0; i < versions.length; i += 1) {
            if (typeof TinCanTestCfg.recordStores[versions[i]] !== "undefined") {
                session[versions[i]] = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
            }
        }

        _queryStatementsRequestCfgTest = function (v) {
            test(
                "_queryStatementsRequestCfgTest, Verb object: " + v,
                function () {
                    var cfg = {
                            method: "GET",
                            params: {
                                verb: "http://adlnet.gov/expapi/verbs/attempted"
                            },
                            url: "statements"
                        },
                        verb = new TinCan.Verb({
                            id: "http://adlnet.gov/expapi/verbs/attempted"
                        }),
                        lrs = session[v];
                    deepEqual(lrs._queryStatementsRequestCfg(
                        {
                            params: {
                                verb: verb
                            }
                        }
                    ),
                    cfg);
                }
            );
            test(
                "_queryStatementsRequestCfgTest, Verb id: " + v,
                function () {
                    var cfg = {
                            method: "GET",
                            params: {
                                verb: "http://adlnet.gov/expapi/verbs/attempted"
                            },
                            url: "statements"
                        },
                        verb = "http://adlnet.gov/expapi/verbs/attempted",
                        lrs = session[v];
                    deepEqual(lrs._queryStatementsRequestCfg(
                        {
                            params: {
                                verb: verb
                            }
                        }
                    ),
                    cfg);
                }
            );
            if (! (v === "0.9" || v === "0.95")) {
                test(
                    "_queryStatementsRequestCfgTest, Activity object: " + v,
                    function () {
                        var cfg = {
                                method: "GET",
                                params: {
                                    activity: "http://TestActivity"
                                },
                                url: "statements"
                            },
                            activity = new TinCan.Activity({
                                id: "http://TestActivity"
                            }),
                            lrs = session[v];
                        deepEqual(lrs._queryStatementsRequestCfg(
                            {
                                params: {
                                    activity: activity
                                }
                            }
                        ),
                        cfg);
                    }
                );
                test(
                    "_queryStatementsRequestCfgTest, Activity id: " + v,
                    function () {
                        var cfg = {
                                method: "GET",
                                params: {
                                    activity: "http://TestActivity"
                                },
                                url: "statements"
                            },
                            activity = "http://TestActivity",
                            lrs = session[v];
                        deepEqual(lrs._queryStatementsRequestCfg(
                            {
                                params: {
                                    activity: activity
                                }
                            }
                        ),
                        cfg);
                    }
                );
            }
        }

        // TODO: need with registration
        //       improve this to store a second value, get the list of two values,
        //       delete a value, then get the list of one value again
        doAsyncStateTest = function (v) {
            asyncTest(
                "asyncStateTest: " + v,
                function () {
                    var postFix = " (" + v + ")",
                        lrs = session[v],
                        agent = new TinCan.Agent(
                            {
                                mbox: "mailto:tincanjs-test-lrs+" + Date.now() + "@tincanapi.com"
                            }
                        ),
                        activity = new TinCan.Activity(
                            {
                                id: "http://tincanapi.com/TinCanJS/Test/TinCan.LRS_asyncStateTest/0"
                            }
                        ),
                        documents = [
                            {
                                id: "TinCan.LRS.asyncStateTest1",
                                contents: "0 index value",
                                contentType: "text/plain",
                                etag: "\"5a414c6aa9a74957250abcde4ab40d1d51a8e432\"",
                                updated: false
                            }
                        ];

                    //
                    // start off by dropping them all to clear from previous runs
                    // and to test we can
                    //
                    lrs.dropState(
                        null,
                        {
                            agent: agent,
                            activity: activity,
                            callback: function (err, result) {
                                start();
                                ok(err === null, "dropState (all) callback err is null" + postFix);
                                TinCanTest.assertHttpRequestType(result, "dropState (all) callback result is xhr" + postFix);

                                if (err === null) {
                                    stop();

                                    //
                                    // since we deleted everything this should be empty
                                    //
                                    lrs.retrieveStateIds(
                                        {
                                            agent: agent,
                                            activity: activity,
                                            callback: function (err, result) {
                                                start();
                                                ok(err === null, "retrieveStateIds (empty) callback err is null" + postFix);
                                                deepEqual(result, [], "retrieveStateIds (empty) callback result is empty array" + postFix);

                                                if (err === null) {
                                                    stop();

                                                    //
                                                    // now populate a state value and verify we can get a list of one,
                                                    // and get the individual value itself
                                                    //
                                                    lrs.saveState(
                                                        documents[0].id,
                                                        documents[0].contents,
                                                        {
                                                            agent: agent,
                                                            activity: activity,
                                                            contentType: documents[0].contentType,
                                                            callback: function (err, result) {
                                                                start();
                                                                ok(err === null, "saveState (0) callback err is null" + postFix);
                                                                TinCanTest.assertHttpRequestType(result, "saveState (0) callback result is xhr" + postFix);

                                                                if (err === null) {
                                                                    stop();

                                                                    //
                                                                    // make sure we get back the list with a single value
                                                                    //
                                                                    lrs.retrieveStateIds(
                                                                        {
                                                                            agent: agent,
                                                                            activity: activity,
                                                                            callback: function (err, result) {
                                                                                start();
                                                                                ok(err === null, "retrieveStateIds (1) callback err is null" + postFix);
                                                                                deepEqual(result, [documents[0].id], "retrieveStateIds (1) callback result array" + postFix);

                                                                                if (err === null) {
                                                                                    stop();

                                                                                    //
                                                                                    // make sure we can get the state value back
                                                                                    //
                                                                                    lrs.retrieveState(
                                                                                        documents[0].id,
                                                                                        {
                                                                                            agent: agent,
                                                                                            activity: activity,
                                                                                            callback: function (err, result) {
                                                                                                start();

                                                                                                //
                                                                                                // some LRSs (Cloud in particular our Travis resource) may return capital letters
                                                                                                // in the hash, so lowercase the received one to improve odds it matches ours
                                                                                                //
                                                                                                if (err === null) {
                                                                                                    result.etag = result.etag.toLowerCase();
                                                                                                }

                                                                                                ok(err === null, "retrieveState (0) callback err is null" + postFix);
                                                                                                deepEqual(
                                                                                                    result,
                                                                                                    new TinCan.State(documents[0]),
                                                                                                    "retrieveState (0) callback result is verified" + postFix
                                                                                                );
                                                                                            }
                                                                                        }
                                                                                    );
                                                                                }
                                                                            }
                                                                        }
                                                                    );
                                                                }
                                                            }
                                                        }
                                                    );
                                                }
                                            }
                                        }
                                    );
                                }
                            }
                        }
                    );
                }
            );
        };

        // TODO: improve this to store a second value, get the list of two values,
        //       delete a value, then get the list of one value again
        doAsyncAgentProfileTest = function (v) {
            asyncTest(
                "asyncAgentProfileTest: " + v,
                function () {
                    var postFix = " (" + v + ")",
                        lrs = session[v],
                        agent = new TinCan.Agent(
                            {
                                mbox: "mailto:tincanjs-test-lrs+" + Date.now() + "@tincanapi.com"
                            }
                        ),
                        documents = [
                            {
                                id: "TinCan.LRS.asyncAgentProfileTest1",
                                contents: "0 index value",
                                contentType: "text/plain",
                                etag: "\"5a414c6aa9a74957250abcde4ab40d1d51a8e432\"",
                                updated: false,
                                agent: agent
                            }
                        ];

                    //
                    // Agent Profile doesn't have a "clear" ability, but we know the information we need
                    // to go ahead and delete the one id we set so hopefully that is all that exists, if
                    // we have more than one document in the above list we need to delete them all first
                    // or make sure we use the Etag, could consider in that case using the sync delete
                    // to make this test code a little more manageable
                    //
                    lrs.dropAgentProfile(
                        documents[0].id,
                        {
                            agent: agent,
                            callback: function (err, result) {
                                start();
                                ok(err === null, "dropAgentProfile (all) callback err is null" + postFix);
                                TinCanTest.assertHttpRequestType(result, "dropAgentProfile (all) callback result is xhr" + postFix);

                                if (err === null) {
                                    //
                                    // since we deleted everything this should be empty
                                    //
                                    lrs.retrieveAgentProfileIds(
                                        {
                                            agent: agent,
                                            callback: function (err, result) {
                                                start();
                                                ok(err === null, "retrieveAgentProfileIds (empty) callback err is null" + postFix);
                                                deepEqual(result, [], "retrieveAgentProfileIds (empty) callback result is empty array" + postFix);

                                                //
                                                // now populate a state value and verify we can get a list of one,
                                                // and get the individual value itself
                                                //
                                                lrs.saveAgentProfile(
                                                    documents[0].id,
                                                    documents[0].contents,
                                                    {
                                                        agent: agent,
                                                        contentType: documents[0].contentType,
                                                        callback: function (err, result) {
                                                            start();
                                                            ok(err === null, "saveAgentProfile (0) callback err is null" + postFix);
                                                            TinCanTest.assertHttpRequestType(result, "saveAgentProfile (0) callback result is xhr" + postFix);

                                                            if (err === null) {
                                                                //
                                                                // make sure we get back the list with a single value
                                                                //
                                                                lrs.retrieveAgentProfileIds(
                                                                    {
                                                                        agent: agent,
                                                                        callback: function (err, result) {
                                                                            start();
                                                                            ok(err === null, "retrieveAgentProfileIds (1) callback err is null" + postFix);
                                                                            deepEqual(result, [documents[0].id], "retrieveAgentProfileIds (1) callback result array" + postFix);

                                                                            //
                                                                            // make sure we can get the state value back
                                                                            //
                                                                            lrs.retrieveAgentProfile(
                                                                                documents[0].id,
                                                                                {
                                                                                    agent: agent,
                                                                                    callback: function (err, result) {
                                                                                        start();

                                                                                        //
                                                                                        // some LRSs (Cloud in particular our Travis resource) may return capital letters
                                                                                        // in the hash, so lowercase the received one to improve odds it matches ours
                                                                                        //
                                                                                        if (err === null) {
                                                                                            result.etag = result.etag.toLowerCase();
                                                                                        }

                                                                                        ok(err === null, "retrieveAgentProfile (0) callback err is null" + postFix);
                                                                                        deepEqual(
                                                                                            result,
                                                                                            new TinCan.AgentProfile(documents[0]),
                                                                                            "retrieveAgentProfile (0) callback result is verified" + postFix
                                                                                        );

                                                                                        //stop();
                                                                                    }
                                                                                }
                                                                            );
                                                                            stop();
                                                                        }
                                                                    }
                                                                );
                                                            }
                                                            stop();
                                                        }
                                                    }
                                                );
                                                stop();
                                            }
                                        }
                                    );
                                    stop();
                                }
                            }
                        }
                    );
                }
            );
        };

        // TODO: improve this to store a second value, get the list of two values,
        //       delete a value, then get the list of one value again
        doAsyncActivityProfileTest = function (v) {
            asyncTest(
                "asyncActivityProfileTest: " + v,
                function () {
                    var postFix = " (" + v + ")",
                        lrs = session[v],
                        activity = new TinCan.Activity(
                            {
                                id: "http://tincanapi.com/TinCanJS/Test/TinCan.LRS_asyncActivityProfileTest/0"
                            }
                        ),
                        documents = [
                            {
                                id: "TinCan.LRS.asyncActivityProfileTest1",
                                contents: "0 index value",
                                contentType: "text/plain",
                                etag: "\"5a414c6aa9a74957250abcde4ab40d1d51a8e432\"",
                                updated: false,
                                activity: activity
                            }
                        ];

                    //
                    // Activity Profile doesn't have a "clear" ability, but we know the information we need
                    // to go ahead and delete the one id we set so hopefully that is all that exists, if
                    // we have more than one document in the above list we need to delete them all first
                    // or make sure we use the Etag, could consider in that case using the sync delete
                    // to make this test code a little more manageable
                    //
                    lrs.dropActivityProfile(
                        documents[0].id,
                        {
                            activity: activity,
                            callback: function (err, result) {
                                start();
                                ok(err === null, "dropActivityProfile (all) callback err is null" + postFix);
                                TinCanTest.assertHttpRequestType(result, "dropActivityProfile (all) callback result is xhr" + postFix);

                                if (err === null) {
                                    //
                                    // since we deleted everything this should be empty
                                    //
                                    lrs.retrieveActivityProfileIds(
                                        {
                                            activity: activity,
                                            callback: function (err, result) {
                                                start();
                                                ok(err === null, "retrieveActivityProfileIds (empty) callback err is null" + postFix);
                                                deepEqual(result, [], "retrieveActivityProfileIds (empty) callback result is empty array" + postFix);

                                                //
                                                // now populate a state value and verify we can get a list of one,
                                                // and get the individual value itself
                                                //
                                                lrs.saveActivityProfile(
                                                    documents[0].id,
                                                    documents[0].contents,
                                                    {
                                                        activity: activity,
                                                        contentType: documents[0].contentType,
                                                        callback: function (err, result) {
                                                            start();
                                                            ok(err === null, "saveActivityProfile (0) callback err is null" + postFix);
                                                            TinCanTest.assertHttpRequestType(result, "saveActivityProfile (0) callback result is xhr" + postFix);

                                                            if (err === null) {
                                                                //
                                                                // make sure we get back the list with a single value
                                                                //
                                                                lrs.retrieveActivityProfileIds(
                                                                    {
                                                                        activity: activity,
                                                                        callback: function (err, result) {
                                                                            start();
                                                                            ok(err === null, "retrieveActivityProfileIds (1) callback err is null" + postFix);
                                                                            deepEqual(result, [documents[0].id], "retrieveActivityProfileIds (1) callback result array" + postFix);

                                                                            //
                                                                            // make sure we can get the state value back
                                                                            //
                                                                            lrs.retrieveActivityProfile(
                                                                                documents[0].id,
                                                                                {
                                                                                    activity: activity,
                                                                                    callback: function (err, result) {
                                                                                        start();

                                                                                        //
                                                                                        // some LRSs (Cloud in particular our Travis resource) may return capital letters
                                                                                        // in the hash, so lowercase the received one to improve odds it matches ours
                                                                                        //
                                                                                        if (err === null) {
                                                                                            result.etag = result.etag.toLowerCase();
                                                                                        }

                                                                                        ok(err === null, "retrieveActivityProfile (0) callback err is null" + postFix);
                                                                                        deepEqual(
                                                                                            result,
                                                                                            new TinCan.ActivityProfile(documents[0]),
                                                                                            "retrieveActivityProfile (0) callback result is verified" + postFix
                                                                                        );

                                                                                        //stop();
                                                                                    }
                                                                                }
                                                                            );
                                                                            stop();
                                                                        }
                                                                    }
                                                                );
                                                            }
                                                            stop();
                                                        }
                                                    }
                                                );
                                                stop();
                                            }
                                        }
                                    );
                                    stop();
                                }
                            }
                        }
                    );
                }
            );
        };

        doAsyncActivityTest = function (v) {
            asyncTest(
                "asyncActivityTest: " + v,
                function () {
                    // skip check for 0.9 when in XDomainRequest land because at least on
                    // Rustici LRSs we don't support getting back the Activity from only
                    // the id passed in, and in IE 8+9 the fakeStatus results in a 400
                    // instead of a 404 which is what our library uses to trigger setting
                    // the Activity automatically to pass this check
                    if (typeof XDomainRequest !== "undefined" && v === "0.9") {
                        start();
                        expect(0);
                        return;
                    }

                    var postFix = " (" + v + ")",
                        lrs = session[v],
                        activity = new TinCan.Activity(
                            {
                                id: "http://tincanapi.com/TinCanJS/Test/TinCan.LRS_asyncActivityTest/0"
                            }
                        );

                    lrs.retrieveActivity(
                        activity.id,
                        {
                            callback: function (err, result) {
                                start();
                                ok(err === null, "retrieveActivity callback err is null" + postFix);
                                deepEqual(activity, result, "retrieveActivity callback result is activity" + postFix);
                            }
                        }
                    );
                }
            );
        };

        for (i = 0; i < versions.length; i += 1) {
            if (typeof TinCanTestCfg.recordStores[versions[i]] !== "undefined") {
                doAsyncStateTest(versions[i]);
                doAsyncAgentProfileTest(versions[i]);
                doAsyncActivityProfileTest(versions[i]);
                doAsyncActivityTest(versions[i]);
                _queryStatementsRequestCfgTest(versions[i]);
            }
        }
    }());

    (function () {
        var versions = TinCan.versions(),
            doAllowFailFalseAboutAsyncTest,
            doAllowFailTrueAboutAsyncTest,
            doAllowFailFalseAboutSyncTest,
            doAllowFailTrueAboutSyncTest,
            i,
            lrs_true,
            lrs_false;

        /* .about */
        doAllowFailFalseAboutAsyncTest = function (lrs) {
            lrs.allowFail = false;

            asyncTest(
                "LRS about async exception: allowFail false (" + lrs.version + ")",
                function () {
                    var result = lrs.about(
                        {
                            callback: function (err, xhr) {
                                var i;
                                start();
                                ok(typeof err !== "undefined", "callback: has err argument");
                                ok(typeof xhr !== "undefined", "callback: has xhr argument");

                                // Do not allow the call to fail
                                ok(err === null, "callback err: is null");
                                ok(xhr instanceof TinCan.About, "callback: xhr is TinCan.About");
                                ok(xhr.hasOwnProperty("version"), "callback: xhr has field 'version'");

                                //
                                // IE8 didn't support .indexOf, so we are just skipping this test in that browser
                                // or any that doesn't have .indexOf
                                //
                                if (typeof Array.prototype.indexOf !== "undefined") {
                                    // skip to prevent uncaught exception, tested above
                                    if (typeof xhr.version !== "undefined") {
                                        // Will break if suite is ran against a version not
                                        // supported by this library
                                        for (i = 0; i < xhr.version.length; i += 1) {
                                            ok(versions.indexOf(xhr.version[i]) !== -1,
                                                "callback: xhr.version has valid version (" + xhr.version[i] + ")");
                                        }
                                    }
                                }
                            }
                        }
                    );
                    ok(typeof result === "undefined", "async result is not undefined");
                }
            );
        };

        doAllowFailTrueAboutAsyncTest = function (lrs) {
            asyncTest(
                "LRS about async exception: allowFail true (" + lrs.version + ")",
                function () {
                    var result = lrs.about(
                        {
                            callback: function (err, xhr) {
                                start();
                                ok(typeof err !== "undefined", "callback: err argument exists");
                                ok(typeof xhr !== "undefined", "callback: xhr argument exists");
                            }
                        }
                    );
                    ok(typeof result === "undefined", "async result is not undefined");
                }
            );
        };

        doAllowFailFalseAboutSyncTest = function (lrs) {
            lrs.allowFail = false;

            var result = lrs.about(),
                xhrversion,
                i;

            ok(result instanceof Object, "about allowFail false result: is an object (" + lrs.version + ")");
            ok(typeof result.err !== "undefined", "about allowFail false result: has err property (" + lrs.version + ")");
            ok(typeof result.xhr !== "undefined", "about allowFail false result: has xhr property (" + lrs.version + ")");

            ok(result.err === null, "about allowFail false: result.err: is null (" + lrs.version + ")");
            ok(result.xhr instanceof TinCan.About, "about allowFail false: result.xhr is TinCan.About (" + lrs.version + ")");
            ok(result.xhr.hasOwnProperty("version"), "about allowFail false: result.xhr has 'version' (" + lrs.version + ")");

            xhrversion = result.xhr.version;

            //
            // IE8 didn't support .indexOf, so we are just skipping this test in that browser
            // or any that doesn't have .indexOf
            //
            if (typeof Array.prototype.indexOf !== "undefined") {
                // Will break if suite is ran against a version not
                // supported by this library
                for (i = 0; i < xhrversion.length; i += 1) {
                    ok(versions.indexOf(xhrversion[i]) !== -1,
                        "about allowFail false: result.xhr.version has valid version [" + xhrversion[i] + "]");
                }
            }
        };

        doAllowFailTrueAboutSyncTest = function (lrs) {
            var result = lrs.about();
            ok(typeof result.err !== "undefined", "about allowFail true result: has err property (" + lrs.version + ")");
            ok(typeof result.xhr !== "undefined", "about allowFail true result: has xhr property (" + lrs.version + ")");
        };

        if(TinCan.LRS.syncEnabled) {
            test(
                "LRS about sync exception",
                function () {
                    var i,
                        lrs_true,
                        lrs_false;

                    for (i = 0; i < versions.length; i += 1) {
                        if (TinCanTestCfg.recordStores[versions[i]]) {
                            lrs_true = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
                            doAllowFailTrueAboutSyncTest(lrs_true);

                            lrs_false = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
                            doAllowFailFalseAboutSyncTest(lrs_false);
                        }
                    }
                }
            );
        }

        for (i = 0; i < versions.length; i += 1) {
            if (TinCanTestCfg.recordStores[versions[i]]) {
                lrs_true = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
                doAllowFailTrueAboutAsyncTest(lrs_true);

                lrs_false = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
                doAllowFailFalseAboutAsyncTest(lrs_false);
            }
        }
    }());

    //
    // this block specifically tests that the 'contextActivities.category' property
    // causes statement asVersion to throw an exception and therefore fail under
    // the two versions specified, the assertions in these tests will fail under
    // 1.x LRS versions because 'category' is an acceptable property so the asVersion
    // method won't throw an exception
    //
    (function () {
        var versions = [
                "0.95",
                "0.9"
            ],
            stCfg = {
                actor: {
                    mbox: "mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com"
                },
                verb: {
                    id: "http://adlnet.gov/expapi/verbs/experienced"
                },
                target: {
                    id: "http://tincanapi.com/TinCanJS/Test/TinCan.LRS_saveStatement/exception-sync"
                },
                context: {
                    contextActivities: {
                        category: [
                            {
                                id: "http://tincanapi.com/TinCanJS/Test/TinCan.LRS_saveStatement/exception-sync/cat"
                            }
                        ]
                    }
                }
            },
            doAllowFailFalseSaveStatementExceptionAsyncTest,
            doAllowFailTrueSaveStatementExceptionAsyncTest,
            doAllowFailFalseSaveStatementExceptionSyncTest,
            doAllowFailTrueSaveStatementExceptionSyncTest,
            doAllowFailFalseSaveStatementsExceptionAsyncTest,
            doAllowFailTrueSaveStatementsExceptionAsyncTest,
            doAllowFailFalseSaveStatementsExceptionSyncTest,
            doAllowFailTrueSaveStatementsExceptionSyncTest,
            i,
            lrs_true,
            lrs_false;

        /* .saveStatement */
        doAllowFailFalseSaveStatementExceptionAsyncTest = function (lrs, st) {
            lrs.allowFail = false;

            asyncTest(
                "LRS saveStatement async exception: allowFail false (" + lrs.version + ")",
                function () {
                    var result = lrs.saveStatement(
                        st,
                        {
                            callback: function (err, xhr) {
                                start();
                                ok(typeof err !== "undefined", "callback: has err argument");
                                ok(typeof xhr !== "undefined", "callback: has xhr argument");

                                if (typeof err !== "undefined") {
                                    ok(err instanceof Error, "callback err: is Error");
                                }
                                if (typeof err !== "undefined") {
                                    ok(xhr === null, "callback xhr is null");
                                }
                            }
                        }
                    );
                    ok(typeof result === "undefined", "result is undefined");
                }
            );
        };

        doAllowFailTrueSaveStatementExceptionAsyncTest = function (lrs, st) {
            asyncTest(
                "LRS saveStatement async exception: allowFail true (" + lrs.version + ")",
                function () {
                    var result = lrs.saveStatement(
                        st,
                        {
                            callback: function (err, xhr) {
                                start();
                                ok(err === null, "callback err argument is null");
                                ok(xhr === null, "callback xhr argument is null");
                            }
                        }
                    );
                    ok(typeof result === "undefined", "result is undefined");
                }
            );
        };

        doAllowFailFalseSaveStatementExceptionSyncTest = function (lrs, st) {
            lrs.allowFail = false;

            var result = lrs.saveStatement(st);

            ok(result instanceof Object, "allowFail false result: is an object (" + lrs.version + ")");
            ok(typeof result.err !== "undefined", "allowFail false result: has err property (" + lrs.version + ")");
            ok(typeof result.xhr !== "undefined", "allowFail false result: has xhr property (" + lrs.version + ")");

            if (typeof result.err !== "undefined") {
                ok(result.err instanceof Error, "allowFail false result.err: is Error (" + lrs.version + ")");
            }
            if (typeof result.err !== "undefined") {
                ok(result.xhr === null, "allowFail false result.xhr is null (" + lrs.version + ")");
            }
        };

        doAllowFailTrueSaveStatementExceptionSyncTest = function (lrs, st) {
            var result = lrs.saveStatement(st);
            deepEqual(result, { err: null, xhr: null }, "allowFail true result: matches deeply (" + lrs.version + ")");
        };

        /* .saveStatements */
        doAllowFailFalseSaveStatementsExceptionAsyncTest = function (lrs, sts) {
            lrs.allowFail = false;

            asyncTest(
                "LRS saveStatements async exception: allowFail false (" + lrs.version + ")",
                function () {
                    var result = lrs.saveStatements(
                        sts,
                        {
                            callback: function (err, xhr) {
                                start();
                                ok(typeof err !== "undefined", "callback: has err argument");
                                ok(typeof xhr !== "undefined", "callback: has xhr argument");

                                if (typeof err !== "undefined") {
                                    ok(err instanceof Error, "callback err: is Error");
                                }
                                if (typeof err !== "undefined") {
                                    ok(xhr === null, "callback xhr is null");
                                }
                            }
                        }
                    );
                    ok(typeof result === "undefined", "result is undefined");
                }
            );
        };

        doAllowFailTrueSaveStatementsExceptionAsyncTest = function (lrs, sts) {
            asyncTest(
                "LRS saveStatements async exception: allowFail true (" + lrs.version + ")",
                function () {
                    var result = lrs.saveStatements(
                        sts,
                        {
                            callback: function (err, xhr) {
                                start();
                                ok(err === null, "callback err argument is null");
                                ok(xhr === null, "callback xhr argument is null");
                            }
                        }
                    );
                    ok(typeof result === "undefined", "result is undefined");
                }
            );
        };

        doAllowFailFalseSaveStatementsExceptionSyncTest = function (lrs, sts) {
            lrs.allowFail = false;

            var result = lrs.saveStatements(sts);

            ok(result instanceof Object, "allowFail false result: is an object (" + lrs.version + ")");
            ok(typeof result.err !== "undefined", "allowFail false result: has err property (" + lrs.version + ")");
            ok(typeof result.xhr !== "undefined", "allowFail false result: has xhr property (" + lrs.version + ")");

            if (typeof result.err !== "undefined") {
                ok(result.err instanceof Error, "allowFail false result.err: is Error (" + lrs.version + ")");
            }
            if (typeof result.err !== "undefined") {
                ok(result.xhr === null, "allowFail false result.xhr is null (" + lrs.version + ")");
            }
        };

        doAllowFailTrueSaveStatementsExceptionSyncTest = function (lrs, sts) {
            var result = lrs.saveStatements(sts);
            deepEqual(result, { err: null, xhr: null }, "allowFail true result: matches deeply (" + lrs.version + ")");
        };

        test(
            "LRS saveStatement/saveStatements sync exception",
            function () {
                var i,
                    lrs_true,
                    lrs_false;

                for (i = 0; i < versions.length; i += 1) {
                    if (TinCanTestCfg.recordStores[versions[i]]) {
                        lrs_true = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
                        doAllowFailTrueSaveStatementExceptionSyncTest(lrs_true, new TinCan.Statement(stCfg));
                        doAllowFailTrueSaveStatementsExceptionSyncTest(lrs_true, [ new TinCan.Statement(stCfg) ]);

                        lrs_false = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
                        doAllowFailFalseSaveStatementExceptionSyncTest(lrs_false, new TinCan.Statement(stCfg));
                        doAllowFailFalseSaveStatementsExceptionSyncTest(lrs_false, [ new TinCan.Statement(stCfg) ]);
                    }
                }
            }
        );

        for (i = 0; i < versions.length; i += 1) {
            if (TinCanTestCfg.recordStores[versions[i]]) {
                lrs_false = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
                doAllowFailFalseSaveStatementExceptionAsyncTest(lrs_false, new TinCan.Statement(stCfg));
                doAllowFailFalseSaveStatementsExceptionAsyncTest(lrs_false, [ new TinCan.Statement(stCfg) ]);

                lrs_true = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
                doAllowFailTrueSaveStatementExceptionAsyncTest(lrs_true, new TinCan.Statement(stCfg));
                doAllowFailTrueSaveStatementsExceptionAsyncTest(lrs_true, [ new TinCan.Statement(stCfg) ]);
            }
        }
    }());

    if (TinCanTest.testAttachments) {
        (function () {
            var versions = TinCan.versions(),
                stCfg = {
                    actor: {
                        mbox: "mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com"
                    },
                    verb: {
                        id: "http://adlnet.gov/expapi/verbs/experienced"
                    },
                    target: {
                        id: "http://tincanapi.com/TinCanJS/Test/TinCan.LRS"
                    }
                },
                fileContents,
                testBinaryAttachmentRoundTrip = function (lrs) {
                    asyncTest(
                        "Binary Attachment - round trip (" + lrs.version + ")",
                        function () {
                            var stCfgAtt = JSON.parse(JSON.stringify(stCfg)),
                                statement;

                            stCfgAtt.target.id = stCfgAtt.target.id + "/binary-attachment-roundtrip/" + lrs.version;

                            stCfgAtt.attachments = [
                                {
                                    display: {
                                        "en-US": "Test Attachment"
                                    },
                                    usageType: "http://id.tincanapi.com/attachment/supporting_media",
                                    contentType: "image/jpeg",
                                    content: fileContents
                                }
                            ];

                            statement = new TinCan.Statement(stCfgAtt);

                            lrs.saveStatement(
                                statement,
                                {
                                    callback: function (err, xhr) {
                                        start();
                                        ok(err === null, "statement saved successfully");
                                        if (err !== null) {
                                            console.log("save statement failed: " + err);
                                            console.log(xhr.responseText);
                                        }
                                        ok(xhr.status === 204, "xhr received 204");
                                        stop();

                                        lrs.retrieveStatement(
                                            statement.id,
                                            {
                                                params: {
                                                    attachments: true
                                                },
                                                callback: function (err, result) {
                                                    start();
                                                    ok(err === null, "statement retrieved successfully");
                                                    ok(statement.attachments[0].sha2 === result.attachments[0].sha2, "re-hash matches original");
                                                }
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    );
                };

            QUnit.module(
                "LRS - Binary Attachments",
                {
                    setup: function () {
                        TinCanTest.loadBinaryFileContents(
                            function (contents) {
                                fileContents = contents;
                                start();
                            }
                        );
                        stop();
                    }
                }
            );

            for (i = 0; i < versions.length; i += 1) {
                if ((! (versions[i] === "0.9" || versions[i] === "0.95")) && TinCanTestCfg.recordStores[versions[i]]) {
                    lrs = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
                    lrs.allowFail = false;

                    testBinaryAttachmentRoundTrip(lrs);
                }
            }
        }());
    }
}());
