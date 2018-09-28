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
        let id = expr.id;
        expr.vm = this.vm;
        expr.interpreter = this;
        if (this.controlFlow[id]) {
            return this.controlFlow[id](expr);
        } else if (this.operations[id]) {
            return this.operations[id](expr);
        } else if (this.memio[id]) {
            return this.memio[id](expr);
        } else {
            this.vm.dbg(`WARN: I don't know how to interpret expression with id ${expr.id}`);
            return null;
        }
    }
    interpretFunction(fn) {
        if (!fn instanceof MetaFunction) {
            this.vm.dbg(`interpreter: I can't interpret a function that isn't a function!`);
            return 0;
        }
        this.vm.stack.pushFrame(fn);
        this.interpret(fn.body);
        // frame can now be disposed of
        let lastFrame = this.vm.currentFrame;
        let returnValue;
        if (lastFrame.returnedValue) {
            returnValue = lastFrame.returnedValue;
        }
        this.vm.stack.popFrame(fn);
        return returnValue;
    }
}
module.exports = ExpressionInterpreter;