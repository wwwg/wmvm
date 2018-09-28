const StackFrame = require('./runtime/StackFrame');
// A better array designed for the vm's stack
module.exports = class VirtualStack extends Array {
    constructor(vm) {
        super();
        this.vm = vm;
    }
    pushFrame(fn) {
        // Before a function is interpreted, it's added to the stack
        let frame = new StackFrame(fn);
        this.push(frame);
    }
    popFrame() {
        return this.pop();
    }
}