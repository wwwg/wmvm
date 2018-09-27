// Locates the initial memory of the wasm application
module.exports = (wast) => {
    let findMem = new RegExp(/\(data \(get_global .*\) "?.*/gim);
    let found = findMem.exec(wast);
    if (!found || !found[0])
        return null;
    let mem = found[0].replace(/\(data \(get_global .*\) "/gim, '');
    mem = mem.replace('")', '');
    mem = mem.replace(/\\00/g, '\\u0000');
    mem = JSON.parse('"' + mem + '"');
    return mem;
}