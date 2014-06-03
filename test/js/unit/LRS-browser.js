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
    var session = null,
        endpoint = "https://cloud.scorm.com/tc/public/",
        lrsArray = [],
        versions = [
            "1.0.1",
            "1.0.0",
            "0.95",
            "0.9"
        ],
        i,
        lrs,
        testString = (function () {
            var str = "x",
                i;
            for (i = 0; i < 500; i += 1) {
                str += "x";
            }
            return str;
        }()),
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
                contextActivities: {}
            }
        },
        blankCfg = function () {
            return {
                size: 0,
                url: "",
                headers: {},
                pairs: [],
                cfg: {}
            }
        },
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
        },
        testSaveStatementConversion = function (i) {
            asyncTest(
                "IEModeConversion - saveStatement (" + versions[i] + ")",
                function () {
                    lrsArray[i].saveStatement(new TinCan.Statement(stCfg),
                        {
                            callback: function (err, xhr) {
                                start();
                                ok(err === null, "statement saved successfully after an IEModeConversion");
                                ok(xhr.status === 204, "xhr received 204");
                            }
                        }
                    );
                }
            );
        },
        testSaveStateConversion = function (i) {
            asyncTest(
                "IEModeConversion - saveState (" + versions[i] + ")",
                function () {
                    lrsArray[i].saveState("TestKey", "TestValue",
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

    QUnit.module("LRS Instance - Browser",
        {
            setup: function () {
                for(i = 0; i < versions.length; i += 1) {
                    TinCanTestCfg.recordStores[versions[i]].extended = testString;
                    lrs = new TinCan.LRS(TinCanTestCfg.recordStores[versions[i]]);
                    lrsArray.push(lrs);
                }
            },
            teardown: function () {
                // delete the extened field in order to not mess with the cfg for other tests
                for(i = 0; i < versions.length; i += 1) {
                    delete TinCanTestCfg.recordStores[versions[i]].extended;
                }
                lrsArray = [];
            }
        }
    );

    // Unit tests for _IEModeConversion with 2 sets of reasonable parameters
    test(
        "IEModeConversion - Empty Params",
        function () {
            var i,
                prop,
                result,
                cfg;

            for (i = 0; i < lrsArray.length; i += 1) {
                // reset
                cfg = blankCfg();
                result = lrsArray[i]._IEModeConversion(cfg.url, cfg.headers, cfg.pairs, cfg.cfg);

                ok(result === "?method=undefined", "url consists of only what is added in IEModeConversion (" + lrsArray[i].version + ")");
                for (prop in cfg.headers) {
                    if (cfg.headers.hasOwnProperty(prop)) {
                        cfg.size += 1;
                    }
                }
                ok(cfg.size === 1 && cfg.headers["Content-Type"] === "application/x-www-form-urlencoded",
                    "headers only contains a 'Content-Type' property and it is of type application/x-www-form-urlencoded (" + lrsArray[i].version + ")");
                ok(cfg.pairs.length === 0, "pairs remains unchanged (" + lrsArray[i].version + ")");
                ok(cfg.cfg.method === "POST", "cfg.method is set to 'POST' (" + lrsArray[i].version + ")");
                ok(cfg.cfg.hasOwnProperty("params"), "cfg.params is defined (" + lrsArray[i].version + ")");
                ok(typeof cfg.cfg.data === "undefined", "cfg.data is undefined (" + lrsArray[i].version +")");
            }
        }
    );

    test(
        "IEModeConversion - Expected Params",
        function () {
            var i,
                prop,
                result,
                cfg;

            for (i = 0; i < lrsArray.length; i += 1) {
                // reset
                cfg = expectedCfg();

                result = lrsArray[i]._IEModeConversion(cfg.url, cfg.headers, cfg.pairs, cfg.cfg);
                ok(result === "http://testUrl.com/test?method=PUT", "url is properly constructed (" + lrsArray[i].version + ")");
                for (prop in cfg.headers) {
                    if (cfg.headers.hasOwnProperty(prop)) {
                        cfg.size += 1;
                    }
                }
                ok(cfg.size === 3 && cfg.headers.header1 === "testThis" && cfg.headers.header2 === "testThat"
                    && cfg.headers["Content-Type"] === "application/x-www-form-urlencoded",
                    "headers maintains original properties, and 'Content-Type' is added with value 'application/x-www-form-urlencoded (" + lrsArray[i].version + ")");
                ok(cfg.pairs.length === 6, "pairs is properly formed (" + lrsArray[i].version + ")");
                ok(cfg.cfg.method === "POST", "cfg.method is set to 'POST' (" + lrsArray[i].version + ")");
                ok(cfg.cfg.hasOwnProperty("params"), "cfg.params is defined (" + lrsArray[i].version + ")");
                ok(cfg.cfg.data === "param1&param2&param3&header1=testThis&header2=testThat&content=testCfgData..!", "cfg.data is properly formed (" + lrsArray[i].version +")");
            }
        }
    );

    // Integration testing: test common LRS functionality with an LRS
    // configuration that will trigger an IE Mode conversion automatically
    // - saveStatement is expected to work as this library supports application/json for post requests
    // - saveState is expected to fail as application/octet-stream is unsupported
    // these semantics may change as other content types become supported
    for (i = 0; i < versions.length; i += 1) {
        testSaveStatementConversion(i);
        testSaveStateConversion(i);
    }
}());
