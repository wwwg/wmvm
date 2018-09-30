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
        return;
    }
    // execute the actual conditional
    vm.dbg(`controlFlow/if: if(${res.value})`);
    if (res.value) {
        // ifTrue
        vm.dbg(`\t=> true`);
        let ifTrueRes = ip.interpret(ex.ifTrue);
        if (ifTrueRes && typeof ifTrueRes.value !== 'undefined') {
            return ifTrueRes;
        }
    } else {
        // ifFalse
        vm.dbg(`\t=> false`);
        if (ex.ifFalse) {
            let ifFalseRes = ip.interpret(ex.ifTrue);
            if (ifFalseRes && typeof ifFalseRes.value !== 'undefined') {
                return ifFalseRes;
            }
        } else {
            vm.dbg(`controlFlow/if: (ifFalse for conditional doesn't exist)`);
        }
    }
}
controlFlow[Binaryen.SelectId] = controlFlow[Binaryen.IfId];
controlFlow[Binaryen.CallId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter;
    let fn = vm.lookupFunction(ex.target);
    if (!fn) {
        vm.dbg(`controlFlow/call: CRITICAL: call failed on "${ex.target}", symbol doesn't point to a function!`);
        return;
    } else {
        vm.dbg(`controlFlow/call: interpret operands:`);
        let callArgs = [];
        for (let i = 0; i < ex.operands.length; ++i) {
            let operand = ex.operands[i], // is an expression
                res = ip.interpret(operand);
            if (!res) {
                vm.dbg(`controlFlow/call: CRITICAL: call failed on "${ex.target}", operand ${i} has no result`);
                return;
            }
            if (typeof res.value === 'undefined') {
                vm.dbg(`controlFlow/call: CRITICAL: call failed on "${ex.target}", operand ${i} has no value`);
                return;
            }
            vm.dbg(`\t=> ${res.value}`);
            callArgs.push(res.value);
        }
        vm.dbg(`controlFlow/call: call ${ex.target}() with ${ex.operands.length} arguments`);
        ip.call(fn, callArgs);
    }
}
controlFlow[Binaryen.LoopId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter;
    vm.dbg(`controlFlow/loop: initializing loop "${ex.name}"`);
    // enable the loop on the loopMap
    vm.loopMap[ex.name] = true;
    while (true) {
        // loops are infinite until broken
        ip.interpret(ex.body);
        // if the loop is disabled on the vm's map, it needs to break
        if (!vm.loopMap) {
            break;
        }
    }
}
controlFlow[Binaryen.BreakId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter;
}
module.exports = controlFlow;