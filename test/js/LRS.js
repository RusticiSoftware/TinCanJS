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
        endpoint = "https://cloud.scorm.com/tc/public/";

    module("LRS Instance");
    test(
        "LRS init failure: no endpoint",
        function () {
            throws(
                function () {
                    var obj = new TinCan.LRS (
                        {
                            alertOnRequestFailure: false
                        }
                    );
                },
                "exception"
            );
        }
    );

    test(
        "LRS init failure: invalid URL",
        function () {
            throws(
                function () {
                    var obj = new TinCan.LRS (
                        {
                            endpoint: "",
                            alertOnRequestFailure: false
                        }
                    );
                },
                "exception"
            );
        }
    );

    test(
        "LRS init failure: invalid version",
        function () {
            throws(
                function () {
                    var obj = new TinCan.LRS (
                        {
                            endpoint: endpoint,
                            alertOnRequestFailure: false,
                            version: "test"
                        }
                    );
                },
                "exception"
            );
        }
    );

    test(
        "LRS variants",
        function () {
            var set = [
                    {
                        name: "basic",
                        instanceConfig: {
                            endpoint: endpoint
                        },
                        checkProps: {
                            endpoint: endpoint,
                            LOG_SRC: "LRS",
                            auth: null,
                            extended: null,
                            version: TinCan.versions()[0],
                            allowFail: true,
                            alertOnRequestFailure: true
                        }
                    },
                    {
                        name: "endpoint correction (trailing slash)",
                        instanceConfig: {
                            endpoint: "https://cloud.scorm.com/tc/public"
                        },
                        checkProps: {
                            endpoint: endpoint
                        }
                    },
                    {
                        name: "main properties",
                        instanceConfig: {
                            endpoint: endpoint,
                            auth: "Basic dGVzdDpwYXNzd29yZA==",
                            extended: {
                                test: "TEST"
                            },
                            allowFail: false,
                            alertOnRequestFailure: false
                        },
                        checkProps: {
                            auth: "Basic dGVzdDpwYXNzd29yZA==",
                            extended: {
                                test: "TEST"
                            },
                            allowFail: false,
                            alertOnRequestFailure: false
                        }
                    },
                    {
                        name: "username/password to basic auth",
                        instanceConfig: {
                            endpoint: endpoint,
                            username: "test",
                            password: "password"
                        },
                        checkProps: {
                            auth: "Basic dGVzdDpwYXNzd29yZA=="
                        }
                    },
                    {
                        name: "version: 1.0.0",
                        instanceConfig: {
                            endpoint: endpoint,
                            version: "1.0.0"
                        },
                        checkProps: {
                            version: "1.0.0"
                        }
                    },
                    {
                        name: "version: 0.95",
                        instanceConfig: {
                            endpoint: endpoint,
                            version: "0.95"
                        },
                        checkProps: {
                            version: "0.95"
                        }
                    },
                    {
                        name: "version: 0.9",
                        instanceConfig: {
                            endpoint: endpoint,
                            version: "0.9"
                        },
                        checkProps: {
                            version: "0.9"
                        }
                    }
                ],
                i,
                obj,
                result
            ;

            for (i = 0; i < set.length; i += 1) {
                row = set[i];
                obj = new TinCan.LRS (row.instanceConfig);

                ok(obj instanceof TinCan.LRS, "object is TinCan.LRS (" + row.name + ")");
                if (typeof row.checkProps !== "undefined") {
                    for (key in row.checkProps) {
                        deepEqual(obj[key], row.checkProps[key], "object property initial value: " + key + " (" + row.name + ")");
                    }
                }
            }
        }
    );
}());
