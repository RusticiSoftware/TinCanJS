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

    QUnit.module("Group Statics");

    test(
        "Group.fromJSON",
        function () {
            var raw = {
                    mbox: "test-group@tincanapi.com",
                    member: [
                        "test-group-member+1@tincanapi.com",
                        "test-group-member+2@tincanapi.com"
                    ]
                },
                string,
                result
            ;

            result = TinCan.Group.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.Group, "returns TinCan.Group");
        }
    );

    QUnit.module("Group Instance");

    test(
        "group Object",
        function () {
            var obj = new TinCan.Group (),
                nullProps = [
                    "name",
                    "mbox",
                    "mbox_sha1sum",
                    "openid",
                    "account"
                ],
                i
            ;

            ok(obj instanceof TinCan.Group, "group is TinCan.Group");

            for (i = 0; i < nullProps.length; i += 1) {
                ok(obj.hasOwnProperty(nullProps[i]), "object has property: " + nullProps[i]);
                strictEqual(obj[nullProps[i]], null, "object property initial value: " + nullProps[i]);
            }
            ok(obj.hasOwnProperty("member"), "group has property: member");
            deepEqual(obj.member, [], "group.member property initial value");

            strictEqual(obj.LOG_SRC, "Group", "group property LOG_SRC initial value");
            strictEqual(obj.objectType, "Group", "group property objectType initial value");
        }
    );

    test(
        "group variants",
        function () {
            var set = [
                    {
                        name: "group with name",
                        instanceConfig: {
                            name: "Test Group"
                        },
                        toString: "Group: Test Group",
                        checkProps: {
                            name: "Test Group"
                        }
                    },
                    {
                        name: "group with mbox",
                        instanceConfig: {
                            mbox: "mailto:test-group@tincanapi.com"
                        },
                        toString: "Group: test-group@tincanapi.com",
                        checkProps: {
                            mbox: "mailto:test-group@tincanapi.com"
                        }
                    },
                    {
                        name: "group with mbox (mailto: added)",
                        instanceConfig: {
                            mbox: "test-group@tincanapi.com"
                        },
                        toString: "Group: test-group@tincanapi.com",
                        checkProps: {
                            mbox: "mailto:test-group@tincanapi.com"
                        }
                    },
                    {
                        name: "group with mbox_sha1sum",
                        instanceConfig: {
                            mbox_sha1sum: "arbitrary"
                        },
                        toString: "Group: arbitrary",
                        checkProps: {
                            mbox_sha1sum: "arbitrary"
                        }
                    },
                    {
                        name: "group with openid",
                        instanceConfig: {
                            openid: "http://tincanapi.com/"
                        },
                        toString: "Group: http://tincanapi.com/",
                        checkProps: {
                            openid: "http://tincanapi.com/"
                        }
                    },
                    {
                        name: "group with account (empty)",
                        instanceConfig: {
                            account: {}
                        },
                        toString: "Group: AgentAccount: unidentified",
                        checkProps: {
                            account: new TinCan.AgentAccount({ name: null, homePage: null })
                        }
                    },
                    {
                        name: "group with account (name only)",
                        instanceConfig: {
                            account: {
                                name: "test"
                            }
                        },
                        toString: "Group: test:-",
                        checkProps: {
                            account: new TinCan.AgentAccount({ name: "test", homePage: null })
                        }
                    },
                    {
                        name: "group with account (homePage only)",
                        instanceConfig: {
                            account: {
                                homePage: "http://tincanapi.com/"
                            }
                        },
                        toString: "Group: -:http://tincanapi.com/",
                        checkProps: {
                            account: new TinCan.AgentAccount({ name: null, homePage: "http://tincanapi.com/" })
                        }
                    },
                    {
                        name: "group with account (full)",
                        instanceConfig: {
                            account: {
                                name: "test",
                                homePage: "http://tincanapi.com/"
                            }
                        },
                        toString: "Group: test:http://tincanapi.com/",
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
                obj = new TinCan.Group (row.instanceConfig);

                ok(obj instanceof TinCan.Group, "object is TinCan.Agent (" + row.name + ")");
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
        "group with members",
        function () {
            var obj,
                result,
                raw  = { mbox: "test-group-member@tincanapi.com" },
                raw2 = { mbox: "test-group-member+1@tincanapi.com" },
                common = new TinCan.Agent(raw),
                common2 = new TinCan.Agent(raw2),
                set = [
                    {
                        name: "empty member",
                        instanceConfig: {
                            member: []
                        },
                        checkMember: []
                    },
                    {
                        name: "2 raw",
                        instanceConfig: {
                            member: [ raw, raw2 ]
                        },
                        checkMember: [ common, common2 ]
                    },
                    {
                        name: "1 precreated",
                        instanceConfig: {
                            member: [ common ]
                        },
                        checkMember: [ common ]
                    },
                    {
                        name: "2 precreated",
                        instanceConfig: {
                            member: [ common, common2 ]
                        },
                        checkMember: [ common, common2 ]
                    },
                    {
                        name: "2 mixed",
                        instanceConfig: {
                            member: [ raw, common2 ]
                        },
                        checkMember: [ common, common2 ]
                    },
                    {
                        name: "2 mixed reversed",
                        instanceConfig: {
                            member: [ common, raw2 ]
                        },
                        checkMember: [ common, common2 ]
                    },
                    {
                        name: "4 mixed",
                        instanceConfig: {
                            member: [ common, raw, common2, raw2 ]
                        },
                        checkMember: [ common, common, common2, common2 ]
                    }
                ]
            ;

            for (i = 0; i < set.length; i += 1) {
                row = set[i];
                obj = new TinCan.Group (row.instanceConfig);

                deepEqual(obj.member, row.checkMember, "object.member value" + " (" + row.name + ")");
            }
        }
    );

    test(
        "group asVersion",
        function () {
            // include other properties to confirm correct response
            // of single unique id field
            var set = [
                    {
                        name: "mbox",
                        instanceConfig: {
                            name: "Test Group",
                            mbox: "test-group@tincanapi.com",
                            mbox_sha1sum: "arbitrary",
                            openid: "http://tincanapi.com/",
                            account: {}
                        },
                        versions: {
                            latest: { objectType: "Group", name: "Test Group", mbox: "mailto:test-group@tincanapi.com" },
                            "0.9": { objectType: "Group", name: [ "Test Group" ], mbox: [ "mailto:test-group@tincanapi.com" ] }
                        }
                    },
                    {
                        name: "mbox_sha1sum",
                        instanceConfig: {
                            name: "Test Group",
                            mbox_sha1sum: "arbitrary",
                            openid: "http://tincanapi.com/",
                            account: {}
                        },
                        versions: {
                            latest: { objectType: "Group", name: "Test Group", mbox_sha1sum: "arbitrary" },
                            "0.9": { objectType: "Group", name: [ "Test Group" ], mbox_sha1sum: [ "arbitrary" ] }
                        }
                    },
                    {
                        name: "openid",
                        instanceConfig: {
                            name: "Test Group",
                            openid: "http://tincanapi.com/",
                            account: {}
                        },
                        versions: {
                            latest: { objectType: "Group", name: "Test Group", openid: "http://tincanapi.com/" },
                            "0.9": { objectType: "Group", name: [ "Test Group" ], openid: [ "http://tincanapi.com/" ] }
                        }
                    },
                    {
                        name: "account",
                        instanceConfig: {
                            name: "Test Group",
                            account: {
                                name: "name",
                                homePage: "homePage"
                            }
                        },
                        versions: {
                            latest: { objectType: "Group", name: "Test Group", account: { name: "name", homePage: "homePage" } },
                            "0.9": { objectType: "Group", name: [ "Test Group" ], account: [ { accountName: "name", accountServiceHomePage: "homePage" } ] }
                        }
                    },
                    {
                        name: "member",
                        instanceConfig: {
                            name: "Test Group",
                            member: [
                                {
                                    mbox: "test-group@tincanapi.com"
                                }
                            ]
                        },
                        versions: {
                            latest: { objectType: "Group", name: "Test Group", member: [ { objectType: "Agent", mbox: "mailto:test-group@tincanapi.com" } ] },
                            "0.9": { objectType: "Group", name: [ "Test Group" ], member: [ { objectType: "Agent", mbox: [ "mailto:test-group@tincanapi.com" ] } ] }
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
                obj = new TinCan.Group (row.instanceConfig);

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
