const wmvm = require('../src/wmvm.js'),
    fs = require('fs'),
    getWasmString = (vm, ptr) => {
        let memory = vm.mem,
            i = ptr,
            out = '';
        while (i != 0) {
            out += String.fromCharCode(memory[i]);
            ++i;
        }
        return out;
    },
    imports = [
        {
            "module": "env",
            "name": "abortStackOverflow",
            "value": function(arg1) {
                console.log(`runtime: abortStackOverflow called, arg1 is ${arg1}`);
                console.log(this.stack.length);
                process.exit(0);
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
        },
        {
            "module": "env",
            "name": "_printf",
            "value": function(format, arg1) {
                console.log(`runtime: _printf(${arg1}, ${arg2})`);
                return 1;
            }
        }
    ];

let vm = new wmvm(fs.readFileSync('test/emcc.wasm'));
vm.addImports(imports)
    .link()
    .runMain();