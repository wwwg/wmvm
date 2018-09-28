const Binaryen = require('binaryen');
module.exports = class DynamicStackFrame {
    constructor(fn) {
        this.fn = fn;
        // map of local names to their values
        this.localMap = {};
    }
}