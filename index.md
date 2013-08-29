---
layout: index
---

### Supported API Versions

**1.0.0**, 0.95, 0.9

### Getting Started

Download the build file(s) and load them on an HTML page. Only one of either 'build/tincan.js' or 'build/tincan-min.js' is needed at a time. You *can* link to the individual source files but this is not usually necessary outside of development on TinCanJS itself. The '-min.js' build file has been minified for performance but makes it slightly harder to debug.

### Basic Usage

The following sample shows the most basic usage of TinCanJS.

```javascript
var tincan = new TinCan (
    {
        recordStores: [
            {
                endpoint: "https://cloud.scorm.com/ScormEngineInterface/TCAPI/public/",
                username: "<Test User>",
                password: "<Test User's Password>"
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
