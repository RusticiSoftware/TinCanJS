/*!
    Copyright 2013 Rustici Software

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
(function () {
    var fs = require("fs"),
        config = {
            assertHttpRequestType: function (xhr, name) {
                var desc = "(not implemented) assertHttpRequestType: " + name;
                ok(true, desc);
            },
            loadBinaryFileContents: function (callback) {
                fs.readFile(
                    __dirname + "/../files/image.jpg",
                    function (err, data) {
                        var fileContents,
                            ab,
                            view,
                            i;

                        if (err) throw err;

                        if (typeof data.buffer === "undefined") {
                            ab = new ArrayBuffer(data.length);
                            view = new Uint8Array(ab);
                            for (i = 0; i < data.length; i += 1) {
                                view[i] = data[i];
                            }
                            fileContents = ab;
                        }
                        else {
                            fileContents = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
                        }
                        callback.call(null, fileContents);
                    }
                );
            },
            testAttachments: true
        };

    module.exports = config;
}());
