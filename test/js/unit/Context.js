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

    QUnit.module("Context Statics");

    test(
        "Context.fromJSON",
        function () {
            var raw = {},
                string,
                result
            ;

            result = TinCan.Context.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.Context, "returns TinCan.Context");
        }
    );

    QUnit.module("Context Instance");

    test(
        "object prototype",
        function () {
            var obj = new TinCan.Context ();
            strictEqual(obj.LOG_SRC, "Context", "object property LOG_SRC initial value");
        }
    );

    // TODO: test Agent/Group transformative ability for instructor/team
    test(
        "object variants",
        function () {
            var uuid = TinCan.Utils.getUUID(),
                activityId = "http://tincanapi.com/TinCanJS/Test/Context_variants/",
                activity = new TinCan.Activity({ id: activityId }),
                actor = new TinCan.Agent({ mbox: "tincanjs-test-actor@tincanapi.com" }),
                verbId = "http://adlnet.gov/expapi/verbs/interacted",
                verb = new TinCan.Verb({ id: verbId }),
                instructor = new TinCan.Agent({ mbox: "tincanjs-test-instructor@tincanapi.com" }),
                team = new TinCan.Agent({ mbox: "tincanjs-test-team@tincanapi.com" }),
                contextActivitiesRaw = {
                    parent: [
                        activity
                    ]
                },
                contextActivities = new TinCan.ContextActivities(contextActivitiesRaw),
                stRefId = TinCan.Utils.getUUID(),
                stRef = new TinCan.StatementRef({ id: stRefId }),
                subSt = new TinCan.SubStatement({ actor: actor, verb: verb, target: activity }),
                set = [
                    {
                        name: "empty",
                        instanceConfig: {},
                        checkProps: {
                            registration: null,
                            instructor: null,
                            team: null,
                            contextActivities: null,
                            revision: null,
                            platform: null,
                            language: null,
                            statement: null,
                            extensions: null
                        },
                        checkAsVersions: {
                            latest: {}
                        }
                    },
                    {
                        name: "full properties",
                        instanceConfig: {
                            registration: uuid,
                            revision: "test",
                            instructor: instructor,
                            team: team,
                            contextActivities: contextActivities,
                            platform: {
                                test: "Test"
                            },
                            language: "en-US",
                            statement: stRef,
                            extensions: {
                                test: "Test"
                            }
                        },
                        checkProps: {
                            registration: uuid,
                            revision: "test",
                            instructor: instructor,
                            team: team,
                            contextActivities: contextActivities,
                            platform: {
                                test: "Test"
                            },
                            language: "en-US",
                            statement: stRef,
                            extensions: {
                                test: "Test"
                            }
                        },
                        checkAsVersions: {
                            latest: {
                                registration: uuid,
                                revision: "test",
                                instructor: { objectType: "Agent", mbox: "mailto:tincanjs-test-instructor@tincanapi.com" },
                                team: { objectType: "Agent", mbox: "mailto:tincanjs-test-team@tincanapi.com" },
                                contextActivities: { parent: [ { objectType: "Activity", id: activityId } ] },
                                platform: { test: "Test" },
                                language: "en-US",
                                statement: { objectType: "StatementRef", id: stRefId },
                                extensions: { test: "Test" }
                            },
                            "0.95": {
                                registration: uuid,
                                revision: "test",
                                instructor: { objectType: "Agent", mbox: "mailto:tincanjs-test-instructor@tincanapi.com" },
                                team: { objectType: "Agent", mbox: "mailto:tincanjs-test-team@tincanapi.com" },
                                contextActivities: { parent: { objectType: "Activity", id: activityId } },
                                platform: { test: "Test" },
                                language: "en-US",
                                statement: { objectType: "StatementRef", id: stRefId },
                                extensions: { test: "Test" }
                            },
                            "0.9": {
                                registration: uuid,
                                revision: "test",
                                instructor: { objectType: "Agent", mbox: [ "mailto:tincanjs-test-instructor@tincanapi.com" ] },
                                team: { objectType: "Agent", mbox: [ "mailto:tincanjs-test-team@tincanapi.com" ] },
                                contextActivities: { parent: { objectType: "Activity", id: activityId } },
                                platform: { test: "Test" },
                                language: "en-US",
                                statement: { objectType: "Statement", id: stRefId },
                                extensions: { test: "Test" }
                            }
                        }
                    },
                    {
                        name: "contextActivities transform",
                        instanceConfig: {
                            contextActivities: contextActivitiesRaw
                        },
                        checkProps: {
                            contextActivities: contextActivities
                        },
                        checkAsVersions: {
                            latest: { contextActivities: { parent: [ { objectType: "Activity", id: activityId } ] } },
                            "0.95": { contextActivities: { parent: { objectType: "Activity", id: activityId } } },
                            "0.9":  { contextActivities: { parent: { objectType: "Activity", id: activityId } } }
                        }
                    },
                    {
                        name: "substatement property",
                        instanceConfig: {
                            statement: subSt
                        },
                        checkProps: {
                            statement: subSt
                        },
                        checkAsVersions: {
                            latest: {
                                statement: {
                                    objectType: "SubStatement",
                                    actor: { objectType: "Agent", mbox: "mailto:tincanjs-test-actor@tincanapi.com" },
                                    verb: { id: verbId, display: { und: "interacted" } },
                                    object: { objectType: "Activity", id: activityId }
                                }
                            },
                            "0.9": {
                                statement: {
                                    objectType: "SubStatement",
                                    actor: { objectType: "Agent", mbox: [ "mailto:tincanjs-test-actor@tincanapi.com" ] },
                                    verb: "interacted",
                                    object: { objectType: "Activity", id: activityId }
                                }
                            }
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
                obj = new TinCan.Context (row.instanceConfig);

                ok(obj instanceof TinCan.Context, "object is TinCan.Context (" + row.name + ")");
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
}());
