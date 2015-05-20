'use strict';

var fs  = require('fs'),
    request = require('request'),
    querystring = require('querystring'),
    os = require('os'),
    globalData = {
        allowed: false,
        token: null,
        appId: ''
    };

function readJson(path) {
    try {
        var data = JSON.parse(fs.readFileSync(process.cwd() + '/mean.json'));
        if (data) {
            globalData.appId = data.id;
            if (data.anonymizedData) return true;
            return false;
        } return false;
    } catch(err) {
        return false;
    }
}


function getUserHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

function meanJsonPath() {
  var file = (process.platform === 'win32') ? '_mean' : '.mean';
  var path = getUserHome() + '/' + file;
  return path;
}

function readToken() {
    var token;
    var path = meanJsonPath();

    var data = fs.readFileSync(path);
    try {
        var json = JSON.parse(data.toString());
        token = json.token;
    } catch (err) {
        token = null;
    }
    return token;
}

function init() {
    globalData.token = readToken();
    var anonymizedData = readJson(process.cwd() + '/mean.json');
    if (globalData.token && anonymizedData) globalData.allowed = true;
}


var create = exports.create = function (data) {

    if (!globalData.allowed || !globalData.appId) return;

    data.token = globalData.token;
    data.created = new Date();
    data.session = 1;
    data.appId = globalData.appId;

    if (data.index === 'logs' && (data.type === 'request' || data.type === 'console')) {
        data.loadavg = os.loadavg(),
        data.freemem = os.freemem(),
        data.totalmem = os.totalmem(),
        data.cpus = os.cpus()
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

init();