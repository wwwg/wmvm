const StackFrame = require('./runtime/StackFrame');
// A better array designed for the vm's stack
module.exports = class VirtualStack extends Array {
    constructor(vm) {
        super();
        this.vm = vm;
        this.currentFrame = null;
        this.history = []; // a chronological list of every stack frame ever called
    }
    pushFrame(fn, args = null) {
        this.vm.dbg(`stack: pushed stack frame for "${fn.name}"`);
        // Before a function is interpreted, it's added to the stack
        let frame = new StackFrame(fn, args);
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
    printStackTrace() {
        this.vm.dbg(`stack: stack trace:`);
        this.vm.dbg(`\t${this.length} frames`);
        for (let i = 0; i < this.length; ++i) {
            let frame = this[i];
            this.vm.dbg(`\tframe #${i}:`);
            this.vm.dbg(`\t\tfunction: "${frame.fn.name}"`);
            this.vm.dbg(`\t\tisImport: ${frame.fn.isImport}`);
            this.vm.dbg(`\t\ttotal locals: ${frame.fn.info.vars.length + frame.fn.info.params.length}`);
            this.vm.dbg(`\t\tparams: ${frame.fn.info.params.length}`);
            this.vm.dbg(`\t\is returned: ${frame.isReturned}`);
            this.vm.dbg(`\t\treturn value: ${frame.returnedValue}`);
            this.vm.dbg(`\t\targuments: ${(frame.arguments || '(none)')}`);
        }
    }
    printHistoryTrace() {
        this.vm.dbg(`stack: history trace:`);
        this.vm.dbg(`\t${this.history.length} frames`);
        for (let i = 0; i < this.history.length; ++i) {
            let frame = this.history[i];
            this.vm.dbg(`\tframe #${i}:`);
            this.vm.dbg(`\t\tfunction: "${frame.fn.name}"`);
            this.vm.dbg(`\t\tisImport: ${frame.fn.isImport}`);
            this.vm.dbg(`\t\ttotal locals: ${frame.fn.info.vars.length + frame.fn.info.params.length}`);
            this.vm.dbg(`\t\tparams: ${frame.fn.info.params.length}`);
            this.vm.dbg(`\t\is returned: ${frame.isReturned}`);
            this.vm.dbg(`\t\treturn value: ${frame.returnedValue}`);
            this.vm.dbg(`\t\targuments: ${(frame.arguments || '(none)')}`);
        }
    }
}