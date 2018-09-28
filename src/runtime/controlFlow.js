const Binaryen = require('binaryen');
let controlFlow = {};
controlFlow[Binaryen.BlockId] = ex => {
    let vm = ex.vm;
    vm.dbg(`interpreting blk "${ex.name}"`);
}
module.exports = controlFlow;