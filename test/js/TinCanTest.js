var TinCanTest,
    TinCanTestCfg = {
        recordStores: {}
    },
    log
;

log = function () {};
if (console && console.log) {
    log = function (msg) {
        console.log("Test: " + msg);
    }
}

(function () {
    TinCanTest = {};

    TinCanTest.assertHttpRequestType = function (xhr, name) {
        var desc = "assertHttpRequestType: " + name;
        if (TinCan.environment().useXDR) {
            ok(xhr instanceof XDomainRequest, desc);
        }
        else {
            ok(xhr instanceof XMLHttpRequest, desc);
        }
    };
}());
