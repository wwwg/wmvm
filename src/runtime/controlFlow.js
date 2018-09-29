const Binaryen = require('binaryen');
let controlFlow = {};
controlFlow[Binaryen.BlockId] = ex => {
    let vm = ex.vm;
    let ip = ex.interpreter;
    // vm.dbg(`interpreting blk "${ex.name}"`);
    // interpret children consecutively
    for (let i = 0; i < ex.children.length; ++i) {
        let child = ex.children[i];
        ip.interpret(child);
    }
}
module.exports = controlFlow;