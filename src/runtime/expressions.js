const Binaryen = require('binaryen');

class MetaFunction {
    constructor(vm, name) {
        try {
            this.fptr = vm.module.getFunction(name);
        } catch(e) {
            vm.dbg('MetaFunction: failed to lookup function "' + name + '"');
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
        if (!this.bodyptr) {
            vm.dbg(`MetaFunction: Discovered import "${this.name}":`);
            vm.dbg(`\t- returns ${this.returnType} with params ${(this.parameterTypes.toString() || '(none)')}`);
            this.isImport = true;
            this.importModule = this.info.module;
            this.importBase = this.info.base;
            vm.dbg(`\t- from module "${this.importModule}" and base "${this.importBase}"`);
            let vimport = vm.lookupVirtualImport(this.importModule, this.name);
            if (vimport) {
                // Import found!
                vm.dbg(`MetaFunction: import "${this.name}" resolved successfully.`);
                this.importFunction = vimport.jsFunc;
            } else {
                vm.dbg(`MetaFunction: WARN: import "${this.name}" wasn't imported before linking! ignoring.`);
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
            rexpr.children[i].parent = rexpr;
        }
    }
    // Call operands
    if (rexpr.operands) {
        for (let i = 0; i < rexpr.operands.length; ++i) {
            rexpr.operands[i] = parse(rexpr.operands[i], vm);
            rexpr.operands[i].parent = rexpr;
        }
    }

    if (rexpr.condition) {
        rexpr.condition = parse(rexpr.condition, vm);
        rexpr.condition.parent = rexpr;
    }
    if (rexpr.ifTrue) {
        rexpr.ifTrue = parse(rexpr.ifTrue, vm);
        rexpr.ifTrue.parent = rexpr;
    }
    if (rexpr.ifFalse) {
        rexpr.ifFalse = parse(rexpr.ifFalse, vm);
        rexpr.ifFalse.parent = rexpr;
    }
    if (rexpr.body) {
        rexpr.body = parse(rexpr.body, vm);
        rexpr.body.parent = rexpr;
    }
    if (rexpr.left) {
        rexpr.left = parse(rexpr.left, vm);
        rexpr.left.parent = rexpr;
    }
    if (rexpr.right) {
        rexpr.right = parse(rexpr.right, vm);
        rexpr.right.parent = rexpr;
    }
    if (rexpr.ptr) {
        rexpr.ptr = parse(rexpr.ptr, vm);
        rexpr.ptr.parent = rexpr;
    }
    if (rexpr.target && typeof rexpr.target === 'number') {
        rexpr.target = parse(rexpr.target, vm);
        rexpr.target.parent = rexpr;
    }
    if (rexpr.target && typeof rexpr.target === 'string') {
        if (!vm.fnMap[rexpr.target]) {
            vm.dbg('parse: Discovered function: "' + rexpr.target + '"');
            vm.fnMap[rexpr.target] = new MetaFunction(vm, rexpr.target);
        } else {
            vm.dbg(`parse: Found already discovered function "${rexpr.target}"`);
        }
    }
    if (rexpr.value && typeof rexpr.value === 'number') {
        if (rexpr.id !== Binaryen.ConstId) {
            rexpr.value = parse(rexpr.value, vm);
            rexpr.value.parent = rexpr;
        }
    }

    return rexpr;
}
module.exports = {
    parse: parse,
    MetaFunction: MetaFunction
}