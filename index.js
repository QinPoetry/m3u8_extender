// node index.js inputFile obsDirectory outFile errFile
// params: 输入文件 变更分配的OBS目录 输出文件（OMS输入） 错误输出文件

const {argv, exit} = require('process');
const fs = require('fs');
const childProcess = require('child_process');
const path = require('path');
const splitMerge = require('./filter/splitmerge')
const maxTaskNumber = 10;
const eachTaskLine = 100;

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

var tmpDirectory = path.resolve(path.dirname(inputFile), 'temp');
var inFileBaseName = path.resolve(tmpDirectory, 'in');
var outFileBaseName = path.resolve(tmpDirectory, 'out');
var errFileBaseName = path.resolve(tmpDirectory, 'err');
splitMerge.createDir(tmpDirectory);
splitMerge.createDir(inFileBaseName);
splitMerge.createDir(outFileBaseName);
splitMerge.createDir(errFileBaseName);

const taskNumber = splitMerge.splitFile(inputFile, eachTaskLine, inFileBaseName);
console.log('Task will be split into ' + taskNumber + 'part, the max parallel task number is ' + maxTaskNumber);

var runningTaskNumber = 0;
var taskIndex = 0;

for(; taskIndex <= taskNumber && runningTaskNumber < maxTaskNumber; taskIndex++, runningTaskNumber++) {
    newTask(taskIndex);
}

function newTask(fileIndex) {
    var tmpInFile = path.join(inFileBaseName, fileIndex.toString());
    var tmpOutFile = path.join(outFileBaseName, fileIndex.toString());
    var tmpErrFile = path.join(errFileBaseName, fileIndex.toString());
    var command = 'node OMSFilter.js ' + tmpInFile + ' ' + obsDirectory + ' ' + tmpOutFile + ' ' + tmpErrFile;

    var workProcess = childProcess.exec(command, function(error, stdout, stderr){
        if(error) {
            console.log(error);
        }
    });

    workProcess.on('exit', function(code) {
        console.log('Subtask finished, exit code is ' + code);
        if(taskIndex <= taskNumber) {
            newTask(taskIndex);
            taskIndex++;
        }
    });
}

process.on('exit', function() {
    console.log('All subtask finished, please check the result');
    splitMerge.mergeFile(outFileBaseName, errFileBaseName, taskNumber, outFile, errorFile);
    for (var index = 0; index <= taskNumber; index++) {
        fs.unlinkSync(path.join(inFileBaseName, index.toString()));
    }
});