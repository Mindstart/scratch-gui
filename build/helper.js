const httpPort = 10802;
const http = require('http');
const childProcess = require('child_process');
const fs = require('fs');

let response = 'compile';
let request;
let port;
let code;
let writeIno = false;

var path = require("path"),
    shell = require("shelljs"),
    HOMEPATH = "win32" === process.platform ? process.env.USERPROFILE : process.env.HOME,
    inoDir = path.resolve(HOMEPATH, "ainoview-avr", "ino", "sketch"),
    buildDir = path.resolve(HOMEPATH, "ainoview-avr", "build"),
    preCompile = function () {
        shell.mkdir("-p", inoDir), shell.mkdir("-p", buildDir)
    };
preCompile();

var arduinopath = 'arduino';
var inopath = inoDir + '/sketch.ino';
var arduinoexepath = 'arduino/arduino.exe';

function createIno(code) {
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
    console.log(`uploadSketch inopath ${inopath}`);
    shell.rm("-rf", buildDir + "/*");

    const bat = childProcess.spawnSync('cmd.exe', ['/c', 'upload.bat ' + port + ' ' + arduinopath + ' ' + inopath + ' ' + buildDir], {
        stdio: ['ignore', 'ignore', 'pipe']
    });
    if (bat.status !== 0) {
        response = ' ERROR: ' + bat.stderr;
    } else {
        response = 'success';
    }
}

function openIDE() {
    console.log(`openIDE inopath ${inopath}`);
    console.log(`openIDE exepath ${arduinoexepath}`);

    const ide = childProcess.exec('"' + arduinoexepath + '"' + ' ' + '"' + inopath + '"');
    ide.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });
}

function listener(req, res) {
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
