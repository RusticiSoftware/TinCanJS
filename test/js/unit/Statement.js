/*!
    Copyright 2012-3 Rustici Software

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

    QUnit.module("Statement Statics");

    test(
        "Statement.fromJSON",
        function () {
            var raw = {},
                string,
                result
            ;

            result = TinCan.Statement.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.Statement, "returns TinCan.Statement");
        }
    );

    QUnit.module("Statement Instance");

    test(
        "object prototype",
        function () {
            var obj = new TinCan.Statement ();
            strictEqual(obj.LOG_SRC, "Statement", "object property LOG_SRC initial value");
        }
    );

    test(
        "object stamping",
        function () {
            var obj;

            obj = new TinCan.Statement ();
            ok(obj.id !== null, "object property not null: id");
            ok(obj.timestamp !== null, "object property not null: timestamp");

            obj = new TinCan.Statement ({}, { doStamp: false });
            ok(obj.id === null, "object property null: id");
            ok(obj.timestamp === null, "object property null: timestamp");

            obj.stamp();
            ok(obj.id !== null, "object property not null: id");
            ok(obj.timestamp !== null, "object property not null: timestamp");
        }
    );

    // TODO: test Agent/Group transformative ability for instructor/team
    test(
        "object variants",
        function () {
            var uuid = TinCan.Utils.getUUID(),
                timestamp = TinCan.Utils.getISODateString(new Date()),
                actor = new TinCan.Agent({ mbox: "tincanjs-test-actor@tincanapi.com" }),
                verbId = "http://adlnet.gov/expapi/verbs/interacted",
                verb = new TinCan.Verb({ id: verbId }),
                activityId = "http://tincanapi.com/TinCanJS/Test/Statement_variants/",
                activity = new TinCan.Activity({ id: activityId }),
                result = new TinCan.Result(),
                context = new TinCan.Context(),
                authority = new TinCan.Agent({ mbox: "tincanjs-test-authority@tincanapi.com" }),
                set = [
                    {
                        name: "empty",
                        instanceConfig: {},
                        instanceInitConfig: {
                            doStamp: false
                        },
                        checkProps: {
                            id: null,
                            actor: null,
                            verb: null,
                            target: null,
                            result: null,
                            context: null,
                            timestamp: null,
                            stored: null,
                            authority: null,
                            version: null,
                            degraded: false,
                            voided: null,
                            inProgress: null
                        },
                        checkAsVersions: {
                            latest: {}
                        }
                    },
                    {
                        name: "full properties",
                        instanceConfig: {
                            id: uuid,
                            actor: actor,
                            verb: verb,
                            target: activity,
                            result: result,
                            context: context,
                            timestamp: timestamp,
                            stored: timestamp,
                            authority: authority,
                            version: "1.0.0",

                            // deprecated
                            voided: false,
                            inProgress: true
                        },
                        checkProps: {
                            id: uuid,
                            actor: actor,
                            verb: verb,
                            target: activity,
                            result: result,
                            context: context,
                            timestamp: timestamp,
                            stored: timestamp,
                            authority: authority,
                            version: "1.0.0",
                            degraded: false,
                            voided: false,
                            inProgress: true
                        },
                        checkAsVersions: {
                            latest: {
                                id: uuid,
                                actor: { objectType: "Agent", mbox: "mailto:tincanjs-test-actor@tincanapi.com" },
                                verb: { id: verbId, display: { und: "interacted" } },
                                object: { objectType: "Activity", id: activityId },
                                result: {},
                                context: {},
                                timestamp: timestamp,
                                authority: { objectType: "Agent", mbox: "mailto:tincanjs-test-authority@tincanapi.com" }
                            },
                            "0.95": {
                                id: uuid,
                                actor: { objectType: "Agent", mbox: "mailto:tincanjs-test-actor@tincanapi.com" },
                                verb: { id: verbId, display: { und: "interacted" } },
                                object: { objectType: "Activity", id: activityId },
                                result: {},
                                context: {},
                                timestamp: timestamp,
                                authority: { objectType: "Agent", mbox: "mailto:tincanjs-test-authority@tincanapi.com" },
                                voided: false
                            },
                            "0.9": {
                                id: uuid,
                                actor: { objectType: "Agent", mbox: [ "mailto:tincanjs-test-actor@tincanapi.com" ] },
                                verb: "interacted",
                                object: { objectType: "Activity", id: activityId },
                                result: {},
                                context: {},
                                timestamp: timestamp,
                                authority: { objectType: "Agent", mbox: [ "mailto:tincanjs-test-authority@tincanapi.com" ] },
                                voided: false,
                                inProgress: true
                            }
                        }
                    }
                ],
                versions = TinCan.versions(),
                i,
                v,
                obj,
                callResult
            ;

            for (i = 0; i < set.length; i += 1) {
                row = set[i];
                row.instanceInitConfig = row.instanceInitConfig || {};

                obj = new TinCan.Statement (row.instanceConfig, row.instanceInitConfig);

                ok(obj instanceof TinCan.Statement, "object is TinCan.Statement (" + row.name + ")");
                if (typeof row.checkProps !== "undefined") {
                    for (key in row.checkProps) {
                        deepEqual(obj[key], row.checkProps[key], "object property initial value: " + key + " (" + row.name + ")");
                    }
                }
                if (typeof row.checkAsVersions !== "undefined") {
                    callResult = obj.asVersion();
                    deepEqual(callResult, row.checkAsVersions.latest, "object.asVersion() latest: " + row.name);

                    for (v = 0; v < versions.length; v += 1) {
                        callResult = obj.asVersion(versions[v]);
                        deepEqual(callResult, (row.checkAsVersions.hasOwnProperty(versions[v]) ? row.checkAsVersions[versions[v]] : row.checkAsVersions.latest), "object.asVersion() " + versions[v] + " : " + row.name);
                    }
                }
            }
        }
    );
}());
