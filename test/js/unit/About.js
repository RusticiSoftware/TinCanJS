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
    var session = null,
        commonVersions = [
            ".95",
            "1.0",
            "1.1"
        ]
    ;

    QUnit.module("About Statics");

    test(
        "About.fromJSON",
        function () {
            var raw = {},
                string,
                result
            ;

            result = TinCan.About.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.About, "returns TinCan.About");
        }
    );

    QUnit.module("About Instance");

    test(
        "about Object",
        function () {
            var obj = new TinCan.About (),
                nullProps = [
                    "version"
                ],
                i
            ;

            ok(obj instanceof TinCan.About, "object is TinCan.About");

            for (i = 0; i < nullProps.length; i += 1) {
                ok(obj.hasOwnProperty(nullProps[i]), "object has property: " + nullProps[i]);
                strictEqual(obj[nullProps[i]], null, "object property initial value: " + nullProps[i]);
            }

            strictEqual(obj.LOG_SRC, "About", "object property LOG_SRC initial value");
        }
    );

    test(
        "about variants",
        function () {
            var set = [
                    {
                        name: "basic properties: expected string type array",
                        cfg: {
                            version: commonVersions
                        },
                        checkProps: {
                            version: commonVersions
                        }
                    }
                ],
                i,
                obj,
                result
            ;

            for (i = 0; i < set.length; i += 1) {
                row = set[i];
                obj = new TinCan.About (row.cfg);

                ok(obj instanceof TinCan.About, "object is TinCan.About (" + row.name + ")");
                if (typeof row.checkProps !== "undefined") {
                    for (key in row.checkProps) {
                        deepEqual(obj[key], row.checkProps[key], "object property initial value: " + key + " (" + row.name + ")");
                    }
                }
            }
        }
    );
}());
