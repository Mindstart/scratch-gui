const http_port = 12345;
const http = require('http');
const child_process = require('child_process');
const fs = require('fs');

let response = "compile"; 
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
	// currpath = currpath.split("/package.nw");
	// currpath = currpath[0];
	var inopath = currpath + '/arduino/sketch/sketch.ino';
	inopath = decodeURIComponent(inopath);
	console.log(`createIno inopath ${inopath}`);

	// var currpath = 'C:\\Users\\huwew\\Documents\\ainoview_test\\arduino\\sketch';
	// var currpath = 'C:\\Users\\huwew\\Documents\\ainoview test\\arduino\\sketch';
	// var currpath = 'C:\\Program Files (x86)\\AinoView_test_can_del\\nwjs-sdk-v0.32.2-win-x64\\package.nw\\arduino\\sketch';
	// currpath = currpath.replace(/\\/g, '/');
	// var inopath = currpath + '/sketch/sketch.ino';
	// inopath = decodeURIComponent(inopath);
	// console.log(`createIno inopath ${inopath}`);

	fs.writeFileSync(inopath, code, (err) => {
  		if (err) throw err;
  		console.log('It\'s saved!');
	}); 

	// fs.writeFileSync('arduino/sketch/sketch.ino', code); 
}

function uploadSketch(port){
	const bat = child_process.spawnSync('cmd.exe', ['/c', 'upload.bat '+port],  { stdio: ['ignore', 'ignore', 'pipe'] });
	if(bat.status != 0){
		response = " ERROR: "+bat.stderr; 
	} else{
		response = "success";
	}
}

function openIDE(){
	console.log(`openIDE ${process.cwd()}`);

	// var arduinopath = 'C:\\Program Files (x86)\\Arduino';
	// arduinopath = arduinopath.replace(/\\/g, '/');
	// var exepath = arduinopath + '/arduino.exe'; 

	var currpath = process.cwd(); 
	// Notice the double-backslashes on this following line
	currpath = currpath.replace(/\\/g, '/');
	// var tmppath = currpath.split("/package.nw");
	// var inopath = tmppath[0] + '/sketch/sketch.ino'; 
	var inopath = currpath + '/arduino/sketch/sketch.ino'; 
	var exepath = currpath + '/arduino/arduino.exe'; 

	console.log(`openIDE inopath ${inopath}`);
	console.log(`openIDE exepath ${exepath}`);

	// const ide = child_process.exec('"arduino/arduino.exe" "arduino/sketch/sketch.ino"');
	const ide = child_process.exec('"' + exepath + '"' + ' ' + '"' + inopath + '"');
	ide.stderr.on('data', (data) => {
		console.log(`stderr: ${data}`);
	});
}

function defaultErrorHandler(error) {
    console.log(error);
}

const server = http.createServer(listener);
server.on('error', defaultErrorHandler);
server.listen(http_port);
console.log("Server Started");