const StackFrame = require('./runtime/StackFrame');
// A better array designed for the vm's stack
module.exports = class VirtualStack extends Array {
    constructor(vm) {
        super();
        this.vm = vm;
    }
    pushFrame(fn) {
        this.vm.dbg(`stack: pushed stack frame for "${fn.name}"`);
        // Before a function is interpreted, it's added to the stack
        let frame = new StackFrame(fn);
        this.push(frame);
    }
    popFrame() {
        this.vm.dbg(`stack: popped stack frame for "${fn.name}"`);
        return this.pop();
    }
}