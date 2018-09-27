const Binaryen = require('binaryen'),
    MetaFunction = require('./runtime/MetaFunction.js');
module.exports = (expr, mod) => {
    let rexpr;
    if (typeof expr === 'number') {
        rexpr = Binaryen.getExpressionInfo(expr);
    } else {
        rexpr = expr;
    }
    // block
    if (rexpr.children) {
        for (let i = 0; i < rexpr.children.length; ++i) {
            rexpr.children[i] = Binaryen.getExpressionInfo(rexpr.children[i]);
        }
    }
    // Call operands
    if (rexpr.operands) {
        for (let i = 0; i < rexpr.operands.length; ++i) {
            rexpr.operands[i] = Binaryen.getExpressionInfo(rexpr.operands[i]);
        }
    }

    if (rexpr.condition) 
        rexpr.condition = Binaryen.getExpressionInfo(rexpr.condition);
    if (rexpr.ifTrue)
        rexpr.ifTrue = Binaryen.getExpressionInfo(rexpr.ifTrue);
    if (rexpr.ifFalse)
        rexpr.ifFalse = Binaryen.getExpressionInfo(rexpr.ifFalse);
    if (rexpr.body)
        rexpr.body = Binaryen.getExpressionInfo(rexpr.body);
    if (rexpr.value)
        rexpr.value = Binaryen.getExpressionInfo(rexpr.value);
    if (rexpr.left)
        rexpr.left = Binaryen.getExpressionInfo(rexpr.left);
    if (rexpr.right)
        rexpr.right = Binaryen.getExpressionInfo(rexpr.right);
    if (rexpr.ptr)
        rexpr.ptr = Binaryen.getExpressionInfo(rexpr.ptr);
    if (rexpr.target && typeof rexpr.target === 'number')
        rexpr.target = Binaryen.getExpressionInfo(rexpr.target);
    else if (typeof rexpr.target === 'string') {
        console.log('discovered function: "' + rexpr.target + '"');
        mod.fnMap[rexpr.target] = new MetaFunction(mod, rexpr.target);
    }
    if (rexpr.value && typeof rexpr.value === 'number') {
        if (rexpr.id !== Binaryen.ConstId)
            rexpr.value = Binaryen.getExpressionInfo(rexpr.value);
    }

    return rexpr;
}