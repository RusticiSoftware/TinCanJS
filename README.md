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
of methods on the `TinCan.LRS` prototype. There are currently two examples, `Environment/Browser`
and `Environment/Node`.
