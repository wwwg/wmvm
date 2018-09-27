let wmvm = require('../src/wmvm.js');
const runtime = {
    abortStackOverflow: () => {
        return 0;
    }
}
const fs = require('fs');
let inData = fs.readFileSync('test/emcc.wasm');
let vm = new wmvm(inData);
vm.addStaticImport('env', 'abortStackOverflow', runtime.abortStackOverflow);
vm.run();