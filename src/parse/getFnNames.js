const parse = require("@webassemblyjs/wast-parser").parse;
module.exports = wast => {
    wast = wast.replace(/\(import "(.*)\)/gim, '');
    let ast = parse(wast);
    let fields = ast.body[0].fields;
    for (let i = 0; i < fields.length; ++i) {
        let field = fields[i];
        console.log(field);
    }
}