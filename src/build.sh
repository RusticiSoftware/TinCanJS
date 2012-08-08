#!/bin/sh

echo "Copying raw version";
cp TCDriver.js ../build/TCDriver.js;
echo "Creating minified version";
java -jar ../vendor/closure-compiler/compiler.jar --js TCDriver.js --js_output_file ../build/TCDriver-min.js;
echo "Done";
