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

    module("Agent Statics");

    test(
        "Agent.fromJSON",
        function () {
            var raw = {
                    mbox: "test-agent@tincanapi.com"
                },
                string,
                result
            ;

            var result = TinCan.Agent.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.Agent, "returns TinCan.Agent");
        }
    );

    module("Agent Instance");

    test(
        "agent Object",
        function () {
            var obj = new TinCan.Agent ();

            ok(obj instanceof TinCan.Agent, "object is TinCan.Agent");

            // test direct properties from construction
            ok(obj.hasOwnProperty("name"), "object has property: name");
            strictEqual(obj.name, null, "object.name property initial value");
            ok(obj.hasOwnProperty("mbox"), "object has property: mbox");
            strictEqual(obj.mbox, null, "object.mbox property initial value");
            ok(obj.hasOwnProperty("mbox_sha1sum"), "object has property: mbox_sha1sum");
            strictEqual(obj.mbox_sha1sum, null, "object.mbox_sha1sum property initial value");
            ok(obj.hasOwnProperty("openid"), "object has property: openid");
            strictEqual(obj.openid, null, "object.openid property initial value");
            ok(obj.hasOwnProperty("account"), "object has property: account");
            strictEqual(obj.account, null, "object.account property initial value");

            // test properties from prototype
            strictEqual(obj.LOG_SRC, "Agent", "object property LOG_SRC initial value");
            strictEqual(obj.objectType, "Agent", "object property objectType initial value");
        }
    );

    test(
        "agent with mbox",
        function () {
            var obj,
                result
            ;

            obj = new TinCan.Agent (
                {
                    mbox: "test-agent@tincanapi.com"
                }
            );

            ok(obj instanceof TinCan.Agent, "object is TinCan.Agent");
            equal(obj.mbox, "mailto:test-agent@tincanapi.com", "object.mbox property initial value (mailto: added)");

            obj = new TinCan.Agent (
                {
                    mbox: "mailto:test-agent@tincanapi.com"
                }
            );

            ok(obj instanceof TinCan.Agent, "object is TinCan.Agent");
            equal(obj.mbox, "mailto:test-agent@tincanapi.com", "object.mbox property initial value");
            equal(obj.toString(), "test-agent@tincanapi.com", "object.toString");
        }
    );

    test(
        "agent with mbox_sha1sum",
        function () {
            var obj,
                result
            ;

            obj = new TinCan.Agent (
                {
                    mbox_sha1sum: "arbitrary"
                }
            );

            ok(obj instanceof TinCan.Agent, "object is TinCan.Agent");
            equal(obj.mbox_sha1sum, "arbitrary", "object.mbox_sha1sum property initial value");
            equal(obj.toString(), "arbitrary", "object.toString");
        }
    );

    test(
        "agent with openid",
        function () {
            var obj,
                result
            ;

            obj = new TinCan.Agent (
                {
                    openid: "http://tincanapi.com/"
                }
            );

            ok(obj instanceof TinCan.Agent, "object is TinCan.Agent");
            equal(obj.openid, "http://tincanapi.com/", "object.mbox_sha1sum property initial value");
            equal(obj.toString(), "http://tincanapi.com/", "object.toString");
        }
    );

    test(
        "agent with account",
        function () {
            var obj,
                result
            ;

            obj = new TinCan.Agent (
                {
                    account: {}
                }
            );
            ok(obj instanceof TinCan.Agent, "object is TinCan.Agent (empty)");
            deepEqual(obj.account, new TinCan.AgentAccount({ name: null, homePage: null }), "account property value (empty)");
            equal(obj.toString(), "AgentAccount: unidentified", "object.toString (empty)");

            obj = new TinCan.Agent (
                {
                    account: {
                        name: "test"
                    }
                }
            );
            ok(obj instanceof TinCan.Agent, "object is TinCan.Agent (name only)");
            deepEqual(obj.account, new TinCan.AgentAccount({ name: "test", homePage: null }), "account property value (name only)");
            equal(obj.toString(), "test:-", "object.toString (name only)");

            obj = new TinCan.Agent (
                {
                    account: {
                        homePage: "http://tincanapi.com/"
                    }
                }
            );
            ok(obj instanceof TinCan.Agent, "object is TinCan.Agent (homePage only)");
            deepEqual(obj.account, new TinCan.AgentAccount({ name: null, homePage: "http://tincanapi.com/" }), "account property value (homePage only)");
            equal(obj.toString(), "-:http://tincanapi.com/", "object.toString (homePage only)");

            obj = new TinCan.Agent (
                {
                    account: {
                        name: "test",
                        homePage: "http://tincanapi.com/"
                    }
                }
            );
            ok(obj instanceof TinCan.Agent, "object is TinCan.Agent (full)");
            deepEqual(obj.account, new TinCan.AgentAccount({ name: "test", homePage: "http://tincanapi.com/" }), "account property value (full)");
            equal(obj.toString(), "test:http://tincanapi.com/", "object.toString (full)");
        }
    );

    test(
        "agent asVersion",
        function () {
            var obj,
                result,
                rawMbox      = { objectType: "Agent", name: "Test Agent", mbox: "mailto:test-agent@tincanapi.com" },
                rawMbox9     = { objectType: "Agent", name: [ "Test Agent" ], mbox: [ "mailto:test-agent@tincanapi.com" ] }
                rawMboxSHA1  = { objectType: "Agent", name: "Test Agent", mbox_sha1sum: "arbitrary" },
                rawMboxSHA19 = { objectType: "Agent", name: [ "Test Agent" ], mbox_sha1sum: [ "arbitrary" ] },
                rawOpenID    = { objectType: "Agent", name: "Test Agent", openid: "http://tincanapi.com/" },
                rawOpenID9   = { objectType: "Agent", name: [ "Test Agent" ], openid: [ "http://tincanapi.com/" ] }
                rawAccount   = { objectType: "Agent", name: "Test Agent", account: { name: "name", homePage: "homePage" } },
                rawAccount9  = { objectType: "Agent", name: [ "Test Agent" ], account: [ { accountName: "name", accountServiceHomePage: "homePage" } ] }
            ;

            // include other properties to confirm correct response
            // of single unique id field
            obj = new TinCan.Agent (
                {
                    name: "Test Agent",
                    mbox: "test-agent@tincanapi.com",
                    mbox_sha1sum: "arbitrary",
                    openid: "http://tincanapi.com/",
                    account: {}
                }
            );

            result = obj.asVersion("0.9");
            deepEqual(result, rawMbox9, "object.asVersion() mbox 0.9");

            result = obj.asVersion("0.95");
            deepEqual(result, rawMbox, "object.asVersion() mbox 0.95");

            result = obj.asVersion();
            deepEqual(result, rawMbox, "object.asVersion() mbox latest");

            obj = new TinCan.Agent (
                {
                    name: "Test Agent",
                    mbox_sha1sum: "arbitrary",
                    openid: "http://tincanapi.com/",
                    account: {}
                }
            );

            result = obj.asVersion("0.9");
            deepEqual(result, rawMboxSHA19, "object.asVersion() mbox_sha1sum 0.9");

            result = obj.asVersion("0.95");
            deepEqual(result, rawMboxSHA1, "object.asVersion() mbox_sha1sum 0.95");

            result = obj.asVersion();
            deepEqual(result, rawMboxSHA1, "object.asVersion() mbox_sha1sum latest");

            obj = new TinCan.Agent (
                {
                    name: "Test Agent",
                    openid: "http://tincanapi.com/",
                    account: {}
                }
            );

            result = obj.asVersion("0.9");
            deepEqual(result, rawOpenID9, "object.asVersion() openid 0.9");

            result = obj.asVersion("0.95");
            deepEqual(result, rawOpenID, "object.asVersion() openid 0.95");

            result = obj.asVersion();
            deepEqual(result, rawOpenID, "object.asVersion() openid latest");

            obj = new TinCan.Agent (
                {
                    name: "Test Agent",
                    account: {
                        name: "name",
                        homePage: "homePage"
                    }
                }
            );

            result = obj.asVersion("0.9");
            deepEqual(result, rawAccount9, "object.asVersion() account 0.9");

            result = obj.asVersion("0.95");
            deepEqual(result, rawAccount, "object.asVersion() account 0.95");

            result = obj.asVersion();
            deepEqual(result, rawAccount, "object.asVersion() account latest");
        }
    );
}());
