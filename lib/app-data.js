'use strict';

var fs  = require('fs'),
    token,
    appId,
    anonymizedData;

function readJson(path) {
    try {
        var data = JSON.parse(fs.readFileSync(process.cwd() + '/mean.json'));
        if (data) {
            appId = data.id;
            anonymizedData = data.anonymizedData;
        }
    } catch(err) {}
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

    if (!fs.existsSync(path)) {
        return null;
    }
    
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
    token = readToken();
    readJson(process.cwd() + '/mean.json');
}

init();

module.exports = function() {
    return {
        index: token && appId && anonymizedData,
        token: token,
        id: appId,
        anonymizedData: anonymizedData
    };
};

