const wmvm = require('../src/wmvm.js'),
    fs = require('fs'),
    imports = [
        {
            "module": "env",
            "name": "abortStackOverflow",
            "value": arg1 => {
                console.log(`runtime: abortStackOverflow called, arg1 is ${arg1}`);
                return 0;
            }
        },
        {
            "module": "env",
            "name": "ABORT",
            "value": () => {
                console.log("runtime: ABORT called, ignoring for debugging purposes");
                return 1;
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
        },
        {
            "module": "env",
            "name": "DYNAMICTOP_PTR",
            "value": 0x0
        },
        {
            "module": "env",
            "name": "tempDoublePtr",
            "value": 0.0
        }
    ];

let vm = new wmvm(fs.readFileSync('test/emcc.wasm'));
vm.addImports(imports)
    .link()
    .run();