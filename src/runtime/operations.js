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
    let out = 0,
        left = resl.value,
        right = resr.value;
    switch (opId) {
        case Binaryen.AddInt32:
        case Binaryen.AddInt64:
        case Binaryen.AddFloat32:
        case Binaryen.AddFloat64:
            vm.dbg("interpret/operations binary: add(l,r)");
            out = left + right;
            break;
        case Binaryen.SubInt32:
        case Binaryen.SubInt64:
        case Binaryen.SubFloat32:
        case Binaryen.SubFloat64:
            vm.dbg("interpret/operations binary: sub(l,r)");
            out = left - right;
            break;
        case Binaryen.XorInt64:
        case Binaryen.XorInt32:
            vm.dbg("interpret/operations binary: xor(l,r)");
            out = left ^ right;
            break;
        case Binaryen.OrInt64:
        case Binaryen.OrInt32:
            vm.dbg("interpret/operations binary: or(l,r)");
            out = left || right;
            break;
        case Binaryen.MulInt32:
        case Binaryen.MulInt64:
        case Binaryen.MulFloat32:
        case Binaryen.MulFloat64:
            vm.dbg("interpret/operations binary: mul(l,r)");
            out = left * right;
            break;
        case Binaryen.EqInt32:
        case Binaryen.EqInt64:
        case Binaryen.EqFloat32:
        case Binaryen.EqFloat64:
            vm.dbg("interpret/operations binary: (l == r)");
            out = left == right;
            break;
        case Binaryen.NeInt32:
        case Binaryen.NeInt64:
        case Binaryen.NeFloat32:
        case Binaryen.NeFloat64:
            vm.dbg("interpret/operations binary: (l != r)");
            out = left != right;
            break;
        case Binaryen.AndInt32:
        case Binaryen.AndInt64:
            vm.dbg("interpret/operations binary: (l && r)");
            out = left && right;
            break;
        case Binaryen.LeSInt64:
        case Binaryen.LeSInt32:
        case Binaryen.LeUInt32:
        case Binaryen.LeFloat32:
        case Binaryen.LeFloat64:
        case Binaryen.LeUInt64:
            vm.dbg("interpret/operations binary: (l <= r)");
            out = left <= right;
            break;
        case Binaryen.LtUInt32:
        case Binaryen.LtSInt32:
        case Binaryen.LtSInt64:
        case Binaryen.LtFloat32:
        case Binaryen.LtFloat64:
            vm.dbg("interpret/operations binary: (l < r)");
            out = left < right;
            break;
        case Binaryen.DivSInt32:
        case Binaryen.DivUInt32:
        case Binaryen.DivSInt64:
        case Binaryen.DivUInt64:
        case Binaryen.DivFloat32:
        case Binaryen.DivFloat64:
            vm.dbg("interpret/operations binary: div(l,r)");
            out = left / right;
            break;
        case Binaryen.GtSInt64:
        case Binaryen.GtUInt64:
        case Binaryen.GtFloat64:
        case Binaryen.GtFloat32:
        case Binaryen.GtSInt32:
        case Binaryen.GtUInt32:
        case Binaryen.LtUInt64:
            vm.dbg("interpret/operations binary: (l > r)");
            out = left > right;
            break;
        case Binaryen.GeSInt64:
        case Binaryen.GeSInt32:
        case Binaryen.GeFloat64:
        case Binaryen.GeFloat32:
        case Binaryen.GeUInt32:
        case Binaryen.GeUInt64:
            vm.dbg("interpret/operations binary: (l >= r)");
            out = left >= right;
            break;
        case Binaryen.RemSInt64:
        case Binaryen.RemUInt64:
        case Binaryen.RemSInt32:
        case Binaryen.RemUInt32:
            vm.dbg("interpret/operations binary: (l % r)");
            out = left % right;
            break;
        case ShlInt32:
        case ShlInt64:
            vm.dbg("interpret/operations binary: (l << r)");
            out = left << right;
            break;
        case ShrUInt32:
        case ShrSInt32:
        case ShrUInt64:
        case ShrSInt64:
            vm.dbg("interpret/operations binary: (l >> r)");
            out = left >> right;
            break;
        case MinFloat32:
        case MinFloat64:
            vm.dbg("interpret/operations binary: min(l,r)");
            out = Math.min(left, right);
            break;
        case MaxFloat32:
        case MaxFloat64:
            vm.dbg("interpret/operations binary: min(l,r)");
            out = Math.max(left, right);
            break;
        default:
            vm.dbg("interpret/operations binary: WARN: unknown binary op, returning null");
            return null;
    }
    vm.dbg(`interpret/operations binary: \t=> ${out}`);
    return {
        value: out
    }
}
module.exports = ops;