const Binaryen = require('binaryen');
let controlFlow = {};
controlFlow[Binaryen.BlockId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter;
    // vm.dbg(`interpreting blk "${ex.name}"`);
    // interpret children consecutively
    for (let i = 0; i < ex.children.length; ++i) {
        let child = ex.children[i];
        ip.interpret(child);
    }
}
controlFlow[Binaryen.IfId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        res = ip.interpret(ex.condition);
    if (!res) {
        vm.dbg("interpret/controlFlow if: WARN: interpret result doesn't exist! the value expression probably isnt supported.");
    }
}
module.exports = controlFlow;