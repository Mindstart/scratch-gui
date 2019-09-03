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
		request = request.split("/");
		code = decodeURIComponent(request[2]);
		createIno(code);
		openIDE();
	}
	else if(request.indexOf("COM") > 0){
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
	fs.writeFileSync('arduino/sketch/sketch.ino', code); 
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
	const ide = child_process.exec('"arduino/arduino.exe" "arduino/sketch/sketch.ino"');
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