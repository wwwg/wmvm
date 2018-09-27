const Binaryen = require('binaryen');
module.exports = class DynamicStackFrame {
    constructor(fn) {
        this.fn = fn;
    }
}