const Binaryen = require('binaryen');
module.exports = class DynamicStackFrame {
    constructor(fn) {
        this.fn = fn;
        if (!fn.isImport) {
            // map of local names to their values
            this.localMap = {};
            let vars = fn.info.vars;
            for (let i = 0; i < vars.length; ++i) {
                this.localMap[i] = {
                    type: vars[i],
                    value: 0
                }
            }
        } else {
            this.localMap = null;
            this.isImport = true;
        }
    }
}