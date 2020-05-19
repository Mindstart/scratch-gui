const httpPort = 12345;
const http = require('http');
const childProcess = require('child_process');
const fs = require('fs');

var path = require("path"),
    shell = require("shelljs"),
    HOMEPATH = "win32" === process.platform ? process.env.USERPROFILE : process.env.HOME,
    inoDir = path.resolve(HOMEPATH, "ainoview-avr", "ino", "sketch"),
    buildDir = path.resolve(HOMEPATH, "ainoview-avr", "build"),
    preCompile = function () {
        shell.mkdir("-p", inoDir), shell.mkdir("-p", buildDir)
    };
preCompile();

// microsoft store version
// var arduinoDir = "";
// var batfilename = "upload_ms.bat";
// desktop version
var arduinoDir = "arduino/";
var batfilename = "upload.bat";

console.log(HOMEPATH);
console.log(inoDir);
console.log(buildDir);
console.log(arduinoDir);
console.log(batfilename);

let response = 'compile';
let request;
let port;
let code;
let writeIno = false;

function createIno(code) {
    console.log('createIno');
    preCompile();

    var inopath = inoDir + '/sketch.ino';
    console.log(`createIno inopath ${inopath}`);

    try {
        fs.writeFileSync(inopath, code);
        console.log('It\'s saved!');
        writeIno = true;
    } catch (e) {
        console.log(e);
    }
}

function uploadSketch(port) {
    console.log(`uploadSketch`);

    console.log(`uploadSketch arduinopath ${arduinoDir}`);

    var inopath = inoDir + '/sketch.ino';
    console.log(`uploadSketch inopath ${inopath}`);

    const bat = childProcess.spawnSync('cmd.exe', ['/c', batfilename + ' ' + port + ' ' + arduinoDir + ' ' + inopath + ' ' + buildDir], {
        stdio: ['ignore', 'ignore', 'pipe']
    });
    console.log(bat);
    if (bat.status !== 0) {
        response = ' ERROR: ' + bat.stderr;
    } else {
        response = 'success';
    }
}

function openIDE() {
    console.log(`openIDE currentpath ${inoDir}`);

    var inopath = inoDir + '/sketch.ino';
    var exepath = arduinoDir + 'arduino.exe';

    console.log(`openIDE inopath ${inopath}`);
    console.log(`openIDE exepath ${exepath}`);

    const ide = childProcess.exec('"' + exepath + '"' + ' ' + '"' + inopath + '"');
    ide.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });
}

function listener (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    req.setMaxListeners(300);
    request = req.url;
    if (request.indexOf('openIno') > 0) {
        writeIno = false;
        console.log(`listener openIno`);
        console.log(request);
        request = request.split('/');
        code = decodeURIComponent(request[2]);
        createIno(code);
        if (writeIno) {
            openIDE();
        }
    } else if (request.indexOf('COM') > 0) {
        writeIno = false;
        console.log(`listener COM`);
        console.log(request);
        request = request.split('/');
        port = request[1];
        code = decodeURIComponent(request[2]);
        createIno(code);
        if (writeIno) {
            uploadSketch(port);
        }
    } else {
        response = 'badport';
    }
    res.end(response);
}

function defaultErrorHandler(error) {
    console.log(error);
}

const server = http.createServer(listener);
server.on('error', defaultErrorHandler);
server.listen(httpPort);
console.log('Server Started');
