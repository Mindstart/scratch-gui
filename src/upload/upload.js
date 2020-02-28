const http = require('http');

const upload = function (com, cmd) {
    const options = {
        host: '127.0.0.1',
        port: 12345,
        path: `/${  com  }/${ encodeURIComponent(cmd)}`,
        method: 'get'
    };
    console.log(`path : ${options.path}`);
    console.log(`com : ${com}`);
    console.log(`cmd : ${cmd}`);
    const req = http.request(options, (res) => {
        res.setEncoding('utf-8');
        res.on('data', (data) => {
            global.uploadMessage = data;
            return data;
        });
    });
    req.on('error', e => {
	   global.uploadMessage = 'Connection Error';
    });
    req.end();
};

module.exports = {upload};
