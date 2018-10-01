const Binaryen = require('binaryen'),
    MetaFunction = require('./expressions').MetaFunction,
    controlFlow = require('./controlFlow'),
    operations = require('./operations'),
    memio = require("./memoryIO");
class ExpressionInterpreter {
    constructor(vm) {
        this.vm = vm;
        // import expression interpreter maps
        this.controlFlow = controlFlow;
        this.operations = operations;
        this.memio = memio;
    }
    interpret(expr) {
        if (!expr) {
            this.vm.dbg(`interpret: expression doesn't exist, ignoring`);
            return;
        }
        this.vm.ip = expr;
        if (this.vm.paused) {
            this.vm.dbg(`interpret: haulting execution: vm is paused`);
            return;
        }
        let id = expr.id;
        // this.vm.dbg(`interpret: interpret(${id})`);
        expr.vm = this.vm;
        expr.interpreter = this;
        if (this.vm.stack.currentFrame.isReturned) {
            // stop interpreting - this frame has returned
            this.vm.dbg(`interpret: Stop intrepreting function body - stack frame is returned`);
            return;
        }
        if (this.controlFlow[id]) {
            return this.controlFlow[id](expr);
        } else if (this.operations[id]) {
            return this.operations[id](expr);
        } else if (this.memio[id]) {
            return this.memio[id](expr);
        } else {
            this.vm.dbg(`interpret: WARN: I don't know how to interpret expression with id ${expr.id}`);
            return;
        }
    }
    jmp(blkName) {
        if (!this.vm.blockMap[blkName]) {
            this.vm.dbg(`interpret/jmp: can't jmp to block "${blkName}" - doesn't exist`);
            return;
        }
        this.interpret(this.vm.blockMap[blkName]);
    }
    call(fn, args = []) {
        if (!fn instanceof MetaFunction) {
            this.vm.dbg(`interpret: I can't interpret a function that isn't a function!`);
            return 0;
        }
        if (fn.hasBreakpoint) {
            this.vm.dbg(`function breakpoint hit at "${fn.name}"`);
            this.vm.paused = true;
            return;
        }
        if (!fn.isImport) {
            this.vm.stack.pushFrame(fn, args);
            fn.body.isFnBody = true;
            let fallthroughStatement = this.interpret(fn.body);
            // frame can now be disposed of
            let returnValue;
            if (typeof this.vm.stack.currentFrame.returnedValue !== 'undefined') {
                returnValue = this.vm.stack.currentFrame.returnedValue;
            } else if (fallthroughStatement) {
                // If there is no return value a statement could have fell through
                returnValue = fallthroughStatement;
            }
            // add to stack history - for debugging
            this.vm.stack.history.push(this.vm.stack.currentFrame);
            // pop the frame
            this.vm.stack.popFrame(fn);
            return {
                type: fn.info.result,
                value: returnValue
            };
        } else {
            let importReturn;
            this.vm.stack.pushFrame(fn, args);
            if (fn.importFunction) {
                // Call the imported javascript function
                importReturn = fn.importFunction.apply(this.vm, args);  
            } else {
                this.vm.dbg(`interpret/call: CRITICAL: I can't call a non-existent import! attempting to ignore...`);
                return;
            }
            this.vm.stack.history.push(this.vm.stack.currentFrame);
            this.vm.stack.popFrame(fn);
            if (typeof importReturn !== 'undefined') {
                return {
                    value: importReturn
                }
            }
        }
    }
}
module.exports = ExpressionInterpreter;