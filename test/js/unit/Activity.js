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
}());
