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
    var session = null,
        commonId = "testActivityProfile",
        commonContentString = "test content",
        commonContentStringType = "text/plain";

    QUnit.module("ActivityProfile Statics");

    test(
        "ActivityProfile.fromJSON",
        function () {
            var raw = {},
                string,
                result
            ;

            result = TinCan.ActivityProfile.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.ActivityProfile, "returns TinCan.ActivityProfile");
        }
    );

    QUnit.module("ActivityProfile Instance");

    test(
        "activityProfile Object",
        function () {
            var obj = new TinCan.ActivityProfile (),
                nullProps = [
                    "id",
                    "contents",
                    "contentType",
                    "etag"
                ],
                i
            ;

            ok(obj instanceof TinCan.ActivityProfile, "object is TinCan.ActivityProfile");

            for (i = 0; i < nullProps.length; i += 1) {
                ok(obj.hasOwnProperty(nullProps[i]), "object has property: " + nullProps[i]);
                strictEqual(obj[nullProps[i]], null, "object property initial value: " + nullProps[i]);
            }

            ok(obj.hasOwnProperty("updated"), "object has property: updated");
            strictEqual(obj.updated, false, "object property initial value: updated");

            strictEqual(obj.LOG_SRC, "ActivityProfile", "object property LOG_SRC initial value");
        }
    );

    test(
        "activityProfile variants",
        function () {
            var set = [
                    {
                        name: "basic properties: string content",
                        instanceConfig: {
                            id: commonId,
                            contents: commonContentString,
                            contentType: commonContentStringType
                        },
                        checkProps: {
                            id: commonId,
                            contents: commonContentString,
                            contentType: commonContentStringType
                        }
                    }
                ],
                i,
                obj,
                result
            ;

            for (i = 0; i < set.length; i += 1) {
                row = set[i];
                obj = new TinCan.ActivityProfile (row.instanceConfig);

                ok(obj instanceof TinCan.ActivityProfile, "object is TinCan.ActivityProfile (" + row.name + ")");
                if (typeof row.checkProps !== "undefined") {
                    for (key in row.checkProps) {
                        deepEqual(obj[key], row.checkProps[key], "object property initial value: " + key + " (" + row.name + ")");
                    }
                }
            }
        }
    );
}());
