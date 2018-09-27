const Binaryen = require('binaryen');

class MetaFunction {
    constructor(vm, name) {
        try {
            this.fptr = vm.module.getFunction(name);
        } catch(e) {
            vm.dbg('failed to lookup function "' + name + '"');
            return;
        }
        this.exists = true;
        this.module = vm.module;
        this.info = Binaryen.getFunctionInfo(this.fptr);
        this.typeInfo = Binaryen.getFunctionTypeInfo(this.info.type);
        this.returnType = this.typeInfo.result;
        this.parameterTypes = this.typeInfo.params;
        this.name = this.info.name;
        this.bodyptr = this.info.body;
        this.ctx = {};
        if (!this.bodyptr) {
            vm.dbg(`Discovered import "${this.name}":`);
            vm.dbg(`\t- returns ${this.returnType} with params ${(this.parameterTypes.toString() || '(none)')}`);
            this.isImport = true;
            this.importModule = this.info.module;
            this.importBase = this.info.base;
            vm.dbg(`\t- from module "${this.importModule}" and base "${this.importBase}"`);
            let vimport = vm.lookupVirtualImport(this.importModule, this.name);
            if (vimport) {
                // Import found!
                vm.dbg(`import "${this.name}" resolved successfully.`);
                this.importFunction = vimport.jsFunc;
            } else {
                vm.dbg(`WARN: import "${this.name}" wasn't imported statically!`);
                this.importFunction = null;
            }
            return;
        }
        this.body = parse(this.bodyptr, vm);
    }
}

let parse = (expr, vm) => {
    let rexpr;
    if (typeof expr === 'number') {
        rexpr = Binaryen.getExpressionInfo(expr);
    } else {
        rexpr = expr;
    }
    // vm.dbg(rexpr);
    // block
    if (rexpr.children) {
        for (let i = 0; i < rexpr.children.length; ++i) {
            rexpr.children[i] = parse(rexpr.children[i], vm);
        }
    }
    // Call operands
    if (rexpr.operands) {
        for (let i = 0; i < rexpr.operands.length; ++i) {
            rexpr.operands[i] = parse(rexpr.operands[i], vm);
        }
    }

    if (rexpr.condition) 
        rexpr.condition = parse(rexpr.condition, vm);
    if (rexpr.ifTrue)
        rexpr.ifTrue = parse(rexpr.ifTrue, vm);
    if (rexpr.ifFalse)
        rexpr.ifFalse = parse(rexpr.ifFalse, vm);
    if (rexpr.body)
        rexpr.body = parse(rexpr.body, vm);
    if (rexpr.left)
        rexpr.left = parse(rexpr.left, vm);
    if (rexpr.right)
        rexpr.right = parse(rexpr.right, vm);
    if (rexpr.ptr)
        rexpr.ptr = parse(rexpr.ptr, vm);
    if (rexpr.target && typeof rexpr.target === 'number')
        rexpr.target = parse(rexpr.target, vm);
    if (rexpr.target && typeof rexpr.target === 'string') {
        if (!vm.fnMap[rexpr.target]) {
            vm.dbg('Discovered function: "' + rexpr.target + '"');
            vm.fnMap[rexpr.target] = new MetaFunction(vm, rexpr.target);
        } else {
            vm.dbg(`Found already discovered function "${rexpr.target}"`);
        }
    }
    if (rexpr.value && typeof rexpr.value === 'number') {
        if (rexpr.id !== Binaryen.ConstId)
            rexpr.value = parse(rexpr.value, vm);
    }

    return rexpr;
}
module.exports = {
    parse: parse,
    MetaFunction: MetaFunction
}