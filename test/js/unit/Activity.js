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

    QUnit.module("Activity Statics");

    test(
        "Activity.fromJSON",
        function () {
            var raw = {
                    id: "http://tincanapi.com/TinCanJS/Test/Activity_fromJSON"
                },
                string,
                result
            ;

            result = TinCan.Activity.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.Activity, "returns TinCan.Activity");
        }
    );

    QUnit.module("Activity Instance");

    test(
        "activity Object",
        function () {
            var obj = new TinCan.Activity(),
                nullProps = [
                    "id",
                    "definition"
                ],
                i
            ;

            ok(obj instanceof TinCan.Activity, "object is TinCan.Activity");

            for (i = 0; i < nullProps.length; i += 1) {
                ok(obj.hasOwnProperty(nullProps[i]), "object has property: " + nullProps[i]);
                strictEqual(obj[nullProps[i]], null, "object property initial value: " + nullProps[i]);
            }

            strictEqual(obj.LOG_SRC, "Activity", "object property LOG_SRC initial value");
            strictEqual(obj.objectType, "Activity", "object property objectType initial value");
            strictEqual(obj.toString(), "Activity: unidentified", "object.toString unidentified");
        }
    );

    test(
        "activity variants",
        function () {
            var defined = new TinCan.ActivityDefinition(),
                set = [
                    {
                        name: "activity with id",
                        instanceConfig: {
                            id: "http://TestActivity"
                        },
                        toString: "http://TestActivity",
                        checkProps: {
                            id: "http://TestActivity"
                        }
                    },
                    {
                        name: "activity with definition (basic definition)",
                        instanceConfig: {
                            id: "http://TestActivity",
                            definition: defined
                        },
                        toString: "http://TestActivity",
                        checkProps: {
                            id: "http://TestActivity",
                            definition: defined
                        }
                    },
                    {
                        name: "activity with definition (raw definition)",
                        instanceConfig: {
                            id: "http://TestActivity",
                            definition: {
                                name: {
                                    en: "Test"
                                }
                            }
                        },
                        toString: (new TinCan.ActivityDefinition({ name: { en: "Test" } })).toString(),
                        checkProps: {
                            id: "http://TestActivity",
                            definition: new TinCan.ActivityDefinition({ name: { en: "Test" } })
                        }
                    }
                ],
                i,
                obj
            ;

            for (i = 0; i < set.length; i += 1) {
                row = set[i];
                obj = new TinCan.Activity(row.instanceConfig);

                ok(obj instanceof TinCan.Activity, "object is TinCan.Activity (" + row.name + ")");
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
        "activity asVersion",
        function () {
            var set = [
                    {
                        name: "null field activity",
                        instanceConfig: {},
                        check: {
                            id: null,
                            objectType: "Activity"
                        }
                    },
                    {
                        name: "activity with id",
                        instanceConfig: {
                            id: "http://TestActivity"
                        },
                        check: {
                            id: "http://TestActivity",
                            objectType: "Activity"
                        }
                    },
                    {
                        name: "activity with definition",
                        instanceConfig: {
                            id: null,
                            objectType: "Activity",
                            definition: { name: "Test" }
                        },
                        check: {
                            id: null,
                            objectType: "Activity",
                            definition: new TinCan.ActivityDefinition({ name: "Test" })
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
                obj = new TinCan.Activity(row.instanceConfig);

                if (!(row.instanceConfig.hasOwnProperty("definition"))) {
                    deepEqual(obj.asVersion(), row.check, "object.asVersion() " + row.name);
                }
                else {
                    for (v = 0; v < versions.length; v += 1) {
                        result = obj.asVersion(versions[v]);
                        deepEqual(result.definition, row.check.definition.asVersion(versions[v]), "object.asVersion() " + row.name + " : " + versions[v]);
                    }
                }
            }
        }
    );
}());
