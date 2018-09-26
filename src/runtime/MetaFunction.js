const Binaryen = require('binaryen');
// a more useful function class
module.exports = class MetaFunction {
    constructor(module, name) {
        try {
            this.fptr = module.getFunction(name);
        } catch(e) {
            console.log('failed to lookup function "' + name + '"');
            return;
        }
        this.info = Binaryen.getFunctionInfo(this.fptr);
        console.log(this.info);
        this.bodyptr = this.info.body;
        this.body = Binaryen.getExpressionInfo(this.bodyptr);
    }
}