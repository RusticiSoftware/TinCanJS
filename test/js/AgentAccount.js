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

    module("AgentAccount Statics");

    test(
        "AgentAccount.fromJSON",
        function () {
            var raw = {},
                string,
                result
            ;

            var result = TinCan.AgentAccount.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.AgentAccount, "returns TinCan.AgentAccount");
        }
    );

    module("AgentAccount Instance");

    test(
        "acct Object",
        function () {
            var obj = new TinCan.AgentAccount ();

            ok(obj instanceof TinCan.AgentAccount, "object is TinCan.AgentAccount");

            // test direct properties from construction

            // test properties from prototype
            strictEqual(obj.LOG_SRC, "AgentAccount", "object property LOG_SRC initial value");
        }
    );

    test(
        "object variations",
        function () {
            var obj,
                result,
                rawEmpty     = { name: null, homePage: null },
                rawEmpty9    = { accountName: null, accountServiceHomePage: null }
                rawName      = { name: "test", homePage: null },
                rawName9     = { accountName: "test", accountServiceHomePage: null },
                rawHomePage  = { name: null, homePage: "http://tincanapi.com/" },
                rawHomePage9 = { accountName: null, accountServiceHomePage: "http://tincanapi.com/" },
                rawFull      = { name: "test", homePage: "http://tincanapi.com/" },
                rawFull9     = { accountName: "test", accountServiceHomePage: "http://tincanapi.com/" }
            ;

            obj = new TinCan.AgentAccount ();
            ok(obj instanceof TinCan.AgentAccount, "object is TinCan.AgentAccount (empty)");
            ok(obj.hasOwnProperty("name"), "object has property: name (empty)");
            strictEqual(obj.name, null, "object.name property initial value (empty)");
            ok(obj.hasOwnProperty("homePage"), "object has property: homePage (empty)");
            strictEqual(obj.homePage, null, "object.homePage property initial value (empty)");
            equal(obj.toString(), "AgentAccount: unidentified", "object.toString (empty)");
            deepEqual(obj.asVersion(), rawEmpty, "object.asVersion latest (empty)");
            deepEqual(obj.asVersion("0.95"), rawEmpty, "object.asVersion 0.95 (empty)");
            deepEqual(obj.asVersion("0.9"), rawEmpty9, "object.asVersion 0.9 (empty)");

            obj = new TinCan.AgentAccount (
                {
                    name: "test"
                }
            );
            ok(obj instanceof TinCan.AgentAccount, "object is TinCan.AgentAccount (name only)");
            equal(obj.name, "test", "object.name property value (name only)");
            strictEqual(obj.homePage, null, "object.homePage property value (name only)");
            equal(obj.toString(), "test:-", "object.toString (name only)");
            deepEqual(obj.asVersion(), rawName, "object.asVersion latest (name only)");
            deepEqual(obj.asVersion("0.95"), rawName, "object.asVersion 0.95 (name only)");
            deepEqual(obj.asVersion("0.9"), rawName9, "object.asVersion 0.9 (name only)");

            obj = new TinCan.AgentAccount (
                {
                    homePage: "http://tincanapi.com/"
                }
            );
            ok(obj instanceof TinCan.AgentAccount, "object is TinCan.AgentAccount (homePage only)");
            strictEqual(obj.name, null, "object.name property value (homePage only)");
            equal(obj.homePage, "http://tincanapi.com/", "object.homePage property value (homePage only)");
            equal(obj.toString(), "-:http://tincanapi.com/", "object.toString (homePage only)");
            deepEqual(obj.asVersion(), rawHomePage, "object.asVersion latest (homePage only)");
            deepEqual(obj.asVersion("0.95"), rawHomePage, "object.asVersion 0.95 (homePage only)");
            deepEqual(obj.asVersion("0.9"), rawHomePage9, "object.asVersion 0.9 (homePage only)");

            obj = new TinCan.AgentAccount (
                {
                    name: "test",
                    homePage: "http://tincanapi.com/"
                }
            );
            ok(obj instanceof TinCan.AgentAccount, "object is TinCan.AgentAccount (full)");
            strictEqual(obj.name, "test", "object.name property value (full)");
            equal(obj.homePage, "http://tincanapi.com/", "object.homePage property value (full)");
            equal(obj.toString(), "test:http://tincanapi.com/", "object.toString (full)");
            deepEqual(obj.asVersion(), rawFull, "object.asVersion latest (full)");
            deepEqual(obj.asVersion("0.95"), rawFull, "object.asVersion 0.95 (full)");
            deepEqual(obj.asVersion("0.9"), rawFull9, "object.asVersion 0.9 (full)");
        }
    );

    test(
        ".9 specific naming",
        function () {
            var obj,
                result
            ;

            obj = new TinCan.AgentAccount (
                {
                    accountServiceHomePage: "testAccountServiceHomePage",
                    accountName: "testAccountName"
                }
            );
            equal(obj.name, "testAccountName", "object construction with accountName name property value");
            equal(obj.homePage, "testAccountServiceHomePage", "object construction with accountServiceHomePage homePage property value");
        }
    );
}());
