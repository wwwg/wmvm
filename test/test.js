const wmvm = require('../src/wmvm.js'),
    fs = require('fs');

let vm = new wmvm(fs.readFileSync('test/binaries/test2.wasm'));
vm.enableDebug()
    .link();
console.log(vm.memory.dump(1024, 30));
vm.run();