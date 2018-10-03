const wmvm = require('../src/wmvm.js'),
    fs = require('fs');

let vm = new wmvm(fs.readFileSync('test/binaries/test2.wasm'));
vm.enableDebug()
    .link();
vm.dumpMemory(1024, 30);
vm.run();