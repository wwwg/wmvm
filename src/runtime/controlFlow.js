const Binaryen = require('binaryen');
let controlFlow = {};
controlFlow[Binaryen.BlockId] = ex => {
    let vm = ex.vm;
    vm.dbg(`interpreting blk "${this.name}"`);
}
module.exports = controlFlow;