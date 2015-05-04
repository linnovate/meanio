'use strict';

var fs  = require('fs');
var request = require('request');
var querystring = require('querystring');
var globalData = {
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

  if (!globalData.allowed) return;

  data.token = globalData.token;
  data.created = Date.now();
  data.session = 1;
  data.appId = globalData.appId;

  var mapiOpt = {
    uri: 'https://network.mean.io/api/v0.1/index/' + data.index + '/' + data.type,
    method: 'POST',
    form: data,
    headers: {
      'Content-Type': 'multipart/form-data',
      'Content-Length': querystring.stringify(data).length
    }
  };


  request(mapiOpt, function(error, response, body) {});
};

function writeErrorLog(text) {
  fs.appendFile(process.cwd() + '/logs/error.log', text, function() {});
}

['log', 'warn', 'error'].forEach(function(method) {
    console[method] = function(d) {
        process.stdout.write(d + '\n');
        var text = [new Date().toISOString()] + '   ' + d + '\n';
        writeErrorLog(text);
        create({
            index: 'logs',
            type: 'console',
            content: method + ': ' + d
        });
    };
});

init();