An initial pass client JS library for talking Tin Can to the world.

http://tincanapi.com/

Usage
-----

Build instructions
==================

For first time builds install Node.js with npm and then run `npm install gear gear-lib`.

With Node.js installed and the requisite modules present, issue:

    ./build.js

This will generate build/tincan.js and build/tincan-min.js files (you only need to load one). Which can be included as follows:

<script type="text/javascript" src="build/tincan-min.js"></script>

Source instructions
===================

Alternatively you can just link to the individual files themselves like so:

<script type="text/javascript" src="src/TinCan.js"></script>
<script type="text/javascript" src="src/Utils.js"></script>
<script type="text/javascript" src="src/LRS.js"></script>
<script type="text/javascript" src="src/Agent.js"></script>
<script type="text/javascript" src="src/Verb.js"></script>
<script type="text/javascript" src="src/Result.js"></script>
<script type="text/javascript" src="src/Score.js"></script>
<script type="text/javascript" src="src/Context.js"></script>
<script type="text/javascript" src="src/Activity.js"></script>
<script type="text/javascript" src="src/ActivityDefinition.js"></script>
<script type="text/javascript" src="src/Statement.js"></script>
<script type="text/javascript" src="src/State.js"></script>

API Documentation Generation
============================

Install yuidoc via `npm install -g yuidoc` and then from the base directory issue:

    yuidoc src/
