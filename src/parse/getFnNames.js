const parse = require("@webassemblyjs/wast-parser").parse;
module.exports = wast => {
    let ret = [];
    wast = wast.replace(/\(import "(.*)\)/gim, '');
    wast = wast.replace(/\(data .*\"\)/gim, '');
    let ast = parse(wast);
    let fields = ast.body[0].fields;
    for (let i = 0; i < fields.length; ++i) {
        let field = fields[i];
        if (field.type !== 'Func')
            continue;
        ret.push(field.name.value);
    }
    return ret;
}