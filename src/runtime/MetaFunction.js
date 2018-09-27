const Binaryen = require('binaryen'),
    parse = require('../exprParser.js');
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
        this.body = parse(this.bodyptr);
    }
}