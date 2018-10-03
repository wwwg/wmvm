const Binaryen = require('binaryen');
module.exports = class DynamicStackFrame {
    getLocal(index) {
        return this.localMap[index];
    }
    setLocal(index, value) {
        if (!this.localMap[index]) {
            console.log("CRITICAL: There was an attempt to set a local that doesn't exist, attempting to ignore.");
            return;
        } else {
            this.localMap[index].value = value;
        }
    }
    constructor(fn, args) {
        this.fn = fn;
        this.returnedValue = undefined;
        this.isReturned = false;
        this.arguments = args;
        if (!fn.isImport) {
            // map of local names to their values
            this.localMap = [];
            let localCount = fn.info.vars.length + fn.info.params.length,
                vars = fn.info.vars,
                params = fn.info.params;
            if (args.length !== params.length) {
                console.log(`wmvm/stackframe: argument mismatch! bad things will happen!`);
            }
            for (let i = 0; i < localCount; ++i) {
                if (i < params.length) {
                    this.localMap[i] = {
                        type: params[i],
                        value: args[i]
                    }
                } else {
                    this.localMap[i] = {
                        type: vars[i],
                        value: 0
                    }
                }
            }
        } else {
            this.localMap = null;
            this.isImport = true;
        }
    }
}