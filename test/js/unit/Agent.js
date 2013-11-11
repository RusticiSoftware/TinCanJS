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
    var session = null;

    QUnit.module("Agent Statics");

    test(
        "Agent.fromJSON",
        function () {
            var raw = {
                    mbox: "test-agent@tincanapi.com"
                },
                string,
                result
            ;

            result = TinCan.Agent.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.Agent, "returns TinCan.Agent");
        }
    );

    QUnit.module("Agent Instance");

    test(
        "agent Object",
        function () {
            var obj = new TinCan.Agent (),
                nullProps = [
                    "name",
                    "mbox",
                    "mbox_sha1sum",
                    "openid",
                    "account"
                ],
                i
            ;

            ok(obj instanceof TinCan.Agent, "object is TinCan.Agent");

            for (i = 0; i < nullProps.length; i += 1) {
                ok(obj.hasOwnProperty(nullProps[i]), "object has property: " + nullProps[i]);
                strictEqual(obj[nullProps[i]], null, "object property initial value: " + nullProps[i]);
            }

            strictEqual(obj.LOG_SRC, "Agent", "object property LOG_SRC initial value");
            strictEqual(obj.objectType, "Agent", "object property objectType initial value");
        }
    );

    test(
        "agent variants",
        function () {
            var set = [
                    {
                        name: "agent with name",
                        instanceConfig: {
                            name: "Test Agent"
                        },
                        toString: "Test Agent",
                        checkProps: {
                            name: "Test Agent"
                        }
                    },
                    {
                        name: "agent with mbox (mailto: added)",
                        instanceConfig: {
                            mbox: "test-agent@tincanapi.com"
                        },
                        toString: "test-agent@tincanapi.com",
                        checkProps: {
                            mbox: "mailto:test-agent@tincanapi.com"
                        }
                    },
                    {
                        name: "agent with mbox",
                        instanceConfig: {
                            mbox: "mailto:test-agent@tincanapi.com"
                        },
                        toString: "test-agent@tincanapi.com",
                        checkProps: {
                            mbox: "mailto:test-agent@tincanapi.com"
                        }
                    },
                    {
                        name: "agent with mbox_sha1sum",
                        instanceConfig: {
                            mbox_sha1sum: "arbitrary"
                        },
                        toString: "arbitrary",
                        checkProps: {
                            mbox_sha1sum: "arbitrary"
                        }
                    },
                    {
                        name: "agent with openid",
                        instanceConfig: {
                            openid: "http://tincanapi.com/"
                        },
                        toString: "http://tincanapi.com/",
                        checkProps: {
                            openid: "http://tincanapi.com/"
                        }
                    },
                    {
                        name: "agent with account (empty)",
                        instanceConfig: {
                            account: {}
                        },
                        toString: "AgentAccount: unidentified",
                        checkProps: {
                            account: new TinCan.AgentAccount({ name: null, homePage: null })
                        }
                    },
                    {
                        name: "agent with account (name only)",
                        instanceConfig: {
                            account: {
                                name: "test"
                            }
                        },
                        toString: "test:-",
                        checkProps: {
                            account: new TinCan.AgentAccount({ name: "test", homePage: null })
                        }
                    },
                    {
                        name: "agent with account (homePage only)",
                        instanceConfig: {
                            account: {
                                homePage: "http://tincanapi.com/"
                            }
                        },
                        toString: "-:http://tincanapi.com/",
                        checkProps: {
                            account: new TinCan.AgentAccount({ name: null, homePage: "http://tincanapi.com/" })
                        }
                    },
                    {
                        name: "agent with account (full)",
                        instanceConfig: {
                            account: {
                                name: "test",
                                homePage: "http://tincanapi.com/"
                            }
                        },
                        toString: "test:http://tincanapi.com/",
                        checkProps: {
                            account: new TinCan.AgentAccount({ name: "test", homePage: "http://tincanapi.com/" })
                        }
                    }
                ],
                i,
                obj,
                result
            ;

            for (i = 0; i < set.length; i += 1) {
                row = set[i];
                obj = new TinCan.Agent (row.instanceConfig);

                ok(obj instanceof TinCan.Agent, "object is TinCan.Agent (" + row.name + ")");
                strictEqual(obj.toString(), row.toString, "object.toString (" + row.name + ")");
                if (typeof row.checkProps !== "undefined") {
                    for (key in row.checkProps) {
                        deepEqual(obj[key], row.checkProps[key], "object property initial value: " + key + " (" + row.name + ")");
                    }
                }
            }
        }
    );

    test(
        "agent asVersion",
        function () {
            // include other properties to confirm correct response
            // of single unique id field
            var set = [
                    {
                        name: "mbox",
                        instanceConfig: {
                            name: "Test Agent",
                            mbox: "test-agent@tincanapi.com",
                            mbox_sha1sum: "arbitrary",
                            openid: "http://tincanapi.com/",
                            account: {}
                        },
                        versions: {
                            latest: { objectType: "Agent", name: "Test Agent", mbox: "mailto:test-agent@tincanapi.com" },
                            "0.9": { objectType: "Agent", name: [ "Test Agent" ], mbox: [ "mailto:test-agent@tincanapi.com" ] }
                        }
                    },
                    {
                        name: "mbox_sha1sum",
                        instanceConfig: {
                            name: "Test Agent",
                            mbox_sha1sum: "arbitrary",
                            openid: "http://tincanapi.com/",
                            account: {}
                        },
                        versions: {
                            latest: { objectType: "Agent", name: "Test Agent", mbox_sha1sum: "arbitrary" },
                            "0.9": { objectType: "Agent", name: [ "Test Agent" ], mbox_sha1sum: [ "arbitrary" ] }
                        }
                    },
                    {
                        name: "openid",
                        instanceConfig: {
                            name: "Test Agent",
                            openid: "http://tincanapi.com/",
                            account: {}
                        },
                        versions: {
                            latest: { objectType: "Agent", name: "Test Agent", openid: "http://tincanapi.com/" },
                            "0.9": { objectType: "Agent", name: [ "Test Agent" ], openid: [ "http://tincanapi.com/" ] }
                        }
                    },
                    {
                        name: "account",
                        instanceConfig: {
                            name: "Test Agent",
                            account: {
                                name: "name",
                                homePage: "homePage"
                            }
                        },
                        versions: {
                            latest: { objectType: "Agent", name: "Test Agent", account: { name: "name", homePage: "homePage" } },
                            "0.9": { objectType: "Agent", name: [ "Test Agent" ], account: [ { accountName: "name", accountServiceHomePage: "homePage" } ] }
                        }
                    }
                ],
                versions = TinCan.versions(),
                i,
                v,
                obj,
                result
            ;

            for (i = 0; i < set.length; i += 1) {
                row = set[i];
                obj = new TinCan.Agent (row.instanceConfig);

                result = obj.asVersion();
                deepEqual(result, row.versions.latest, "object.asVersion() latest: " + row.name);

                for (v = 0; v < versions.length; v += 1) {
                    result = obj.asVersion(versions[v]);
                    deepEqual(result, (row.versions.hasOwnProperty(versions[v]) ? row.versions[versions[v]] : row.versions.latest), "object.asVersion() " + versions[v] + " : " + row.name);
                }
            }
        }
    );
}());
