const Binaryen = require('binaryen'),
    MetaFunction = require('./expressions').MetaFunction;
class ExpressionInterpreter {
    constructor(vm) {
        this.vm = vm;
        // import expression interpreter maps
        this.controlFlow = require('./controlFlow');
        this.operations = require('./operations');
        this.memio = require("./memIO");
    }
    interpret(expr) {
        let id = expr.id;
        if (this.controlFlow[id]) {
            return this.controlFlow[id](expr);
        } else if (this.operations[id]) {
            return this.operations[id](expr);
        } else if (this.memio[id]) {
            return this.memio[id](expr);
        } else {
            this.vm.dbg("WARN: I don't know how to interpret an expression:");
            this.vm.dbg(expr);
            return null;
        }
    }
    interpretFunction(fn) {
        if (!fn instanceof MetaFunction) {
            this.vm.dbg(`interpreter: I can't interpret a function that isn't a function!`);
            return 0;
        }
    }
}
module.exports = ExpressionInterpreter;