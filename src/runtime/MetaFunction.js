const Binaryen = require('binaryen');
// a more useful function class
module.exports = class MetaFunction {
    constructor(fptr) {
        this.info = Binaryen.getFunctionInfo(fptr);
        this.basePtr = this.info.base;
    }
}