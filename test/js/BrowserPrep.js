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
log = function () {};
if (typeof console !== "undefined" && console.log) {
    log = function (msg) {
        console.log("Test: " + msg);
    }
}

var TinCanTest,
    TinCanTestCfg;

(function () {
    TinCanTest = TinCanTest || {};

    TinCanTest.assertHttpRequestType = function (xhr, name) {
        var desc = "assertHttpRequestType: " + name;
        if (typeof XDomainRequest !== "undefined" && xhr instanceof XDomainRequest) {
            ok(true, desc);
            return;
        }

        if (typeof XMLHttpRequest !== "undefined") {
            //
            // in IE7 at least XMLHttpRequest is an 'object' but it fails
            // the instanceof check because it apparently isn't considered
            // a constructor function
            //
            if (typeof XMLHttpRequest === "function") {
                ok(xhr instanceof XMLHttpRequest, desc);
            }
            else if (typeof XMLHttpRequest === "object") {
                ok(true, desc + " (XMLHttpRequest found but not constructor)");
            }
            else {
                ok(true, desc + " (unplanned for xhr)");
            }
            return;
        }

        ok(false, desc + " (unrecognized request environment)");
    };
}());
