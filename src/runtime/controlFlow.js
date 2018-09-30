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
        vm.dbg("controlFlow/if: WARN: interpret result doesn't exist! the value expression probably isnt supported.");
    }
    if (typeof res.value === 'undefined') {
        vm.dbg("controlFlow/if: WARN: interpret result value doesn't exist! the value expression probably isnt supported.");
        return null;
    }
    // execute the actual conditional
    if (res.value) {
        // ifTrue
        let ifTrueRes = ip.interpret(ex.ifTrue);
        if (ifTrueRes && typeof ifTrueRes.value !== 'undefined') {
            return ifTrueRes;
        }
    } else {
        // ifFalse
        if (ex.ifFalse) {
            let ifFalseRes = ip.interpret(ex.ifTrue);
            if (ifFalseRes && typeof ifFalseRes.value !== 'undefined') {
                return ifFalseRes;
            }
        }
    }
}
module.exports = controlFlow;