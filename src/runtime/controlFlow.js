const Binaryen = require('binaryen');
let controlFlow = {};
controlFlow[Binaryen.BlockId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        res;
    // Add/update this block to the blockMap 
    vm.blockMap[ex.name] = ex;
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
            vm.dbg(`controlFlow/call: operand #${i} for "${fn.name}" => ${res.value}`);
            callArgs.push(res.value);
        }
        vm.dbg(`controlFlow/call: call ${ex.target}() with ${ex.operands.length} arguments`);
        let retVal = ip.call(fn, callArgs);
        if (!retVal) {
            vm.dbg(`\t=> return void`);
            return;
        } else {
            vm.dbg(`\t=> return ${retVal.value}`);
            return retVal;
        }
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
    if (ex.value) {
        let res = ip.interpret(ex.value);
        if (!res || typeof res.value === 'undefined') {
            vm.dbg(`controlFlow/return: WARN: return value has no result, returning NULL`);
            vm.stack.currentFrame.returnedValue = 0x0;
            return {
                value: 0x0
            };
        }
        vm.dbg(`controlFlow/return: return stack frame of fn "${vm.stack.currentFrame.fn.name}" with retval "${res.value}"`);
        vm.stack.currentFrame.isReturned = true;
        vm.stack.currentFrame.returnedValue = res.value;
        return res;
    } else {
        vm.dbg(`controlFlow/return: returning with no value`);
        vm.stack.currentFrame.isReturned = true;
        vm.stack.currentFrame.returnedValue = undefined;
    }
}
controlFlow[Binaryen.NopId] = ex => {
    ex.vm.dbg('controlFlow/nop: nop!');
    // nops have a 0 value
    return {
        value: 0x0
    }
}
controlFlow[Binaryen.SwitchId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        valueRes = ip.interpret(ex.value),
        conditionRes = ip.interpret(ex.condition),
        topmostStackVar = vm.stack.currentFrame.localMap[(vm.stack.currentFrame.localMap.length - 1)];
    if (!topmostStackVar || typeof topmostStackVar.value === 'undefined') {
        vm.dbg(`controlFlow/switch: WARN: topmost stack variable doesn't exist! attempting to ignore.`);
        return;
    }
    let index = topmostStackVar.value,
        name;
    if (ex.names[index]) {
        // Jump to this name
        name = ex.names[index];
    } else {
        // Jump to default name
        name = ex.defaultName;
    }
    if (vm.blockMap[name]) {
        vm.dbg(`controlFlow/switch: jmp to "${name}"`);
        ip.jmp(name);
    } else {
        vm.dbg(`controlFlow/switch: WARN: can't jump to nonexistent block "${name}"`);
    }
}
controlFlow[Binaryen.CallIndirectId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter;
    vm.unimplemented(`call_indirect and tables aren't supported yet, ignoring call_indirect`);
}
module.exports = controlFlow;