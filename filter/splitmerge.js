const fs = require('fs');
const path = require('path');

function splitFile(filename, lineNumber, outFileBaseName) {
    const fileContent = fs.readFileSync(filename, 'utf-8');

    var fileIndex = 0;
    var outfile = path.join(outFileBaseName, fileIndex.toString());
    var content = '';
    var index = 0;
    var fd = fs.openSync(outfile, 'w');

    fileContent.split(/\r?\n/).forEach(line => {
        content += line + '\r\n';
        index++;
        if (index == lineNumber) {
            fs.writeFileSync(fd, content);
            fs.closeSync(fd);
            index = 0;
            fileIndex ++;
            outfile = path.join(outFileBaseName, fileIndex.toString());
            fd = fs.openSync(outfile, 'w');
            content = '';
        }
    });
    
    if(content != '') {
        fs.writeFileSync(fd, content);
    }
    fs.closeSync(fd);
    return fileIndex;
}

function createDir(dirname) {
    if(!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname);
    }
}

function mergeFile(outDir, errDir, number, outFile, errFile) {
    var outfd = fs.openSync(outFile, 'w');
    var errfd = fs.openSync(errFile, 'w');
    for(var index = 0; index <= number; index++) {
        var outfilename = path.join(outDir, index.toString());
        var errfilename = path.join(errDir, index.toString());
        fs.writeFileSync(outfd, fs.readFileSync(outfilename, 'utf-8'));
        fs.writeFileSync(errfd, fs.readFileSync(errfilename, 'utf-8'));
        fs.unlinkSync(outfilename);
        fs.unlinkSync(errfilename);
    }
    fs.closeSync(outfd);
    fs.closeSync(errfd);
}

module.exports = {
    splitFile,
    createDir,
    mergeFile
}