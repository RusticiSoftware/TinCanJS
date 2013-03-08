var TinCanTest;

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
