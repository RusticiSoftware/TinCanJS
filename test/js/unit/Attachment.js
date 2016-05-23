/*
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
    var session = null;

    QUnit.module("Attachment Statics");

    test(
        "Attachment.fromJSON",
        function () {
            var raw = {
                    usageType: "http://id.tincanapi.com/attachment/test-attachment"
                },
                string,
                result;

            result = TinCan.Attachment.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.Attachment, "returns TinCan.Attachment");
        }
    );

    QUnit.module("Attachment Instance");

    test(
        "attachment Object",
        function () {
            var obj = new TinCan.Attachment(),
                nullProps = [
                    "usageType",
                    "display",
                    "contentType",
                    "length",
                    "sha2",
                    "description",
                    "fileUrl"
                ],
                i
            ;
            ok(obj instanceof TinCan.Attachment, "object is TinCan.Attachment");

            for(i = 0; i < nullProps.length; i += 1) {
                ok(obj.hasOwnProperty(nullProps[i]), "object has property: " + nullProps[i]);
                strictEqual(obj[nullProps[i]], null, "object property initial value: " + nullProps[i]);
            }

            strictEqual(obj.LOG_SRC, "Attachment", "object property LOG_SRC initial value");
            //strictEqual(obj.objectType, "Attachment", "object property objectType initial value");
        }
    );

    test(
        "attachment variants",
        function () {
            var set = [
                {
                    name: "Attachment with usageType",
                    instanceConfig: {
                        usageType: "http://id.tincanapi.com/attachment/test-attachment"
                    },
                    checkProps: {
                        usageType: "http://id.tincanapi.com/attachment/test-attachment"
                    }
                },
                {
                    name: "Attachment with display",
                    instanceConfig: {
                        display: {
                            "en-US": "Test-Attachment"
                        }
                    },
                    checkProps: {
                        display: {
                            "en-US": "Test-Attachment"
                        }
                    }
                },
                {
                    name: "Attachment with contentType",
                    instanceConfig: {
                        contentType: "attachment/test"
                    },
                    checkProps: {
                        contentType: "attachment/test"
                    }
                },
                {
                    name: "Attachment with length",
                    instanceConfig: {
                        length: 7357
                    },
                    checkProps: {
                        length: 7357
                    }
                },
                {
                    name: "Attachment with sha2",
                    instanceConfig: {
                        sha2: "arbitrary"
                    },
                    checkProps: {
                        sha2: "arbitrary"
                    }
                },
                {
                    name: "Attachment with description",
                    instanceConfig: {
                        description: {
                            "en-US": "arbitrary"
                        }
                    },
                    checkProps: {
                        description: {
                            "en-US": "arbitrary"
                        }
                    }
                },
                {
                    name: "Attachment with fileUrl",
                    instanceConfig: {
                        fileUrl: "http://id.tincanapi.com/attachment/test-attachment.pdf"
                    },
                    checkProps: {
                        fileUrl: "http://id.tincanapi.com/attachment/test-attachment.pdf"
                    }
                },
                {
                    name: "Attachment with content",
                    instanceConfig: {
                        content: "test text content"
                    },
                    checkProps: {
                        content: "test text content"
                    }
                }
            ],
                i,
                obj,
                result
            ;

            for (i = 0; i < set.length; i += 1) {
                row = set[i];
                obj = new TinCan.Attachment(row.instanceConfig);

                ok(obj instanceof TinCan.Attachment, "object is TinCan.Attachment (" + row.name + ")");
                if (typeof row.checkProps !== "undefined") {
                    for (key in row.checkProps) {
                        deepEqual(obj[key], row.checkProps[key], "object property initial value: " + key + " (" + row.name + ")");
                    }
                }
            }
        }
    )
}());
