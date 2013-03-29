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

    module(
        "StatementsResult Statics",
        {
            setup: function () {},
            teardown: function () {}
        }
    );

    test(
        "StatementsResult.fromJSON",
        function () {
            var raw = {
                    statements: []
                },
                string,
                result
            ;

            var result = TinCan.StatementsResult.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.StatementsResult, "returns TinCan.StatementsResult");
        }
    );
}());
