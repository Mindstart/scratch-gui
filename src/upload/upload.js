const http = require('http');

const upload = function (com, cmd) {
	const options = {
		host: '127.0.0.1',
		port: 12345,
		path: '/' + com + '/'+ encodeURIComponent(cmd),
		method: 'get'
	};
	console.log('path'+options.path)
	const req = http.request(options, function (res) {
		res.setEncoding('binary');
		res.on('data', function (data) {
            global.uploadMessage = data;
			return data;
		});
	});
	req.on('error', (e) => {
	   global.uploadMessage = 'Connection Error';
	});	
	req.end();
}

module.exports = {upload};