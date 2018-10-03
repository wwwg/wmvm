// A standalone runtime library for wasm binaries
// All Emscripten-compiled libraries require Emscripten's runtime library to work, it's usually provided in the "glue" file Emscripten generates.
const fs = require('fs'),
    util = require('util');

const ABORT = function(code) {
    console.warn(`ABORT(${abortValue})`);
    this.pauseExecution();
}, abortStackOverflow = function(code) {
    console.warn(`Emscripten runtime: abortStackOverflow(${code}) called, something horrible has happened`);
    ABORT.apply(this, arguments);
}, printf = function(...args) {
    this.dumpMemory(1024, 30);
    // super basic printf for testing which you should never practically use
    console.log(`called as: _printf(0x${(args[0]).toString(16)}, 0x${(args[1]).toString(16)})`);
    this.stack.printStackTrace();
    let format = this.memoryAccessString(args[0]),
        formatArg;
    if (format.includes('%d')) {
        formatArg = this.memoryAccessInt32(args[1], true);
    } else if (format.includes('%s')) {
        formatArg = this.memoryAccessString(args[1], true);
    } else {
        console.log("runtime: not printf-ing unknown format:");
        console.log(format);
        // this.dumpMemory(1024, 30);
        return 0;
    }
    let out = util.format(format, formatArg);
    process.stdout.write(out);
    return 1;
},
importTable = [
    {
        // abortStackOverflow
        "module": "env",
        "name": "abortStackOverflow",
        "value": abortStackOverflow
    },
    {
        // ABORT
        "module": "env",
        "name": "ABORT",
        "value": ABORT
    },
    {
        // NaN
        "module": "global",
        "name": "NaN",
        "value": NaN
    },
    {
        // Infinity
        "module": "global",
        "name": "Infinity",
        "value": Infinity
    },
    {
        // DYNAMICTOP_PTR
        // dynamic area handled by sbrk
        "module": "env",
        "name": "DYNAMICTOP_PTR",
        "value": 0x0
    },
    {
        // STACKTOP
        // pointer to the top of the stack
        "module": "env",
        "name": "STACKTOP",
        "value": 0x0
    },
    {
        // STACK_MAX
        // max size of the stack
        "module": "env",
        "name": "STACK_MAX",
        "value": 5242880
    },
    {
        // tempDoublePtr
        "module": "env",
        "name": "tempDoublePtr",
        "value": (1024 + 5504)
    },
    {
        // memoryBase
        // address where globals begin
        "module": "env",
        "name": "memoryBase",
        "value": 1024
    },
    {
        // printf
        // todo : write a real printf function
        "module": "env",
        "name": "_printf",
        "value": printf
    }
];
module.exports = importTable;