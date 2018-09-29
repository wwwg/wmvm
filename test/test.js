const wmvm = require('../src/wmvm.js'),
    fs = require('fs'),
    imports = [
        {
            "module": "env",
            "name": "abortStackOverflow",
            "value": () => {
                console.log("runtime: abortStackOverflow called, ignoring");
                return 0;
            }
        }
    ];

let vm = new wmvm(fs.readFileSync('test/emcc.wasm'));
vm.addImports(imports)
    .link()
    .run();