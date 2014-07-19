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
            { path: "js/NodePrep.js", namespace: "TinCanTest" },
            { path: "config.js", namespace: "TinCanTestCfg" }
        ],
        code: { path: "../build/tincan-node.js", namespace: "TinCan" },
        tests: [
            "js/unit/State.js"
            ,"js/unit/ActivityProfile.js"
            ,"js/unit/AgentProfile.js"
            ,"js/unit/StatementsResult.js"
            ,"js/unit/Agent.js"
            ,"js/unit/Group.js"
            ,"js/unit/Activity.js"
            ,"js/unit/ActivityDefinition.js"
            ,"js/unit/ContextActivities.js"
            ,"js/unit/Context.js"
            ,"js/unit/InteractionComponent.js"
            ,"js/unit/Result.js"
            ,"js/unit/Score.js"
            ,"js/unit/Statement.js"
            ,"js/unit/StatementRef.js"
            ,"js/unit/SubStatement.js"
            ,"js/unit/Verb.js"
            ,"js/unit/Utils.js"
            ,"js/unit/TinCan.js"
            ,"js/unit/TinCan-async.js"
            ,"js/unit/LRS.js"
            ,"js/unit/About.js"
        ]
    },
    function (err, report) {
        if (err) {
            console.log("Error occurred: " + err);
        }
    }
);
