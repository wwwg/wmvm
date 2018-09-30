const Binaryen = require('binaryen');
let controlFlow = {};
controlFlow[Binaryen.BlockId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        res;
    // vm.dbg(`interpreting blk "${ex.name}"`);
    // interpret children consecutively
    for (let i = 0; i < ex.children.length; ++i) {
        let child = ex.children[i];
        if (ex.isFnBody && vm.stack.currentFrame.isReturned) {
            // stop interpreting - this frame has returned
            vm.dbg(`controlFlow/block: Stop intrepreting function body - stack frame is returned`);
            return;
        }
        res = ip.interpret(child);
    }
    if (ex.isFnBody && !vm.stack.currentFrame.isReturned) {
        // Allow the last expression to fall through
        if (!res || (typeof res.value === 'undefined')) {
            vm.dbg(`controlFlow/block: last expression can't fall through, ignore`);
            return;
        }
        return res;
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
        if (!vm.loopMap[ex.name]) {
            break;
        }
    }
}
controlFlow[Binaryen.BreakId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter;
    if (ex.condition) {
        let res = ip.interpret(ex.condition);
        if (!res || (typeof res === 'undefined')) {
            vm.dbg(`controlFlow/break: WARN: break condition for "${ex.name}" has no result, I'll break anyway`);
            if (vm.loopMap[ex.name]) {
                vm.loopMap[ex.name] = false;
            } else {
                vm.dbg(`controlFlow/break: loop "${ex.name}" can't be broken!`);
            }
        }
        if (res.value) {
            // conditional break can happen
            vm.dbg(`controlFlow/break: conditional break loop "${ex.name}"`);
            vm.loopMap[ex.name] = false;
        }
    } else {
        // unconditionally break
        // disable loop on the loopMap
        vm.dbg(`controlFlow/break: unconditional break loop "${ex.name}"`);
        vm.loopMap[ex.name] = false;
    }
}
controlFlow[Binaryen.ReturnId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter;
    // todo: parse return expressions
}
module.exports = controlFlow;