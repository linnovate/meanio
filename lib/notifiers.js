'use strict';

var fs  = require('fs'),
    request = require('request'),
    os = require('os'),
    app = require('./app-data')();


var create = exports.create = function (data) {

    if (!app.index) return;

    data.token = app.token;
    data.created = new Date();
    data.session = 1;
    data.appId = app.id;

    if (data.index === 'logs' && (data.type === 'request' || data.type === 'console')) {
        data.loadavg = os.loadavg();
        data.freemem = os.freemem();
        data.totalmem = os.totalmem();
        data.cpus = os.cpus();
    }

    var mapiOpt = {
        uri: 'https://network.mean.io/api/v0.1/index/' + data.index + '/' + data.type,
        method: 'POST',
        form: data,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    };

    delete mapiOpt.form.index;
    delete mapiOpt.form.type;

    request(mapiOpt, function(error, response, body) {});
};

function writeErrorLog(text) {
    fs.appendFile(process.cwd() + '/logs/error.log', text, function() {});
}

['log', 'warn', 'error', 'info', 'dir'].forEach(function(method) {
    var oldMethod = console[method].bind(console);
    console[method] = function() {
        var text = '';
       for (var index in arguments) {
            if (typeof(arguments[index]) === 'string' && arguments[index].indexOf('%') === 0) continue;
            text +=  ((method === 'dir') ? JSON.stringify(arguments[index]) : (arguments[index]) ? arguments[index] : '') + ' ';
       }
       if (arguments[0] === '%s: %dms') text += 'ms';
       
        create({
            index: 'logs',
            type: 'console',
            method: method,
            content: text
        });

        writeErrorLog('\n' + [new Date().toISOString()] + ' ' + text);
        oldMethod.apply(console, arguments);
    };
});