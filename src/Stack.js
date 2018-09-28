const StackFrame = require('./runtime/StackFrame');
// A better array designed for the vm's stack
module.exports = class VirtualStack extends Array {
    constructor(vm) {
        super();
        this.vm = vm;
        this.currentFrame = null;
    }
    pushFrame(fn) {
        this.vm.dbg(`stack: pushed stack frame for "${fn.name}"`);
        // Before a function is interpreted, it's added to the stack
        let frame = new StackFrame(fn);
        this.push(frame);
        this.currentFrame = this.top();
    }
    popFrame() {
        this.vm.dbg(`stack: popped stack frame for "${this.currentFrame.fn.name}"`);
        let ret = this.pop();
        this.currentFrame = this.top();
        return ret;
    }
    top() {
        return this[this.length - 1];
    }
}