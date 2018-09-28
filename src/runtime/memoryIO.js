const Binaryen = require('binaryen');
let memio = {};
memio[Binaryen.GetLocalid] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        frame = vm.stack.currentFrame,
        local = frame.getLocal(ex.index);
    if (!local) {
        vm.dbg("WARN: getLocal was called on a local that doesn't exist. Something is terribly wrong.");
        return {
            type: 0,
            value: 0
        }
    } else {
        local.isGetLocal = true;
        return local;
    }
}
module.exports = memio;