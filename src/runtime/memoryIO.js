const Binaryen = require('binaryen');
let memio = {};
memio[Binaryen.GetLocalid] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        frame = vm.stack.currentFrame,
        local = frame.getLocal(ex.index);
    if (typeof local === 'undefined') {
        vm.dbg("interpret: WARN: getLocal was called on a local that doesn't exist. Something is terribly wrong.");
        return {
            type: 0,
            value: 0
        }
    } else {
        local.isGetLocal = true;
        vm.dbg(`interpret/memio: get_local "${ex.index}"`);
        return local;
    }
}
memio[Binaryen.GetGlobalId] = ex => {
    let vm = ex.vm,
        globalName = ex.name;
    if (!(typeof vm.globals[globalName] === 'undefined')) {
        vm.dbg(`interpret/memio: get_global "${globalName}"`);
        return {
            type: (vm.globals[globalName].type || 1),
            value: vm.globals[globalName].value
        }
    } else {
        vm.dbg(`interpret: WARN: get_global was called on "${globalName}", which doesn't exist, returning NULL.`);
        return {
            type: 0,
            value: 0
        }
    }
}
memio[Binaryen.SetLocalId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        frame = vm.stack.currentFrame;
    if (ex.isTee) {
        // todo: support this
        vm.dbg("interpret: WARN: encountered unsupported tee SetLocal. ignoring.");
    }
    let res = ip.interpret(ex.value);
    if (!res) {
        vm.dbg("interpret/memio set_local: WARN: interpret result doesn't exist! the value expression probably isnt supported.");
        frame.setLocal(ex.index, 0x0);
        return;
    }
    if (typeof res.value === 'undefined') {
        vm.dbg("interpret/memio set_local: WARN: interpret result doesn't have a value, I can't set a local! setting it to NULL");
        frame.setLocal(ex.index, 0x0);
        return;
    }
    vm.dbg(`interpret/memio: set_local "${ex.index}" => ${res.value}`);
    frame.setLocal(ex.index, res.value);
}
memio[Binaryen.SetGlobalId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        setName = ex.name,
        result = ip.interpret(ex.value);
    if (!result || typeof result.value === 'undefined') {
        vm.dbg("interpret/memio set_global: WARN: interpret result doesn't exist! the value expression probably isnt supported, setting to NULL");
        vm.globals[setName] = 0x0;
        return;
    } else {
        if (vm.globals[globalName]) {
            vm.dbg(`interpret/memio: set_global "${globalName}" => ${result.value}`);
            vm.globals[globalName].value = result.value;
        } else {
            vm.dbg(`interpret: WARN: set_global was called on "${globalName}", which doesn't exist. ignoring.`);
            return;
        }
    }
}
memio[Binaryen.ConstId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter;
    if (typeof ex.value === 'number') {
        vm.dbg(`interpret/memio: const val => ${ex.value}`);
        return {
            value: ex.value
        };
    } else if (ex.value.low) {
        vm.dbg(`interpret/memio: const low => ${ex.value.low}`);
        return {
            value: ex.value.low
        };
    } else if (ex.value.high) {
        vm.dbg(`interpret/memio: const high => ${ex.value.high}`);
        return {
            value: ex.value.high
        };
    } else {
        vm.dbg(`interpret/memio: const: WARN: unknown const value`);
        return;
    }
}
module.exports = memio;