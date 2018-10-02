// A standalone runtime library for wasm binaries
// All Emscripten-compiled libraries require Emscripten's runtime library to work, it's usually provided in the "glue" file Emscripten generates.
module.exports = [
    {
        // abortStackOverflow
        "module": "env",
        "name": "abortStackOverflow",
        "value": function(abortValue) {
            console.warn(`Emscripten runtime: a stack overflow has occured`);
            console.warn(`abort(${abortValue})`);
            this.pauseExecution();
        }
    },
    {
        // ABORT
        "module": "env",
        "name": "ABORT",
        "value": function(abortValue) {
            console.warn(`Emscripten runtime: ABORT() called:`);
            console.warn(`ABORT(${abortValue})`);
            this.pauseExecution();
        }
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
    },
    {
        // tempDoublePtr
    },
    {
        // _printf
    }
]