const Binaryen = require('binaryen');
let ops = {};
ops[Binaryen.UnaryId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter;
}
ops[Binaryen.BinaryId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter;
}
module.exports = ops;