const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const algorithm = 'sha256';
const m3u8Filter = require('./filter/m3u8');
global.mockLocalFileFlag = false;

const {argv, exit} = require('process');
if (argv.length != 6) {
    throw new Error("need 6 parameters, please check");
}
var inputFile = argv[2];
var obsDirectory= argv[3];
var outFile = argv[4];
var errorFile = argv[5];

if (!fs.existsSync(inputFile)) {
    throw new Error("input file not exist, please check");
}

const fd = fs.openSync(outFile, 'w');
const errfd = fs.openSync(errorFile, 'w');
process.on('exit', function() {
    fs.closeSync(fd);
    fs.closeSync(errfd);
});

const fileContent = fs.readFileSync(inputFile, 'utf-8');
fileContent.split(/\r?\n/).forEach(line => {
    var lineParams = line.split(/\t? /);
    if(lineParams.length > 0 && lineParams[0].length != 0) {
        var fileName = getFileName(lineParams[0]);
        var fileType = getFileType(lineParams[0]);

        if(lineParams.length == 2) {
            fileName = lineParams[1];
        }

        if(fileType == '.m3u8') {
            handleM3u8(lineParams[0], fileName);
        } else {
            appendOBSDirectory(lineParams[0], null, fileName);
        }
    }
});

function getFileName(url){
    var filePath = null;
    if(mockLocalFileFlag) {
        filePath = url;
    } else {
        filePath = new URL(url).pathname;
    }
    return path.basename(filePath).split('.')[0];
}

function getFileType(url){
    var filePath = null;
    if(mockLocalFileFlag) {
        filePath = url;
    } else {
        filePath = new URL(url).pathname;
    }
    return path.extname(filePath);
}

function appendOBSDirectory(url, directory, name) {
    var contentLine = url + '\t' + obsDirectory;
    if (directory != null) {
        contentLine += '/' + directory;
    }
    contentLine += '/' + encodeURIComponent(name) + getFileType(url) + '\r\n';
    flushIntoFile(contentLine);
}

function flushIntoFile(contentLine){
    fs.writeFileSync(fd, contentLine);
}

function appendError(url, name) {
    var contentLine = url + '\t' + name + '\r\n';
    fs.writeFileSync(errfd, contentLine);
}

function handleM3u8(url, name){
    m3u8Filter.getM3u8SegmentLists(url).then(filelists => {
        var directoryName = crypto.createHash(algorithm).update(url).digest('hex');
        appendOBSDirectory(url, directoryName, name);
        filelists.forEach(filelist => {
            var filename = getFileName(filelist);
            appendOBSDirectory(filelist, directoryName, filename);
        });
    }).catch(error => {
        console.log(error);
        appendError(url, name);
    });
}