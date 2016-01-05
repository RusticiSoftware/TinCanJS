---
layout: index
---

### Supported API Versions

**1.0.0** (1.0.1, 1.0.2), 0.95, 0.9

### Getting Started

Download the build file(s) and load them on an HTML page. Only one of either 'build/tincan.js' or 'build/tincan-min.js' is needed at a time. You *can* link to the individual source files but this is not usually necessary outside of development on TinCanJS itself. The '-min.js' build file has been minified for performance but makes it slightly harder to debug.

TinCanJS can be installed via npm using `npm install tincanjs`. See https://www.npmjs.com/package/tincanjs for more.

TinCanJS can be included as a dependency when using <a href="http://bower.io">bower</a>. Include 'tincan' as the component name.

## Basic Usage

### Create an LRS Object

The `TinCan.LRS` object is the primary means of communication with the LRS. It requires an endpoint, username and password (for Basic Auth). Turning off `allowFail` prevents silent failures which you want to do unless you are sending to multiple LRSs at once and have at least one other non-allowFail created LRS object. Optionally you can specify the version of the xAPI specification that should be used when communicating with the LRS, the default is the latest supported version in the library.

```javascript
var lrs;

try {
    lrs = new TinCan.LRS(
        {
            endpoint: "https://cloud.scorm.com/tc/public/",
            username: "<Test User>",
            password: "<Test Password>",
            allowFail: false
        }
    );
}
catch (ex) {
    console.log("Failed to setup LRS object: " + ex);
    // TODO: do something with error, can't communicate with LRS
}
```

### Creating a Statement Object

The various "model" objects (such as Statement, Agent, Verb, Activity, Result, etc.) all work roughly the same, and include a constructor that takes an object literal, a `fromJSON` factory method that takes a string of JSON for deserialization, and an `asVersion` method for serialization. Additional specific properties and methods are available depending on the type of object (consult the [API documentation](http://rusticisoftware.github.io/TinCanJS/doc/api/latest/) for details).

```javascript
var statement = new TinCan.Statement(
    {
        actor: {
            mbox: "mailto:info@tincanapi.com"
        },
        verb: {
            id: "http://adlnet.gov/expapi/verbs/experienced"
        },
        target: {
            id: "http://rusticisoftware.github.com/TinCanJS"
        }
    }
);
```
### Sending a Statement

With the `lrs` and `statement` objects created using the code above send the statement using the `saveStatement` method. Depending on the loaded environment the LRS interface can support both asynchronous and synchronous calls (browser supports both for now, Node.js only supports asynchronous). (Note: the major browsers are moving to deprecate synchronous XHR requests so it is highly recommended to use the asynchronous interface.)

#### Asynchronous

```javascript
lrs.saveStatement(
    statement,
    {
        callback: function (err, xhr) {
            if (err !== null) {
                if (xhr !== null) {
                    console.log("Failed to save statement: " + xhr.responseText + " (" + xhr.status + ")");
                    // TODO: do something with error, didn't save statement
                    return;
                }

                console.log("Failed to save statement: " + err);
                // TODO: do something with error, didn't save statement
                return;
            }

            console.log("Statement saved");
            // TOOO: do something with success (possibly ignore)
        }
    }
);
```

#### Synchronous (not recommended)

```javascript
var result = lrs.saveStatement(statement);
if (result.err !== null) {
    if (/^\d+$/.test(result.err)) {
        if (result.err === 0) {
            console.log("Failed to save statement: aborted, offline, or invalid CORS endpoint");
            // TODO: do something with error, didn't save statement
        }
        else {
            console.log("Failed to save statement: " + result.xhr.responseText);
            // TODO: do something with error, didn't save statement
        }
    }
    else {
        console.log("Failed to save statement: " + result.err);
        // TODO: do something with error, didn't save statement
    }
}
else {
    console.log("Statement saved");
    // TOOO: do something with success (possibly ignore)
}
```

### Retrieving Statements

```javascript
lrs.queryStatements(
    {
        params: {
            verb: "http://adlnet.gov/expapi/verbs/experienced",
            since: "2016-01-05T08:34:16Z"
        },
        callback: function (err, sr) {
            if (err !== null) {
                console.log("Failed to query statements: " + err);
                // TODO: do something with error, didn't get statements
                return;
            }

            if (sr.more !== null) {
                // TODO: additional page(s) of statements should be fetched
            }

            // TODO: do something with statements in sr.statements
        }
    }
);
```

## Legacy Usage

The following usage examples are outdated and use an interface (specifically the `TinCan` object) that is likely to be deprecated and removed in a future major version release. It is now recommended to use the `TinCan.LRS` interface directly as shown in the above examples.

### Basic Usage

The following sample shows the most basic usage of TinCanJS.

```javascript
var tincan = new TinCan (
    {
        recordStores: [
            {
                endpoint: "https://cloud.scorm.com/tc/public/",
                username: "<Test User>",
                password: "<Test User's Password>",
                allowFail: false
            }
        ]
    }
);
tincan.sendStatement(
    {
        actor: {
            mbox: "mailto:info@tincanapi.com"
        },
        verb: {
            id: "http://adlnet.gov/expapi/verbs/attempted"
        },
        target: {
            id: "http://rusticisoftware.github.com/TinCanJS"
        }
    }
);
```

### Asynchronous Query to Get Latest Statements

(Given a configured `tincan` object like above.)

```javascript
tincan.getStatements(
    {
        // 'params' is passed through to TinCan.LRS.queryStatements
        params: {
            since: "2013-08-29 07:42:10CDT"
        },
        callback: function (err, result) {
            // 'err' will be null on success
            if (err !== null) {
                // handle error
                return;
            }

            // handle success, 'result' is a TinCan.StatementsResult object
            console.log(result);
        }
    }
);
```
