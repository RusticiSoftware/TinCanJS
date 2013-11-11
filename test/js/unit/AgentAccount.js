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

    QUnit.module("AgentAccount Statics");

    test(
        "AgentAccount.fromJSON",
        function () {
            var raw = {},
                string,
                result
            ;

            result = TinCan.AgentAccount.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.AgentAccount, "returns TinCan.AgentAccount");
        }
    );

    QUnit.module("AgentAccount Instance");

    test(
        "object prototype",
        function () {
            var obj = new TinCan.AgentAccount ();
            strictEqual(obj.LOG_SRC, "AgentAccount", "object property LOG_SRC initial value");
        }
    );

    test(
        "object variations",
        function () {
            var obj,
                result
            ;

            var set = [
                    {
                        name: "empty",
                        instanceConfig: {},
                        toString: "AgentAccount: unidentified",
                        checkProps: {
                            name: null,
                            homePage: null
                        },
                        checkAsVersions: {
                            latest: { name: null, homePage: null },
                            "0.9": { accountName: null, accountServiceHomePage: null }
                        }
                    },
                    {
                        name: "name only",
                        instanceConfig: {
                            name: "test"
                        },
                        toString: "test:-",
                        checkProps: {
                            name: "test"
                        },
                        checkAsVersions: {
                            latest: { name: "test", homePage: null },
                            "0.9": { accountName: "test", accountServiceHomePage: null }
                        }
                    },
                    {
                        name: "homePage only",
                        instanceConfig: {
                            homePage: "http://tincanapi.com/"
                        },
                        toString: "-:http://tincanapi.com/",
                        checkProps: {
                            homePage: "http://tincanapi.com/"
                        },
                        checkAsVersions: {
                            latest: { name: null, homePage: "http://tincanapi.com/" },
                            "0.9": { accountName: null, accountServiceHomePage: "http://tincanapi.com/" }
                        }
                    },
                    {
                        name: "full",
                        instanceConfig: {
                            name: "test",
                            homePage: "http://tincanapi.com/"
                        },
                        toString: "test:http://tincanapi.com/",
                        checkProps: {
                            name: "test",
                            homePage: "http://tincanapi.com/"
                        },
                        checkAsVersions: {
                            latest: { name: "test", homePage: "http://tincanapi.com/" },
                            "0.9": { accountName: "test", accountServiceHomePage: "http://tincanapi.com/" }
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
                obj = new TinCan.AgentAccount (row.instanceConfig);

                ok(obj instanceof TinCan.AgentAccount, "object is TinCan.AgentAccount (" + row.name + ")");
                strictEqual(obj.toString(), row.toString, "object.toString (" + row.name + ")");
                if (typeof row.checkProps !== "undefined") {
                    for (key in row.checkProps) {
                        deepEqual(obj[key], row.checkProps[key], "object property initial value: " + key + " (" + row.name + ")");
                    }
                }
                if (typeof row.checkAsVersions !== "undefined") {
                    result = obj.asVersion();
                    deepEqual(result, row.checkAsVersions.latest, "object.asVersion() latest: " + row.name);

                    for (v = 0; v < versions.length; v += 1) {
                        result = obj.asVersion(versions[v]);
                        deepEqual(result, (row.checkAsVersions.hasOwnProperty(versions[v]) ? row.checkAsVersions[versions[v]] : row.checkAsVersions.latest), "object.asVersion() " + versions[v] + " : " + row.name);
                    }
                }
            }
        }
    );

    test(
        ".9 specific naming",
        function () {
            var obj,
                result
            ;

            obj = new TinCan.AgentAccount (
                {
                    accountServiceHomePage: "testAccountServiceHomePage",
                    accountName: "testAccountName"
                }
            );
            equal(obj.name, "testAccountName", "object construction with accountName name property value");
            equal(obj.homePage, "testAccountServiceHomePage", "object construction with accountServiceHomePage homePage property value");
        }
    );
}());
