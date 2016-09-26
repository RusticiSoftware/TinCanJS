var testRunner = require("qunit"),
    args = process.argv.slice(2),
    tests,
    isJSUnitFile = /^js\/unit\//,
    isAbsoluteFile = /^\//;

if (args.length) {
    tests = args;
}
else {
    tests = [
        "State.js",
        "ActivityProfile.js",
        "AgentProfile.js",
        "StatementsResult.js",
        "Agent.js",
        "Group.js",
        "Activity.js",
        "ActivityDefinition.js",
        "ContextActivities.js",
        "Context.js",
        "InteractionComponent.js",
        "Result.js",
        "Score.js",
        "Statement.js",
        "StatementRef.js",
        "SubStatement.js",
        "Verb.js",
        "Utils.js",
        "TinCan.js",
        "TinCan-async.js",
        "LRS.js",
        "About.js",
        "Attachment.js"
    ];
}

for (i = 0; i < tests.length; i += 1) {
    if (isJSUnitFile.test(tests[i])) {
        tests[i] = __dirname + "/" + tests[i];
        continue;
    }
    if (! isAbsoluteFile.test(tests[i])) {
        tests[i] = __dirname + "/js/unit/" + tests[i];
    }
}

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
        tests: tests
    },
    function (err, report) {
        if (err) {
            if (err instanceof Error) {
                throw err;
            }
            throw new Error(err);
        }
        if (report.failed > 0) {
            throw new Error("Tests had failures: " + report.failed);
        }
    }
);
