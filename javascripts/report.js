(function () {
    var lrs,
        statement = new TinCan.Statement(
            {
                actor: {
                    mbox: "mailto:tincanjs-github@tincanapi.com"
                },
                verb: {
                    id: "http://adlnet.gov/expapi/verbs/attempted"
                },
                target: {
                    id: "http://rusticisoftware.github.com/TinCanJS"
                }
            }
        );

    try {
        lrs = new TinCan.LRS(
            {
                endpoint: "https://cloud.scorm.com/ScormEngineInterface/TCAPI/public/",
                username: "test",
                password: "pass",
                allowFail: false
            }
        );
    }
    catch (ex) {
        console.log("Failed to setup LRS object: " + ex);
    }

    lrs.saveStatement(
        statement,
        {
            callback: function () {}
        }
    );
}());
