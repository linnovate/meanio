'use strict';

var fs  = require('fs'),
    os = require('os'),
    request = require('request'),
    app = require('../../app-data')(),
    EventEmitter = require('events').EventEmitter,
    meanEvents = new EventEmitter();


function Events(module, Meanio) {
    this.module = module;
    this.designProp = {
        color: '#176583',
        icon: 'fa-bars'
    };
}


Events.prototype.publish = function(name, opts) {

    meanEvents.emit(this.module + ' ' + name, opts);

    if (!app.index) return;

    var data = {};
    data.design = this.designProp;
    data.token = app.token;
    data.created = new Date();
    data.session = 1;
    data.appId = app.id;
    data.loadavg = os.loadavg();
    data.freemem = os.freemem();
    data.totalmem = os.totalmem();
    data.cpus = os.cpus();
    data.pkg = this.module;
    data.name = name;
    data.data = opts;

    var mapiOpt = {
        uri: 'https://network.mean.io/api/v0.1/index/events/events',
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

Events.prototype.subscribe = function(name, cb) {
    meanEvents.on(name, cb);
};

Events.prototype.design = function(data) {
    this.designProp.color = data.color || this.designProp.color;
    this.designProp.icon = data.icon || this.designProp.icon
};

module.exports = Events;
