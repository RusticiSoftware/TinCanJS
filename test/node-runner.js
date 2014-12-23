var testRunner = require("qunit");

testRunner.setup(
    {
        log: {
            // log currently testing code file
            testing: true

            // log assertions overview
            //,assertions: true

            // log tests overview
            //,tests: true

            // log expected and actual values for failed tests
            ,errors: true

            // log summary
            //,summary: true

            // log global summary (all files)
            ,globalSummary: true
        }
    }
);

testRunner.run(
    {
        deps: [
            { path: __dirname + "/js/NodePrep.js", namespace: "TinCanTest" },
            { path: __dirname + "/config.js", namespace: "TinCanTestCfg" }
        ],
        code: { path: __dirname + "/../build/tincan-node.js", namespace: "TinCan" },
        tests: [
            __dirname + "/js/unit/State.js"
            , __dirname + "/js/unit/ActivityProfile.js"
            , __dirname + "/js/unit/AgentProfile.js"
            , __dirname + "/js/unit/StatementsResult.js"
            , __dirname + "/js/unit/Agent.js"
            , __dirname + "/js/unit/Group.js"
            , __dirname + "/js/unit/Activity.js"
            , __dirname + "/js/unit/ActivityDefinition.js"
            , __dirname + "/js/unit/ContextActivities.js"
            , __dirname + "/js/unit/Context.js"
            , __dirname + "/js/unit/InteractionComponent.js"
            , __dirname + "/js/unit/Result.js"
            , __dirname + "/js/unit/Score.js"
            , __dirname + "/js/unit/Statement.js"
            , __dirname + "/js/unit/StatementRef.js"
            , __dirname + "/js/unit/SubStatement.js"
            , __dirname + "/js/unit/Verb.js"
            , __dirname + "/js/unit/Utils.js"
            , __dirname + "/js/unit/TinCan.js"
            , __dirname + "/js/unit/TinCan-async.js"
            , __dirname + "/js/unit/LRS.js"
            , __dirname + "/js/unit/About.js"
        ]
    },
    function (err, report) {
        if (err) {
            throw new Error(err);
        }
        if (report.failed > 0) {
            throw new Error("Tests had failures: " + report.failed);
        }
    }
);
