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
    },
    {
        // NaN
    },
    {
        // Infinity
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