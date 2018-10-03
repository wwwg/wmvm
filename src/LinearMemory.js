class LinearMemory extends Uint8Array {
    constructor(vm, initializer) {
        this.vm = vm;
        this.init = initializer;
    }
}
// 4 pages of memory by default
LinearMemory.INITIAL_MEMORY_SIZE = 64000 * 4;
LinearMemory.INITIAL_MEMORY_OFFSET = 1024;