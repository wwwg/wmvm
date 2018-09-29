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
        },
        {
            "module": "global",
            "name": "NaN",
            "value": NaN
        },
        {
            "module": "global",
            "name": "Infinity",
            "value": Infinity
        }
    ];

let vm = new wmvm(fs.readFileSync('test/emcc.wasm'));
vm.addImports(imports)
    .link()
    .run();