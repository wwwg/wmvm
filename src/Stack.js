// A better array designed for the vm's stack
module.exports = class VirtualStack extends Array {
    constructor(vm) {
        super();
        this.vm = vm;
    }
}