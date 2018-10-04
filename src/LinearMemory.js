class LinearMemory extends Uint8Array {
    constructor(vm, initializer) {
        super();
        this.vm = vm;
        this.init = initializer;
        if (!initializer.mem || !initializer.ptr) {
            vm.dbg('LinearMemory/construct: Failed to find initial memory in module, ignoring');
        } else {
            vm.memPtrName = initializer.ptr;
            for (let i = 0; i < initializer.mem.length; ++i) {
                let byte = initializer.mem.charCodeAt(i);
                this[i + LinearMemory.INITIAL_MEMORY_OFFSET] = byte;
            }
            vm.dbg('LinearMemory/construct: Sucessfully set initial memory with pointer name "' + this.memPtrName + '"');
        }
    }
}
// 4 pages of memory by default
LinearMemory.INITIAL_MEMORY_SIZE = 64000 * 4;
LinearMemory.INITIAL_MEMORY_OFFSET = 1024;
module.exports = LinearMemory;