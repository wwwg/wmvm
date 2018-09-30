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
            opSource *= -1;
            break;
        case Binaryen.AbsFloat32:
        case Binaryen.AbsFloat64:
            opSource = Math.abs(opSource);
            break;
        case Binaryen.CeilFloat32:
        case Binaryen.CeilFloat64:
            opSource = Math.ceil(opSource);
            break;
        case Binaryen.FloorFloat32:
        case Binaryen.FloorFloat64:
            opSource = Math.floor(opSource);
            break;
        case Binaryen.TruncFloat32:
        case Binaryen.TruncFloat64:
            opSource = Math.trunc(opSource);
            break;
        case Binaryen.SqrtFloat32:
        case Binaryen.SqrtFloat64:
            opSource = Math.sqrt(opSource);
            break;
        case Binaryen.EqZInt32: // Equals 0
        case Binaryen.EqZInt64:
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
            break;
        default:
            vm.dbg(`interpret/operations: unary: unknown unary operation ${opId}`);
            break;
    }
    return {
        value: opSource
    };
}
ops[Binaryen.BinaryId] = ex => {
    let vm = ex.vm,
        ip = ex.interpreter;
}
module.exports = ops;