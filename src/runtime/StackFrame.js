const Binaryen = require('binaryen');
module.exports = class DynamicStackFrame {
    constructor(fn, vm) {
        this.fn = fn;
        this.vm = vm;
    }
}