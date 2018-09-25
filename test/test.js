let wmvm = require('../src/wmvm.js');
const fs = require('fs');
let inData = fs.readFileSync('emcc.wasm', 'buffer');
let vm = new wmvm(inData);