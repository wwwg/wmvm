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
    let res = [];
    let importData = new RegExp(/\(import "(.*)" "(.*)" \(global (.*) (.*)\)\)/gm);
    let execData;
    while (execData = importData.exec(wast)) {
        let importObject = {
            module: execData[1],
            name: execData[2],
            importedAs: execData[3],
            type: toBinaryenType(execData[4])
        }
        res.push(importObject);
    }
    return res;
}
  