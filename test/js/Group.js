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
        "Group Statics",
        {
            setup: function () {},
            teardown: function () {}
        }
    );

    test(
        "Group.fromJSON",
        function () {
            var raw = {
                    mbox: "test-group@tincanapi.com",
                    member: [
                        "test-group-member+1@tincanapi.com",
                        "test-group-member+2@tincanapi.com"
                    ]
                },
                string,
                result
            ;

            var result = TinCan.Group.fromJSON(JSON.stringify(raw));
            ok(result instanceof TinCan.Group, "returns TinCan.Group");
        }
    );

    module("Group Instance");

    test(
        "group Object",
        function () {
            var obj = new TinCan.Group ();

            ok(obj instanceof TinCan.Group, "group is TinCan.Group");

            // test direct properties from construction
            ok(obj.hasOwnProperty("name"), "group has property: name");
            strictEqual(obj.name, null, "group.name property initial value");
            ok(obj.hasOwnProperty("mbox"), "group has property: mbox");
            strictEqual(obj.mbox, null, "group.mbox property initial value");
            ok(obj.hasOwnProperty("mbox_sha1sum"), "group has property: mbox_sha1sum");
            strictEqual(obj.mbox_sha1sum, null, "group.mbox_sha1sum property initial value");
            ok(obj.hasOwnProperty("openid"), "group has property: openid");
            strictEqual(obj.openid, null, "group.openid property initial value");
            ok(obj.hasOwnProperty("account"), "group has property: account");
            strictEqual(obj.account, null, "group.account property initial value");
            ok(obj.hasOwnProperty("member"), "group has property: member");
            deepEqual(obj.member, [], "group.member property initial value");

            // test properties from prototype
            strictEqual(obj.LOG_SRC, "Group", "group property LOG_SRC initial value");
            strictEqual(obj.objectType, "Group", "group property objectType initial value");
        }
    );

    test(
        "group with mbox",
        function () {
            var obj,
                result
            ;

            obj = new TinCan.Group (
                {
                    mbox: "test-group@tincanapi.com"
                }
            );

            ok(obj instanceof TinCan.Group, "object is TinCan.Group");
            strictEqual(obj.mbox, "mailto:test-group@tincanapi.com", "object.mbox property initial value (mailto: added)");

            obj = new TinCan.Group (
                {
                    mbox: "mailto:test-group@tincanapi.com"
                }
            );

            ok(obj instanceof TinCan.Group, "object is TinCan.Group");
            strictEqual(obj.mbox, "mailto:test-group@tincanapi.com", "object.mbox property initial value");
            strictEqual(obj.toString(), "Group: test-group@tincanapi.com", "object.toString");
        }
    );

    test(
        "group with mbox_sha1sum",
        function () {
            var obj,
                result
            ;

            obj = new TinCan.Group (
                {
                    mbox_sha1sum: "arbitrary"
                }
            );

            ok(obj instanceof TinCan.Group, "object is TinCan.Group");
            strictEqual(obj.mbox_sha1sum, "arbitrary", "object.mbox_sha1sum property initial value");
            strictEqual(obj.toString(), "Group: arbitrary", "object.toString");
        }
    );

    test(
        "group with openid",
        function () {
            var obj,
                result
            ;

            obj = new TinCan.Group (
                {
                    openid: "http://tincanapi.com/"
                }
            );

            ok(obj instanceof TinCan.Group, "object is TinCan.Group");
            strictEqual(obj.openid, "http://tincanapi.com/", "object.mbox_sha1sum property initial value");
            strictEqual(obj.toString(), "Group: http://tincanapi.com/", "object.toString");
        }
    );

    test(
        "group with account",
        function () {
            var obj,
                result
            ;

            obj = new TinCan.Group (
                {
                    account: {}
                }
            );
            ok(obj instanceof TinCan.Group, "object is TinCan.Group (empty)");
            deepEqual(obj.account, new TinCan.AgentAccount({ name: null, homePage: null }), "account property value (empty)");
            strictEqual(obj.toString(), "Group: AgentAccount: unidentified", "object.toString (empty)");

            obj = new TinCan.Group (
                {
                    account: {
                        name: "test"
                    }
                }
            );
            ok(obj instanceof TinCan.Group, "object is TinCan.Group (name only)");
            deepEqual(obj.account, new TinCan.AgentAccount({ name: "test", homePage: null }), "account property value (name only)");
            strictEqual(obj.toString(), "Group: test:-", "object.toString (name only)");

            obj = new TinCan.Group (
                {
                    account: {
                        homePage: "http://tincanapi.com/"
                    }
                }
            );
            ok(obj instanceof TinCan.Group, "object is TinCan.Group (homePage only)");
            deepEqual(obj.account, new TinCan.AgentAccount({ name: null, homePage: "http://tincanapi.com/" }), "account property value (homePage only)");
            strictEqual(obj.toString(), "Group: -:http://tincanapi.com/", "object.toString (homePage only)");

            obj = new TinCan.Group (
                {
                    account: {
                        name: "test",
                        homePage: "http://tincanapi.com/"
                    }
                }
            );
            ok(obj instanceof TinCan.Group, "object is TinCan.Group (full)");
            deepEqual(obj.account, new TinCan.AgentAccount({ name: "test", homePage: "http://tincanapi.com/" }), "account property value (full)");
            strictEqual(obj.toString(), "Group: test:http://tincanapi.com/", "object.toString (full)");
        }
    );

    test(
        "group with members",
        function () {
            var obj,
                result,
                raw  = { mbox: "test-group-member@tincanapi.com" },
                raw2 = { mbox: "test-group-member+1@tincanapi.com" },
                common = new TinCan.Agent(raw),
                common2 = new TinCan.Agent(raw2)
            ;

            obj = new TinCan.Group (
                {
                    member: []
                }
            );
            strictEqual(obj.member.length, 0, "object.member property length (zero)");

            obj = new TinCan.Group (
                {
                    member: [ raw ],
                }
            );
            strictEqual(obj.member.length, 1, "object.member property length (1 raw)");
            deepEqual(obj.member[0], common, "object.member instance (1 raw)");

            obj = new TinCan.Group (
                {
                    member: [ raw, raw2 ],
                }
            );
            strictEqual(obj.member.length, 2, "object.member property length (2 raw)");
            deepEqual(obj.member[0], common, "object.member instance 0 (2 raw)");
            deepEqual(obj.member[1], common2, "object.member instance 1 (2 raw)");

            obj = new TinCan.Group (
                {
                    member: [ common ],
                }
            );
            strictEqual(obj.member.length, 1, "object.member property length (1 precreated)");
            deepEqual(obj.member[0], common, "object.member instance (1 precreated)");

            obj = new TinCan.Group (
                {
                    member: [ common, common2 ],
                }
            );
            strictEqual(obj.member.length, 2, "object.member property length (2 precreated)");
            deepEqual(obj.member[0], common, "object.member instance 0 (2 precreated)");
            deepEqual(obj.member[1], common2, "object.member instance 1 (2 precreated)");

            obj = new TinCan.Group (
                {
                    member: [ raw, common2 ],
                }
            );
            strictEqual(obj.member.length, 2, "object.member property length (2 mixed)");
            deepEqual(obj.member[0], common, "object.member instance 0 (2 mixed)");
            deepEqual(obj.member[1], common2, "object.member instance 1 (2 mixed)");

            obj = new TinCan.Group (
                {
                    member: [ common, raw2 ],
                }
            );
            strictEqual(obj.member.length, 2, "object.member property length (2 mixed reverse)");
            deepEqual(obj.member[0], common, "object.member instance 0 (2 mixed reverse)");
            deepEqual(obj.member[1], common2, "object.member instance 1 (2 mixed reverse)");

            obj = new TinCan.Group (
                {
                    member: [ common, raw, common2, raw2 ],
                }
            );
            strictEqual(obj.member.length, 4, "object.member property length (4 mixed)");
            deepEqual(obj.member[0], common, "object.member instance 0 (4 mixed)");
            deepEqual(obj.member[1], common, "object.member instance 1 (4 mixed)");
            deepEqual(obj.member[2], common2, "object.member instance 2 (4 mixed)");
            deepEqual(obj.member[3], common2, "object.member instance 3 (4 mixed)");
        }
    );

    test(
        "group asVersion",
        function () {
            var obj,
                result,
                rawMbox      = { objectType: "Group", name: "Test Group", mbox: "mailto:test-group@tincanapi.com" },
                rawMbox9     = { objectType: "Group", name: [ "Test Group" ], mbox: [ "mailto:test-group@tincanapi.com" ] }
                rawMboxSHA1  = { objectType: "Group", name: "Test Group", mbox_sha1sum: "arbitrary" },
                rawMboxSHA19 = { objectType: "Group", name: [ "Test Group" ], mbox_sha1sum: [ "arbitrary" ] },
                rawOpenID    = { objectType: "Group", name: "Test Group", openid: "http://tincanapi.com/" },
                rawOpenID9   = { objectType: "Group", name: [ "Test Group" ], openid: [ "http://tincanapi.com/" ] }
                rawAccount   = { objectType: "Group", name: "Test Group", account: { name: "name", homePage: "homePage" } },
                rawAccount9  = { objectType: "Group", name: [ "Test Group" ], account: [ { accountName: "name", accountServiceHomePage: "homePage" } ] },
                rawMember    = { objectType: "Group", name: "Test Group", member: [ { objectType: "Agent", mbox: "mailto:test-group@tincanapi.com" } ] },
                rawMember9   = { objectType: "Group", name: [ "Test Group" ], member: [ { objectType: "Agent", mbox: [ "mailto:test-group@tincanapi.com" ] } ] }
            ;

            // include other properties to confirm correct response
            // of single unique id field
            obj = new TinCan.Group (
                {
                    name: "Test Group",
                    mbox: "test-group@tincanapi.com",
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

            obj = new TinCan.Group (
                {
                    name: "Test Group",
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

            obj = new TinCan.Group (
                {
                    name: "Test Group",
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

            obj = new TinCan.Group (
                {
                    name: "Test Group",
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

            obj = new TinCan.Group (
                {
                    name: "Test Group",
                    member: [
                        {
                            mbox: "test-group@tincanapi.com"
                        }
                    ]
                }
            );

            result = obj.asVersion("0.9");
            deepEqual(result, rawMember9, "object.asVersion() member 0.9");

            result = obj.asVersion("0.95");
            deepEqual(result, rawMember, "object.asVersion() member 0.95");

            result = obj.asVersion();
            deepEqual(result, rawMember, "object.asVersion() member latest");
        }
    );
}());
