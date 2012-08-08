#!/bin/sh

echo "Compiling";
java -jar ../vendor/closure-compiler/compiler.jar --js TCDriver.js --js_output_file ../build/TCDriver.js;
echo "Done";
