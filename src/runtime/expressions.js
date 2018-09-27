const Binaryen = require('binaryen');

class MetaFunction {
    constructor(mod, name) {
        try {
            this.fptr = mod.getFunction(name);
        } catch(e) {
            mod.dbg('failed to lookup function "' + name + '"');
            return;
        }
        this.module = mod;
        this.info = Binaryen.getFunctionInfo(this.fptr);
        this.typeInfo = Binaryen.getFunctionTypeInfo(this.info.type);
        this.returnType = this.typeInfo.result;
        this.parameterTypes = this.typeInfo.params;
        this.name = this.info.name;
        this.bodyptr = this.info.body;
        if (!this.bodyptr) {
            mod.dbg(`Discovered import "${this.name}":`);
            mod.dbg(`\t- returns ${this.returnType} with params ${(this.parameterTypes.toString() || '(none)')}`);
            this.isImport = true;
            this.importModule = this.info.module;
            this.importBase = this.info.base;
            mod.dbg(`\t- from module "${this.importModule}" and base "${this.importBase}`);
            return;
        }
        this.body = parse(this.bodyptr, mod);
    }
}

let parse = (expr, mod) => {
    let rexpr;
    if (typeof expr === 'number') {
        rexpr = Binaryen.getExpressionInfo(expr);
    } else {
        rexpr = expr;
    }
    // mod.dbg(rexpr);
    // block
    if (rexpr.children) {
        for (let i = 0; i < rexpr.children.length; ++i) {
            rexpr.children[i] = parse(rexpr.children[i], mod);
        }
    }
    // Call operands
    if (rexpr.operands) {
        for (let i = 0; i < rexpr.operands.length; ++i) {
            rexpr.operands[i] = parse(rexpr.operands[i], mod);
        }
    }

    if (rexpr.condition) 
        rexpr.condition = parse(rexpr.condition, mod);
    if (rexpr.ifTrue)
        rexpr.ifTrue = parse(rexpr.ifTrue, mod);
    if (rexpr.ifFalse)
        rexpr.ifFalse = parse(rexpr.ifFalse, mod);
    if (rexpr.body)
        rexpr.body = parse(rexpr.body, mod);
    if (rexpr.left)
        rexpr.left = parse(rexpr.left, mod);
    if (rexpr.right)
        rexpr.right = parse(rexpr.right, mod);
    if (rexpr.ptr)
        rexpr.ptr = parse(rexpr.ptr, mod);
    if (rexpr.target && typeof rexpr.target === 'number')
        rexpr.target = parse(rexpr.target, mod);
    if (rexpr.target && typeof rexpr.target === 'string') {
        if (!mod._fnMap[rexpr.target]) {
            mod.dbg('Discovered function: "' + rexpr.target + '"');
            mod._fnMap[rexpr.target] = new MetaFunction(mod, rexpr.target);
        } else {
            mod.dbg(`Found already discovered function "${rexpr.target}"`);
        }
    }
    if (rexpr.value && typeof rexpr.value === 'number') {
        if (rexpr.id !== Binaryen.ConstId)
            rexpr.value = parse(rexpr.value, mod);
    }

    return rexpr;
}
module.exports = {
    parse: parse,
    MetaFunction: MetaFunction
}