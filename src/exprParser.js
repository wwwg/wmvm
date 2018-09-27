const Binaryen = require('binaryen'),
    MetaFunction = require('./runtime/MetaFunction.js');
let parse = (expr, mod) => {
    let rexpr;
    if (typeof expr === 'number') {
        rexpr = Binaryen.getExpressionInfo(expr);
    } else {
        rexpr = expr;
    }
    mod.dbg(rexpr);
    // block
    if (rexpr.children) {
        for (let i = 0; i < rexpr.children.length; ++i) {
            rexpr.children[i] = parse(rexpr.children[i]);
        }
    }
    // Call operands
    if (rexpr.operands) {
        for (let i = 0; i < rexpr.operands.length; ++i) {
            rexpr.operands[i] = parse(rexpr.operands[i]);
        }
    }

    if (rexpr.condition) 
        rexpr.condition = parse(rexpr.condition);
    if (rexpr.ifTrue)
        rexpr.ifTrue = parse(rexpr.ifTrue);
    if (rexpr.ifFalse)
        rexpr.ifFalse = parse(rexpr.ifFalse);
    if (rexpr.body)
        rexpr.body = parse(rexpr.body);
    if (rexpr.value)
        rexpr.value = parse(rexpr.value);
    if (rexpr.left)
        rexpr.left = parse(rexpr.left);
    if (rexpr.right)
        rexpr.right = parse(rexpr.right);
    if (rexpr.ptr)
        rexpr.ptr = parse(rexpr.ptr);
    if (rexpr.target && typeof rexpr.target === 'number')
        rexpr.target = parse(rexpr.target);
    if (rexpr.target && typeof rexpr.target === 'string') {
        mod.dbg('discovered function: "' + rexpr.target + '"');
        mod.fnMap[rexpr.target] = new MetaFunction(mod, rexpr.target);
    }
    if (rexpr.value && typeof rexpr.value === 'number') {
        if (rexpr.id !== Binaryen.ConstId)
            rexpr.value = parse(rexpr.value);
    }

    return rexpr;
}
module.exports = parse;