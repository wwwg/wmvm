const Binaryen = require('binaryen');
let ops = {};
ops[Binaryen.UnaryId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        opId = ex.op,
        res = ip.interpret(ex.value);
    if (!res) {
        vm.dbg("interpret/operations unary: WARN: interpret result doesn't exist! the value expression probably isnt supported.");
        return null;
    }
    if (typeof res.value === 'undefined') {
        vm.dbg("interpret/operations unary: WARN: interpret result value doesn't exist! the value expression probably isnt supported.");
        return null;
    }
    let opSource = res.value;
    switch (opId) {
        case Binaryen.NegFloat32:
        case Binaryen.NegFloat64:
            vm.dbg(`interpret/operations unary: ${opSource} * -1`);
            opSource *= -1;
            break;
        case Binaryen.AbsFloat32:
        case Binaryen.AbsFloat64:
            vm.dbg(`interpret/operations unary: abs(${opSource})`);
            opSource = Math.abs(opSource);
            break;
        case Binaryen.CeilFloat32:
        case Binaryen.CeilFloat64:
            vm.dbg(`interpret/operations unary: ceil(${opSource})`);
            opSource = Math.ceil(opSource);
            break;
        case Binaryen.FloorFloat32:
        case Binaryen.FloorFloat64:
            vm.dbg(`interpret/operations unary: floor(${opSource})`);
            opSource = Math.floor(opSource);
            break;
        case Binaryen.TruncFloat32:
        case Binaryen.TruncFloat64:
            vm.dbg(`interpret/operations unary: trunc(${opSource})`);
            opSource = Math.trunc(opSource);
            break;
        case Binaryen.SqrtFloat32:
        case Binaryen.SqrtFloat64:
            vm.dbg(`interpret/operations unary: sqrt(${opSource})`);
            opSource = Math.sqrt(opSource);
            break;
        case Binaryen.EqZInt32: // Equals 0
        case Binaryen.EqZInt64:
        vm.dbg(`interpret/operations unary: (${opSource} == 0)`);
            opSource = (opSource == 0);
            break;
        case Binaryen.ExtendSInt32:
        case Binaryen.ExtendUInt32:
        case Binaryen.TruncSFloat32ToInt64:
        case Binaryen.TruncUFloat32ToInt64:
        case Binaryen.TruncSFloat64ToInt64:
        case Binaryen.TruncUFloat64ToInt64:
        case Binaryen.ReinterpretFloat64:
        case Binaryen.WrapInt64:
        case Binaryen.TruncSFloat32ToInt32:
        case Binaryen.TruncUFloat32ToInt32:
        case Binaryen.TruncSFloat64ToInt32:
        case Binaryen.TruncUFloat64ToInt32:
        case Binaryen.ReinterpretFloat32:
        case Binaryen.ConvertSInt32ToFloat32:
        case Binaryen.ConvertUInt32ToFloat32:
        case Binaryen.ConvertSInt64ToFloat32:
        case Binaryen.ConvertUInt64ToFloat32:
        case Binaryen.DemoteFloat64:
        case Binaryen.ReinterpretInt32:
        case Binaryen.ConvertSInt32ToFloat64:
        case Binaryen.ConvertUInt32ToFloat64:
        case Binaryen.ConvertSInt64ToFloat64:
        case Binaryen.ConvertUInt64ToFloat64:
        case Binaryen.PromoteFloat32:
        case Binaryen.ReinterpretInt64:
            // Do nothing, these instructions are only useful in a strictly typed VM
            vm.dbg(`interpret/operations unary: type-strict op on "${opSource}", ignore`);
            break;
        default:
            vm.dbg(`interpret/operations unary: unknown unary operation ${opId}`);
            break;
    }
    vm.dbg(`interpret/operations unary: \t=> ${opSource}`);
    return {
        value: opSource
    };
}
ops[Binaryen.BinaryId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter,
        opId = ex.op,
        resl = ip.interpret(ex.left),
        resr = ip.interpret(ex.right);
    if (!resl) {
        vm.dbg("interpret/operations binary: WARN: interpret(left) result doesn't exist! the value expression probably isnt supported.");
        return null;
    }
    if (typeof resl.value === 'undefined') {
        vm.dbg("interpret/operations binary: WARN: interpret(left) result value doesn't exist! the value expression probably isnt supported.");
        return null;
    }
    if (!resr) {
        vm.dbg("interpret/operations binary: WARN: interpret(right) result doesn't exist! the value expression probably isnt supported.");
        return null;
    }
    if (typeof resr.value === 'undefined') {
        vm.dbg("interpret/operations binary: WARN: interpret(right) result value doesn't exist! the value expression probably isnt supported.");
        return null;
    }
}
module.exports = ops;