// A standalone runtime library for wasm binaries
// All Emscripten-compiled libraries require Emscripten's runtime library to work, it's usually provided in the "glue" file Emscripten generates.
const ABORT = function(code) {
    console.warn(`ABORT(${abortValue})`);
    this.pauseExecution();
}, abortStackOverflow = function(code) {
    console.warn(`Emscripten runtime: abortStackOverflow(${code}) called, something horrible has happened`);
    ABORT.apply(this, arguments);
}, importTable = [
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
        // tempDoublePtr
    },
    {
        // _printf
    }
];
module.exports = importTable;