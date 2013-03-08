#!/usr/bin/env node

var gear = require('gear');

new gear.Queue(
    {
        registry: new gear.Registry(
            {
                module: 'gear-lib'
            }
        )
    }
)
.log("Reading")
.read(
    [
        'src/TinCan.js'
        ,'src/Utils.js'
        ,'src/LRS.js'
        ,'src/AgentAccount.js'
        ,'src/Agent.js'
        ,'src/Group.js'
        ,'src/Verb.js'
        ,'src/Result.js'
        ,'src/Score.js'
        ,'src/Context.js'
        ,'src/Activity.js'
        ,'src/InteractionComponent.js'
        ,'src/ActivityDefinition.js'
        ,'src/StatementRef.js'
        ,'src/SubStatement.js'
        ,'src/Statement.js'
        ,'src/StatementsResult.js'
        ,'src/State.js'
        ,'src/ActivityProfile.js'
    ]
)
.log("Linting")
.jslint(
    {
        config: {
            white: true,
            nomen: true,
            passfail: false,

            // for predefined environments
            devel: true,      // to get console, alert defined
            browser: true,
            node: true,
            es5: false,

            // predefined globals
            predef: [
                "TinCan", "XDomainRequest"
            ]
        },
        callback: function (linted) {
            var messages = linted.jslint || [],
                counter = 0
            ;
            if (messages.length) {
                console.log('    ' + linted.name + ' contains ' + messages.length + ' lint errors');
                messages.forEach(
                    function (item) {
                        if (item && item.reason) {
                            counter += 1;
                            console.log('        #' + counter + ': ' + item.reason);
                            if (item.evidence) {
                                console.log('            ' + String(item.evidence).trim() + (' // line ' + item.line + ', pos ' + item.character));
                            }
                        }
                    }
                )
            }
            else {
                console.log('    ' + linted.name + ' lint free!');
            }
        }
    }
)
.read(
    [
        'vendor/cryptojs-v3.0.2/rollups/sha1.js',
        'vendor/cryptojs-v3.0.2/components/enc-base64.js'
    ]
)
.log("Concating")
.concat()
.log("Writing raw")
.write('build/tincan.js')
.log("Minifying")
.jsminify(
    {
        callback: function (e) {
            console.log('compression failed: ' + e.message);
        },
        config: {
            mangle: true,
            squeeze: true,
            semicolon: false,
            lift_vars: true,
            mangle_toplevel: true,
            no_mangle_functions: true,
            max_line_length: 6000
        }
    }
)
.log("Writing min")
.write('build/tincan-min.js')
.run();
