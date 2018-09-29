const Binaryen = require('binaryen');
let memio = {};
memio[Binaryen.GetLocalid] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        frame = vm.stack.currentFrame,
        local = frame.getLocal(ex.index);
    if (!local) {
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
    if (vm.globals[globalName]) {
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
        vm.dbg("interpret: WARN: interpret result doesn't exist! the value expression probably isnt supported.");
        frame.setLocal(ex.index, 0x0);
        return;
    }
    if (!res.value) {
        vm.dbg("interpret: WARN: interpret result doesn't have a value, I can't set a local! setting it to NULL");
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
    if (!result || !result.value) {
        vm.dbg("interpret: WARN: interpret result doesn't exist! the value expression probably isnt supported, setting to NULL");
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
module.exports = memio;