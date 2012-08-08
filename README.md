An initial pass client JS library for talking Tin Can to the world.

http://tincanapi.com/

Usage
-----

If you have `ant` installed and a shell available then change into the src/
directory and run ./build.sh to get a raw and minified version under build/.
Load either the build/TCDriver.js or build/TCDriver-min.js file on your page,
retrieve a configuration object using TCDriver\_GetConfigObject() and then call
various functions passing in the configuration object.

At the moment the raw version is a straight copy of the src/ version so if you
don't have `ant` available or a Unix shell then either load the src/ version
directly in your page or copy it to build/ and load from there like normal.

Constants
---------

The configuration object detects the following constants:

* TC\_COURSE\_ID
* TC\_COURSE\_NAME
* TC\_COURSE\_DESC
* TC\_RECORD\_STORES
