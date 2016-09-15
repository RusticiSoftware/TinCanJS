A JavaScript library for implementing the Experience API (Tin Can API).

[![Build Status](https://travis-ci.org/RusticiSoftware/TinCanJS.png)](https://travis-ci.org/RusticiSoftware/TinCanJS)
[![GitHub release](https://img.shields.io/github/release/RusticiSoftware/TinCanJS.svg?maxAge=2592000)](https://github.com/RusticiSoftware/TinCanJS/releases)
[![npm](https://img.shields.io/npm/v/tincanjs.svg?maxAge=2592000)](https://www.npmjs.com/package/tincanjs)
[![license](https://img.shields.io/github/license/RUsticiSoftware/TinCanJS.svg?maxAge=2592000)]()

For hosted API documentation, basic usage instructions, supported version listing, etc. visit the main project website at:

http://rusticisoftware.github.io/TinCanJS/

For more information about the Experience API visit:

http://experienceapi.com/

Browser Usage
-------------

TinCanJS is available via `npm` and Bower.

The browser environment is well tested and supports two kinds of Cross Origin requests which
is sufficient to cover most versions of Chrome, FireFox, Safari as well as IE 8+. IE 6+ are
supported for non-CORS (because they don't support it).

Include *one* of build/tincan-min.js or build/tincan.js as follows:

    <script src="build/tincan-min.js"></script>

Node.js Usage
-------------

TinCanJS is available via `npm`.

The `Environment/Node.js` wrapper used in this version has a dependency on the 'xhr2' module
which is also available via `npm`. It is used to allow the interfaces to the underlying LRS
requests to have the same API. As such currently there is no support for synchronous requests
when using this environment.

Install via:

    npm install tincanjs

And within code:

    var TinCan = require('tincanjs');

Environments
------------

Implementing a new Environment should be straightforward and requires overloading a couple
of methods in the library. There are currently two examples, `Environment/Browser`
and `Environment/Node`.

Attachment Support
------------------

Sending and retrieving statements with attachments via the multipart/mixed request/response
cycle works end to end with binary attachments in Node.js 4+ and in the typical modern browsers:
Chrome 53+, Firefox 48+, Safari 9+, IE 10+ (current versions at time of implementation, older versions
may work without changes but have not been tested). Attachments without included content (those using
only the `fileUrl` property) should be supported in all environments supported by the library.

Several polyfills (TypedArrays, ArrayBuffer w/ slice, Blob, TextDecoder/TextEncoder) are needed
to support various browser versions, if you are targeting a recent enough set of browsers you
can reduce the overall size of the built library by commenting out those polyfills in the
`Gruntfile.js` file and building yourself.
