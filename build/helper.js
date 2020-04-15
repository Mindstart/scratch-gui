const httpPort = 12345;
const http = require('http');
const childProcess = require('child_process');
const fs = require('fs');

let response = 'compile';
let request;
let port;
let code;
let writeIno = false;

function createIno (code){
    console.log('createIno');
    var currpath = process.cwd();
    // Notice the double-backslashes on this following line
    currpath = currpath.replace(/\\/g, '/');

    var datapath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share');
    // The expected result is:
    // OS X - '/Users/user/Library/Preferences'
    // Windows 8 & 10 - 'C:\Users\user\AppData\Roaming'
    // Windows XP - 'C:\Documents and Settings\user\Application Data'
    // Linux - '/home/user/.local/share'
    console.log(`createIno datapath ${datapath}`);
    datapath = datapath.replace(/\\/g, '/');
    datapath = datapath + '/AinoView';
    if (!fs.existsSync(datapath)){
        fs.mkdirSync(datapath);
    }
    datapath = datapath + '/sketch';
    if (!fs.existsSync(datapath)){
        fs.mkdirSync(datapath);
    }
    console.log(`createIno datapath modify ${datapath}`);

    var inopath = datapath + '/sketch.ino';
    console.log(`createIno inopath ${inopath}`);

    // fs.writeFileSync(inopath, code, (err) => {
    // 	if (err) throw err;
    // 	console.log('It\'s saved!');
    // });
    // fs.writeFileSync('arduino/sketch/sketch.ino', code);

	try {
		fs.writeFileSync(inopath, code);
		console.log('It\'s saved!');
		writeIno = true;
	} catch (e) {
		console.log(e);
	}
}

function uploadSketch (port){
    console.log(`uploadSketch`);

    var datapath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share');
    // The expected result is:
    // OS X - '/Users/user/Library/Preferences'
    // Windows 8 & 10 - 'C:\Users\user\AppData\Roaming'
    // Windows XP - 'C:\Documents and Settings\user\Application Data'
    // Linux - '/home/user/.local/share'
    datapath = datapath.replace(/\\/g, '/');
    // var arduinopath = datapath + '/arduino';
    var arduinopath = 'arduino';
    console.log(`uploadSketch arduinopath ${arduinopath}`);

    var inopath = datapath + '/AinoView/sketch/sketch.ino';
    console.log(`uploadSketch inopath ${inopath}`);

    const bat = childProcess.spawnSync('cmd.exe', ['/c', 'upload.bat ' + port + ' ' + arduinopath + ' ' + inopath], {stdio: ['ignore', 'ignore', 'pipe']});
    console.log(bat);
    if (bat.status !== 0){
        response = ' ERROR: ' + bat.stderr;
    } else {
        response = 'success';
    }
}

function openIDE (){
    console.log(`openIDE currentpath ${process.cwd()}`);

    var datapath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share');
    // The expected result is:
    // OS X - '/Users/user/Library/Preferences'
    // Windows 8 & 10 - 'C:\Users\user\AppData\Roaming'
    // Windows XP - 'C:\Documents and Settings\user\Application Data'
    // Linux - '/home/user/.local/share'
    console.log(`createIno datapath ${datapath}`);

    datapath = datapath.replace(/\\/g, '/');
    var inopath = datapath + '/AinoView/sketch/sketch.ino';
    // var exepath = datapath + '/arduino/arduino.exe';
    var exepath = 'arduino/arduino.exe';

    // var currpath = process.cwd();
    // Notice the double-backslashes on this following line
    // currpath = currpath.replace(/\\/g, '/');
    // var exepath = currpath + '/arduino/arduino.exe';

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
    if (request.indexOf('openIno') > 0){
		writeIno = false;
        console.log(`listener openIno`);
        console.log(request);
        request = request.split('/');
        code = decodeURIComponent(request[2]);
		createIno(code);
		if (writeIno) {
        	openIDE();
		}
    } else if (request.indexOf('COM') > 0){
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

function defaultErrorHandler (error) {
    console.log(error);
}

function array2Str (buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

const server = http.createServer(listener);
server.on('error', defaultErrorHandler);
server.listen(httpPort);
console.log('Server Started');
