// Locates the initial memory of the wasm application
module.exports = (wast) => {
    let findMem = new RegExp(/(\(data \(get_global \$memoryBase\) ")(.*?)(?=\"\))/gim);
    let found = findMem.exec(wast);
    if (!found[0])
        return null;
    let mem = found[0];
    mem = decodeURIComponent(JSON.parse('"' + mem + '"'));
    return mem;
}