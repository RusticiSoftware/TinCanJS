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
        commonType = "http://adlnet.gov/expapi/activities/simulation",
        commonMoreInfo = "http://tincanapi.com/TinCanJS/Test/ActivityDefinition_moreInfo",
        commonName = { und: "Test Name" },
        commonDesc = { und: "Test Description" };

    QUnit.module("ActivityDefinition Statics");

    test(
        "ActivityDefinition.fromJSON",
        function () {
            var raw = {},
                string,
                result
            ;

            result = TinCan.ActivityDefinition.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.ActivityDefinition, "returns TinCan.ActivityDefinition");
        }
    );

    QUnit.module("ActivityDefinition Instance");

    test(
        "activity definition Object",
        function () {
            var obj = new TinCan.ActivityDefinition (),
                nullProps = [
                    "name",
                    "description",
                    "type",
                    "moreInfo",
                    "extensions",
                    "interactionType",
                    "correctResponsesPattern",
                    "choices",
                    "scale",
                    "source",
                    "target",
                    "steps"
                ],
                i
            ;

            ok(obj instanceof TinCan.ActivityDefinition, "object is TinCan.ActivityDefinition");

            for (i = 0; i < nullProps.length; i += 1) {
                ok(obj.hasOwnProperty(nullProps[i]), "object has property: " + nullProps[i]);
                strictEqual(obj[nullProps[i]], null, "object property initial value: " + nullProps[i]);
            }

            strictEqual(obj.LOG_SRC, "ActivityDefinition", "object property LOG_SRC initial value");
        }
    );

    test(
        "activity definition variants",
        function () {
            var set = [
                    {
                        name: "basic properties",
                        instanceConfig: {
                            type: commonType,
                            moreInfo: commonMoreInfo,
                            name: commonName,
                            description: commonDesc
                        },
                        toString: "Test Name",
                        checkProps: {
                            type: commonType,
                            moreInfo: commonMoreInfo,
                            name: commonName,
                            description: commonDesc
                        }
                    },
                    {
                        name: "description only for toString",
                        instanceConfig: {
                            description: commonDesc
                        },
                        toString: "Test Description",
                        checkProps: {
                            description: commonDesc
                        }
                    }
                ],
                i,
                obj,
                result
            ;

            for (i = 0; i < set.length; i += 1) {
                row = set[i];
                obj = new TinCan.ActivityDefinition (row.instanceConfig);

                ok(obj instanceof TinCan.ActivityDefinition, "object is TinCan.ActivityDefinition (" + row.name + ")");
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
        "activity definition asVersion",
        function () {
            var set = [
                    {
                        name: "basic properties",
                        instanceConfig: {
                            type: commonType,
                            moreInfo: commonMoreInfo,
                            name: commonName,
                            description: commonDesc
                        },
                        versions: {
                            latest: {
                                type: commonType,
                                moreInfo: commonMoreInfo,
                                name: commonName,
                                description: commonDesc
                            },
                            "0.95": {
                                type: commonType,
                                name: commonName,
                                description: commonDesc
                            },
                            "0.9": {
                                type: "simulation",
                                name: commonName,
                                description: commonDesc
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
                obj = new TinCan.ActivityDefinition (row.instanceConfig);

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
