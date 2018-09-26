const Binaryen = require('binaryen'),
    MetaBlock = require('./MetaBlock');
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
        this.bodyptr = this.info.body;
        this.bodyInfo = Binaryen.getExpressionInfo(this.bodyptr);
        this.body = new MetaBlock(this.bodyInfo);
    }
}