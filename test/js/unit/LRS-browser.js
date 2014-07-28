/*!
    Copyright 2014 Rustici Software

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
    // check we are in a browser environment - will break if another
    // synchonous environment were to be supported
    if (! TinCan.LRS.syncEnabled) {
        return;
    }
    var versions = [
            "1.0.1",
            "1.0.0",
            "0.95",
            "0.9"
        ],
        testString,
        stCfg = {
            actor: {
                mbox: "mailto:tincanjs-test-tincan+" + Date.now() + "@tincanapi.com"
            },
            verb: {
                id: "http://adlnet.gov/expapi/verbs/experienced"
            },
            target: {
                id: "http://tincanapi.com/TinCanJS/Test/TinCan.LRS-browser"
            }
        },
        testSaveStatementConversion,
        testSaveStateConversion;

    testString = (function () {
        var str = "x",
            i;
        for (i = 0; i < 500; i += 1) {
            str += "x";
        }
        return str;
    }());

    testRetrieveStatementConversion = function (lrs) {
        asyncTest(
            "IEModeConversion - retrieveStatement (async, " + lrs.version + ")",
            function () {
                lrs.retrieveStatement(
                    //
                    // this statement will always be not found, but we really
                    // only care about getting a valid request/response rather
                    // than the content of the response itself beyond the status code
                    //
                    TinCan.Utils.getUUID(),
                    {
                        callback: function (err, xhr) {
                            start();
                            ok((err === 404 || (typeof XDomainRequest !== "undefined" && typeof xhr.status === "undefined" && err === 400)), "statement retrieve request processed successfully after an IEModeConversion");
                        }
                    }
                );
            }
        );
    };

    testSaveStatementConversion = function (lrs) {
        asyncTest(
            "IEModeConversion - saveStatement (async, " + lrs.version + ")",
            function () {
                lrs.saveStatement(
                    new TinCan.Statement(stCfg),
                    {
                        callback: function (err, xhr) {
                            start();
                            ok(err === null, "statement saved successfully after an IEModeConversion");
                            ok((xhr.status === 204 || (typeof XDomainRequest !== "undefined" && (xhr.status === 1223 || typeof xhr.status === "undefined"))), "xhr received 204");
                        }
                    }
                );
            }
        );
    };

    testSaveStateConversion = function (lrs) {
        asyncTest(
            "IEModeConversion - saveState (async, " + lrs.version + ")",
            function () {
                lrs.saveState(
                    "TestKey",
                    "TestValue",
                    {
                        agent: new TinCan.Agent(stCfg.actor),
                        activity: {
                            id: "testId"
                        },
                        callback: function (err, xhr) {
                            start();
                            ok(err !== null, "saveState request was denied");
                            ok(xhr === null, "saveState request did not return an XHR as no request was made");
                        }
                    }
                );
            }
        )
    };

    QUnit.module("LRS Instance - Browser");

    // Unit tests for _IEModeConversion with 2 sets of reasonable parameters
    test(
        "IEModeConversion - Empty Params",
        function () {
            var i,
                prop,
                result,
                cfg,
                blankCfg = function () {
                    return {
                        size: 0,
                        url: "",
                        headers: {},
                        pairs: [],
                        cfg: {}
                    }
                };

            for (i = 0; i < versions.length; i += 1) {
                if (TinCanTestCfg.recordStores[versions[i]]) {
                    lrs = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
                    lrs.extended = testString;

                    // reset
                    cfg = blankCfg();
                    result = lrs._IEModeConversion(cfg.url, cfg.headers, cfg.pairs, cfg.cfg);

                    ok(result === "?method=undefined", "url consists of only what is added in IEModeConversion (" + lrs.version + ")");
                    for (prop in cfg.headers) {
                        if (cfg.headers.hasOwnProperty(prop)) {
                            cfg.size += 1;
                        }
                    }
                    ok(cfg.size === 1 && cfg.headers["Content-Type"] === "application/x-www-form-urlencoded",
                        "headers only contains a 'Content-Type' property and it is of type application/x-www-form-urlencoded (" + lrs.version + ")");
                    ok(cfg.pairs.length === 0, "pairs remains unchanged (" + lrs.version + ")");
                    ok(cfg.cfg.method === "POST", "cfg.method is set to 'POST' (" + lrs.version + ")");
                    ok(cfg.cfg.hasOwnProperty("params"), "cfg.params is defined (" + lrs.version + ")");
                    ok(typeof cfg.cfg.data === "undefined", "cfg.data is undefined (" + lrs.version +")");
                }
            }
        }
    );

    test(
        "IEModeConversion - Expected Params",
        function () {
            var i,
                prop,
                result,
                cfg,
                expectedCfg = function () {
                    return {
                        size: 0,
                        url: "http://testUrl.com/test",
                        headers: {
                            "header1": "testThis",
                            "header2": "testThat"
                        },
                        pairs: [
                            "param1",
                            "param2",
                            "param3"
                        ],
                        cfg: {
                            method: "PUT",
                            params: {
                                statementId: "testId"
                            },
                            url: "statements",
                            headers: {
                                "Content-Type": "testication/testson"
                            },
                            data: "testCfgData..!"
                        }
                    }
                };

            for (i = 0; i < versions.length; i += 1) {
                if (TinCanTestCfg.recordStores[versions[i]]) {
                    lrs = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
                    lrs.extended = testString;

                    // reset
                    cfg = expectedCfg();

                    result = lrs._IEModeConversion(cfg.url, cfg.headers, cfg.pairs, cfg.cfg);
                    ok(result === "http://testUrl.com/test?method=PUT", "url is properly constructed (" + lrs.version + ")");
                    for (prop in cfg.headers) {
                        if (cfg.headers.hasOwnProperty(prop)) {
                            cfg.size += 1;
                        }
                    }
                    ok(cfg.size === 3 && cfg.headers.header1 === "testThis" && cfg.headers.header2 === "testThat"
                        && cfg.headers["Content-Type"] === "application/x-www-form-urlencoded",
                        "headers maintains original properties, and 'Content-Type' is added with value 'application/x-www-form-urlencoded (" + lrs.version + ")");
                    ok(cfg.pairs.length === 6, "pairs is properly formed (" + lrs.version + ")");
                    ok(cfg.cfg.method === "POST", "cfg.method is set to 'POST' (" + lrs.version + ")");
                    ok(cfg.cfg.hasOwnProperty("params"), "cfg.params is defined (" + lrs.version + ")");
                    ok(cfg.cfg.data === "param1&param2&param3&header1=testThis&header2=testThat&content=testCfgData..!", "cfg.data is properly formed (" + lrs.version +")");
                }
            }
        }
    );

    // Integration testing: test common LRS functionality with an LRS
    // configuration that will trigger an IE Mode conversion automatically
    // - saveStatement is expected to work as this library supports application/json for post requests
    // - saveState is expected to fail as application/octet-stream is unsupported
    // these semantics may change as other content types become supported
    for (i = 0; i < versions.length; i += 1) {
        if (TinCanTestCfg.recordStores[versions[i]]) {
            lrs = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
            lrs.extended = testString;

            testSaveStatementConversion(lrs);
            testRetrieveStatementConversion(lrs);
            testSaveStateConversion(lrs);
        }
    }
}());
