const http_port = 12345;
const http = require('http');
const child_process = require('child_process');
const fs = require('fs');

let response = 'compile';
let request;
let port;
let code;

function listener(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	req.setMaxListeners(300);
	request = req.url;
	if(request.indexOf("openIno") > 0){
		console.log(`listener openIno`);
		console.log(request);
		request = request.split("/");
		code = decodeURIComponent(request[2]);
		createIno(code);
		openIDE();
	}
	else if(request.indexOf("COM") > 0){
		console.log(`listener COM`);
		console.log(request);
		request = request.split("/");
		port = request[1];
		code = decodeURIComponent(request[2]);
		createIno(code);
		uploadSketch(port);
    }
	else{
		response = "badport";
	}
	res.end(response);	
}

function createIno(code){
	console.log('createIno');
	var currpath = process.cwd(); 
	// Notice the double-backslashes on this following line
	currpath = currpath.replace(/\\/g, '/');

	var datapath = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
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

	fs.writeFileSync(inopath, code, (err) => {
  		if (err) throw err;
  		console.log('It\'s saved!');
	}); 

	// fs.writeFileSync('arduino/sketch/sketch.ino', code); 
}

function uploadSketch(port){
	const bat = child_process.spawnSync('cmd.exe', ['/c', 'upload.bat '+port],  { stdio: ['ignore', 'ignore', 'pipe'] });
	if(bat.status != 0){
		console.log(`uploadSketch err: ${bat}`);
		console.log(bat);
		var uint8Arr = bat.stderr;
		console.log(uint8Arr);
		var strArrayBuffer = typedArrayToBuffer(uint8Arr);
		console.log(strArrayBuffer);
		var strUint16Array = new Uint16Array(strArrayBuffer);
		console.log(strUint16Array);
		var msg = array2Str(strUint16Array);
		console.log(`msg: ${msg}`);
		response = " ERROR: "+ bat.stderr; 
	} else{
		response = "success";
	}
}

function openIDE(){
	console.log(`openIDE ${process.cwd()}`);

	var currpath = process.cwd(); 
	// Notice the double-backslashes on this following line
	currpath = currpath.replace(/\\/g, '/');
	var exepath = currpath + '/arduino/arduino.exe'; 

	var datapath = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
	// The expected result is:
	// OS X - '/Users/user/Library/Preferences'
	// Windows 8 & 10 - 'C:\Users\user\AppData\Roaming'
	// Windows XP - 'C:\Documents and Settings\user\Application Data'
	// Linux - '/home/user/.local/share'
	console.log(`createIno datapath ${datapath}`);
	datapath = datapath.replace(/\\/g, '/');
	var inopath = datapath + '/AinoView/sketch/sketch.ino';

	console.log(`openIDE inopath ${inopath}`);
	console.log(`openIDE exepath ${exepath}`);

	const ide = child_process.exec('"' + exepath + '"' + ' ' + '"' + inopath + '"');
	ide.stderr.on('data', (data) => {
		console.log(`stderr: ${data}`);
	});
}

function defaultErrorHandler(error) {
    console.log(error);
}

function array2Str(buf) {
	return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function typedArrayToBuffer(array) {
    return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
}

const server = http.createServer(listener);
server.on('error', defaultErrorHandler);
server.listen(http_port);
console.log("Server Started");