const Binaryen = require('binaryen');
let memio = {};
memio[Binaryen.GetLocalId] = ex => {
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
        vm.dbg(`memio/get_local local_${ex.index} is ${local.value}`);
        return local;
    }
}
memio[Binaryen.GetGlobalId] = ex => {
    let vm = ex.vm,
        globalName = ex.name;
    if (!(typeof vm.globals[globalName] === 'undefined')) {
        vm.dbg(`memio/get_global global_${globalName} is ${vm.globals[globalName].value}`);
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
        vm.dbg("memio/set_local WARN: interpret result doesn't exist! the value expression probably isnt supported.");
        frame.setLocal(ex.index, 0x0);
        return;
    }
    if (typeof res.value === 'undefined') {
        vm.dbg("memio/set_local: WARN: interpret result doesn't have a value, I can't set a local! setting it to NULL");
        frame.setLocal(ex.index, 0x0);
        return;
    }
    vm.dbg(`memio/set_local: local_${ex.index} = ${res.value}`);
    frame.setLocal(ex.index, res.value);
}
memio[Binaryen.SetGlobalId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        globalName = ex.name,
        result = ip.interpret(ex.value);
    if (!result || typeof result.value === 'undefined') {
        vm.dbg("memio/set_global: WARN: interpret result doesn't exist! the value expression probably isnt supported, setting to NULL");
        vm.globals[globalName] = 0x0;
        return;
    } else {
        if (vm.globals[globalName]) {
            vm.dbg(`memio/set_global: global_${globalName} = ${result.value}`);
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
        vm.dbg(`memio/const: val => ${ex.value}`);
        return {
            value: ex.value
        };
    } else if (typeof ex.value.low !== 'undefined') {
        vm.dbg(`memio/const: low => ${ex.value.low}`);
        return {
            value: ex.value.low
        };
    } else if (typeof ex.value.high !== 'undefined') {
        vm.dbg(`memio/const: high => ${ex.value.high}`);
        return {
            value: ex.value.high
        };
    } else {
        vm.dbg(`memio/const: WARN: unknown const value`);
        console.log(ex.value);
        return;
    }
}
memio[Binaryen.LoadId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        offset = ex.offset,
        size = ex.bytes,
        ptrRes = ip.interpret(ex.ptr),
        loadedBytes;
    if (!ptrRes || (typeof ptrRes.value === 'undefined')) {
        vm.dbg("memio/load: WARN: interpret result doesn't exist! the value expression probably isnt supported, setting to NULL");
    }
    let actualOffset = ptrRes.value;
    vm.dbg(`memio/load: loading 0x${size.toString(16)} bytes from offset 0x${actualOffset.toString(16)} / isSigned: ${ex.isSigned}`);
    let view = new DataView(vm.mem.buffer, actualOffset, size);
    switch (size) {
        case 1:
            if (ex.isSigned) {
                loadedBytes = view.getInt8(0, true);
            } else {
                loadedBytes = view.getUint8(0, true);
            }
            break;
        case 2:
            if (ex.isSigned) {
                loadedBytes = view.getInt16(0, true);
            } else {
                loadedBytes = view.getUint16(0, true);
            }
            break;
        case 4:
            if (ex.isSigned) {
                loadedBytes = view.getInt32(0, true);
            } else {
                loadedBytes = view.getUint32(0, true);
            }
            break;
        case 8:
            loadedBytes = view.getFloat64(0, true);
            break;
    }
    vm.dbg(`memio/load: loaded 0x${loadedBytes.toString(16)} from pointer 0x${actualOffset.toString(16)}`);
    return {
        value: loadedBytes
    }
}
memio[Binaryen.StoreId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        size = ex.bytes,
        ptrRes = ip.interpret(ex.ptr),
        valueRes = ip.interpret(ex.value);
    if (!ptrRes || (typeof ptrRes.value === 'undefined')) {
        vm.dbg("memio/store: WARN: interpret result doesn't exist! the value expression probably isnt supported, setting to NULL");
        return;
    }
    if (!valueRes || (typeof valueRes.value === 'undefined')) {
        vm.dbg("memio/store: WARN: interpret result doesn't exist! the value expression probably isnt supported, setting to NULL");
        return;
    }
    let vmPtr = ptrRes.value,
        storeData = valueRes.value,
        view = new DataView(vm.mem.buffer, vmPtr, size);
    vm.dbg(`memio/store: storing ${size} bytes at virtual memory offset 0x${vmPtr.toString(16)} / data 0x${storeData.toString(16)} / align ${ex.align} / raw ptr 0x${ptrRes.value.toString(16)}`);
    switch (size) {
        case 1:
            view.setUint8(0, storeData, true);
            break;
        case 2:
            view.setUint16(0, storeData, true);
            break;
        case 4:
            view.setUint32(0, storeData, true);
            break;
        case 8:
            view.setFloat64(0, storeData, true);
            break;
    }
}
memio[Binaryen.DropId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        res = ip.interpret(ex.value);
    if (!res || (typeof res.value === 'undefined')) {
        vm.dbg("memio/drop: drop result doesn't exist, ignore");
        return;
    }
    vm.dbg(`memio/drop: dropped value ${res.value}`);
    return res;
}
module.exports = memio;