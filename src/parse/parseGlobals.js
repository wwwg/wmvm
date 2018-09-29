const parse = require("@webassemblyjs/wast-parser").parse;

let toBinaryenType = type => {
    switch (type) {
        case 'i32':
            return 1;
        case 'i64':
            return 2;
        case 'f32':
            return 3;
        case 'f64':
            return 4;
        default:
            return 0;
    }
}

module.exports = wast => {
    let globals = [];
    wast = wast.replace(/\(import "(.*)\)/gim, '');
    let ast = parse(wast);
    let fields = ast.body[0].fields;
    for (let i = 0; i < fields.length; ++i) {
        let global = {};
        let node = fields[i];
        if (node.type == 'Global') {
            let name = node.name.value;
            let initInstruction = node.init[0];
            console.log(`global name: ${name}`);
            if (initInstruction.id == 'const') {
                let initializer = initInstruction.args[0];
                let type = toBinaryenType(initInstruction.object);
                global.isConst = true;
                global.type = type;
                global.value = initializer.value;
            } else if (initInstruction.id == 'get_global') {
                let importName = initInstruction.args[0].value;
                global.isConst = false;
                global.importName = importName;
            } else {
                console.log('WARN: couldnt parse global:');
                console.log(global);
            }
        }
    }
    return globals;
}