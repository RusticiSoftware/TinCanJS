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
    // TODO: figure out how to handle dynamic configuration of LRSes

    var session = null,
        versions = TinCan.versions(),
        i,
        version;

    QUnit.module("TinCan Statics");

    test(
        "TinCan debugging",
        function () {
            ok(TinCan.hasOwnProperty("DEBUG"), "TinCan has property: DEBUG");
            ok(!TinCan.DEBUG, "TinCan.DEBUG initial value");

            TinCan.enableDebug()
            ok(TinCan.DEBUG, "TinCan.enableDebug()");

            TinCan.disableDebug()
            ok(!TinCan.DEBUG, "TinCan.disableDebug()");
        }
    );
    test(
        "TinCan.versions",
        function () {
            deepEqual(TinCan.versions(), ["1.0.1", "1.0.0", "0.95", "0.9"], "Supported spec versions");
        }
    );

    QUnit.module("TinCan Instance");

    test(
        "tincan Object",
        function () {
            var tincan = new TinCan ();

            ok(tincan instanceof TinCan, "tincan is TinCan");

            // test direct properties from construction
            ok(tincan.hasOwnProperty("recordStores"), "tincan has property: recordStores");
            deepEqual(tincan.recordStores, [], "tincan.recordStores property initial value");
            ok(tincan.hasOwnProperty("actor"), "tincan has property: actor");
            strictEqual(tincan.actor, null, "tincan.actor property initial value");
            ok(tincan.hasOwnProperty("activity"), "tincan has property: activity");
            strictEqual(tincan.activity, null, "tincan.activity property initial value");
            ok(tincan.hasOwnProperty("registration"), "tincan has property: registration");
            strictEqual(tincan.registration, null, "tincan.registration property initial value");
            ok(tincan.hasOwnProperty("context"), "tincan has property: context");
            strictEqual(tincan.context, null, "tincan.context property initial value");

            // test properties from prototype
            strictEqual(tincan.LOG_SRC, "TinCan", "tincan property LOG_SRC initial value");
        }
    );
}());
