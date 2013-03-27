Development Processes
=====================

Build instructions
------------------

For first time builds install Node.js with npm and then run `npm install gear gear-lib`.

With Node.js installed and the requisite modules present, issue:

    ./build.js

This will generate build/tincan.js and build/tincan-min.js files.

API Documentation Generation
----------------------------

Install yuidoc via `npm install -g yuidocjs` and then from the base directory issue:

    yuidoc src/

Files will be output to doc/api/ which can be viewed by pointing a browser at the index.html at that path
