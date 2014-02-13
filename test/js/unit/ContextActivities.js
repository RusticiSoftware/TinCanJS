/*!
    Copyright 2013 Rustici Software

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

    QUnit.module("ContextActivities Statics");

    test(
        "ContextActivities.fromJSON",
        function () {
            var raw = {},
                string,
                result
            ;

            result = TinCan.ContextActivities.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.ContextActivities, "returns TinCan.ContextActivities");
        }
    );

    QUnit.module("ContextActivities Instance");

    test(
        "contextActivities Object",
        function () {
            var obj = new TinCan.ContextActivities (),
                nullProps = [
                    "category",
                    "parent",
                    "grouping",
                    "other"
                ],
                i
            ;

            ok(obj instanceof TinCan.ContextActivities, "object is TinCan.ContextActivities");

            for (i = 0; i < nullProps.length; i += 1) {
                ok(obj.hasOwnProperty(nullProps[i]), "object has property: " + nullProps[i]);
                strictEqual(obj[nullProps[i]], null, "object property initial value: " + nullProps[i]);
            }

            strictEqual(obj.LOG_SRC, "ContextActivities", "object property LOG_SRC initial value");
        }
    );

    test(
        "object variants (single property)",
        function () {
            var baseId = "http://tincanapi.com/TinCanJS/Test/ContextActivities_variants/",
                commonActivity = new TinCan.Activity({ id: baseId + "common"}),
                set = [
                    {
                        name: "1 from string",
                        instanceConfigPropValue: baseId + "1-string",
                        checkValue: [
                            new TinCan.Activity({ id: baseId + "1-string"})
                        ]
                    },
                    {
                        name: "1 from raw object",
                        instanceConfigPropValue: {
                            id: baseId + "1-raw"
                        },
                        checkValue: [
                            new TinCan.Activity({ id: baseId + "1-raw"})
                        ]
                    },
                    {
                        name: "1 from array of raw object",
                        instanceConfigPropValue: [
                            {
                                id: baseId + "1-raw"
                            }
                        ],
                        checkValue: [
                            new TinCan.Activity({ id: baseId + "1-raw"})
                        ]
                    },
                    {
                        name: "1 from Activity",
                        instanceConfigPropValue: commonActivity,
                        checkValue: [
                            commonActivity
                        ]
                    },
                    {
                        name: "1 from array of Activity",
                        instanceConfigPropValue: [
                            commonActivity
                        ],
                        checkValue: [
                            commonActivity
                        ]
                    },
                    {
                        name: "from array of mixed",
                        instanceConfigPropValue: [
                            baseId + "mixed-string",
                            {
                                id: baseId + "mixed-object"
                            },
                            commonActivity
                        ],
                        checkValue: [
                            new TinCan.Activity({ id: baseId + "mixed-string"}),
                            new TinCan.Activity({ id: baseId + "mixed-object"}),
                            commonActivity
                        ]
                    }
                ],
                props = [ "category", "parent", "other", "grouping" ],
                i,
                j,
                instanceConfig,
                obj,
                result
            ;

            for (i = 0; i < set.length; i += 1) {
                row = set[i];

                for (j = 0; j < props.length; j += 1) {
                    instanceConfig = {};
                    instanceConfig[props[j]] = row.instanceConfigPropValue;

                    obj = new TinCan.ContextActivities (instanceConfig);

                    ok(obj instanceof TinCan.ContextActivities, "object is TinCan.ContextActivities (" + props[j] + " " + row.name + ")");
                    if (typeof row.checkValue !== "undefined") {
                        deepEqual(obj[props[j]], row.checkValue, "object property initial value: " + props[j] + " (" + row.name + ")");
                    }
                }
            }
        }
    );

    test(
        "object asVersion",
        function () {
            var baseId = "http://tincanapi.com/TinCanJS/Test/ContextActivities_asVersion/",
                commonActivity  = new TinCan.Activity({ id: baseId + "common"}),
                commonActivity2 = new TinCan.Activity({ id: baseId + "common2"}),
                commonRaw  = { objectType: "Activity", id: baseId + "common" },
                commonRaw2 = { objectType: "Activity", id: baseId + "common2" },
                set = [
                    {
                        name: "empty",
                        instanceConfig: {},
                        versions: {
                            latest: {}
                        }
                    },
                    {
                        name: "category 1",
                        instanceConfig: {
                            category: commonActivity
                        },
                        versions: {
                            latest: { category: [ commonRaw ] },
                            "0.95": { exception: "0.95 does not support the 'category' property" },
                            "0.9":  { exception: "0.9 does not support the 'category' property" }
                        }
                    },
                    {
                        name: "category 2",
                        instanceConfig: {
                            category: [
                                commonActivity,
                                commonActivity2
                            ]
                        },
                        versions: {
                            latest: { category: [ commonRaw, commonRaw2 ] },
                            "0.95": { exception: "0.95 does not support the 'category' property" },
                            "0.9":  { exception: "0.9 does not support the 'category' property" }
                        }
                    },
                    {
                        name: "parent 1",
                        instanceConfig: {
                            parent: commonActivity
                        },
                        versions: {
                            latest: { parent: [ commonRaw ] },
                            "0.95": { parent: commonRaw },
                            "0.9":  { parent: commonRaw }
                        }
                    },
                    {
                        name: "parent 2",
                        instanceConfig: {
                            parent: [
                                commonActivity,
                                commonActivity2
                            ]
                        },
                        versions: {
                            latest: { parent: [ commonRaw, commonRaw2 ] },
                            "0.95": { parent: commonRaw },
                            "0.9":  { parent: commonRaw }
                        }
                    },
                    {
                        name: "grouping 1",
                        instanceConfig: {
                            grouping: commonActivity
                        },
                        versions: {
                            latest: { grouping: [ commonRaw ] },
                            "0.95": { grouping: commonRaw },
                            "0.9":  { grouping: commonRaw }
                        }
                    },
                    {
                        name: "grouping 2",
                        instanceConfig: {
                            grouping: [
                                commonActivity,
                                commonActivity2
                            ]
                        },
                        versions: {
                            latest: { grouping: [ commonRaw, commonRaw2 ] },
                            "0.95": { grouping: commonRaw },
                            "0.9":  { grouping: commonRaw }
                        }
                    },
                    {
                        name: "other 1",
                        instanceConfig: {
                            other: commonActivity
                        },
                        versions: {
                            latest: { other: [ commonRaw ] },
                            "0.95": { other: commonRaw },
                            "0.9":  { other: commonRaw }
                        }
                    },
                    {
                        name: "other 2",
                        instanceConfig: {
                            other: [
                                commonActivity,
                                commonActivity2
                            ]
                        },
                        versions: {
                            latest: { other: [ commonRaw, commonRaw2 ] },
                            "0.95": { other: commonRaw },
                            "0.9":  { other: commonRaw }
                        }
                    },
                    {
                        name: "all 1",
                        instanceConfig: {
                            parent: commonActivity,
                            grouping: commonActivity,
                            other: commonActivity
                        },
                        versions: {
                            latest: { parent: [ commonRaw ], grouping: [ commonRaw ], other: [ commonRaw ] },
                            "0.95": { parent: commonRaw, grouping: commonRaw, other: commonRaw },
                            "0.9": { parent: commonRaw , grouping: commonRaw, other: commonRaw }
                        }
                    },
                    {
                        name: "all 2",
                        instanceConfig: {
                            parent: [ commonActivity, commonActivity2 ],
                            grouping: [ commonActivity, commonActivity2 ],
                            other: [ commonActivity, commonActivity2 ]
                        },
                        versions: {
                            latest: { parent: [ commonRaw, commonRaw2 ], grouping: [ commonRaw, commonRaw2 ], other: [ commonRaw, commonRaw2 ] },
                            "0.95": { parent: commonRaw, grouping: commonRaw, other: commonRaw },
                            "0.9": { parent: commonRaw , grouping: commonRaw, other: commonRaw }
                        }
                    }
                ],
                versions = TinCan.versions(),
                i,
                v,
                obj,
                result,
                versionCfg
            ;

            for (i = 0; i < set.length; i += 1) {
                row = set[i];
                obj = new TinCan.ContextActivities (row.instanceConfig);

                result = obj.asVersion();
                deepEqual(result, row.versions.latest, "object.asVersion() latest: " + row.name);

                for (v = 0; v < versions.length; v += 1) {
                    message = "object.asVersion() " + versions[v] + " : " + row.name;
                    versionCfg = row.versions.hasOwnProperty(versions[v]) ? row.versions[versions[v]] : row.versions.latest;
                    if (typeof versionCfg.exception !== "undefined") {
                        throws(
                            function () {
                                result = obj.asVersion(versions[v]);
                            },
                            Error,
                            message + " (exception)"
                        );
                        continue;
                    }

                    result = obj.asVersion(versions[v]);

                    deepEqual(result, versionCfg, message + " (deepEqual)");
                }
            }
        }
    );
}());
