const wmvm = require('../src/wmvm.js'),
    util = require('util'),
    fs = require('fs'),
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
            "value": function(formatPtr, ptr1) {
                // super basic printf which you should never practically use
                this.stack.printStackTrace();
                let format = this.memoryAccessString(formatPtr),
                    formatArg;
                if (format.includes('%d')) {
                    formatArg = this.memoryAccessInt32(ptr1, true);
                } else if (format.includes('%s')) {
                    formatArg = this.memoryAccessString(ptr1, true);
                } else {
                    console.log("runtime: not printf-ing unknown format:");
                    console.log(format);
                    console.log(`(argPtr: ${formatArg})`);
                    console.log(`(called as: _printf(${formatPtr}, ${ptr1}))`);
                    return 0;
                }
                let out = util.format(format, formatArg);
                process.stdout.write(out);
                return 1;
            }
        }
    ];

let vm = new wmvm(fs.readFileSync('test/emcc.wasm'));
vm.addImports(imports)
    .enableDebug()
    .link()
    .runMain();