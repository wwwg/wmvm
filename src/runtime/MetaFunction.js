const Binaryen = require('binaryen'),
    parse = require('../exprParser.js');
// a more useful function class
module.exports = class MetaFunction {
    constructor(mod, name) {
        try {
            this.fptr = mod.getFunction(name);
        } catch(e) {
            mod.dbg('failed to lookup function "' + name + '"');
            return;
        }
        this.info = Binaryen.getFunctionInfo(this.fptr);
        this.bodyptr = this.info.body;
        this.body = parse(this.bodyptr);
    }
}