'use strict';

var EventEmitter = require('events');
var util = require('util');

function MyEmitter() {
  EventEmitter.call(this);
}

util.inherits(MyEmitter, EventEmitter);

var myEmitter = new MyEmitter();


function Events(module) {
    this._default = {};
}

Events.prototype.publish = function(opts) {
    if (!opts) return;

    for (var index in this._default)
        opts[index] = opts[index] || this._default[index];

    if (opts.action) {
        myEmitter.emit(opts.action, opts);
    }
    else {
        myEmitter.emit(opts);
    }

};

Events.prototype.subscribe = function(name, cb) {
    myEmitter.on(name, cb);
};

Events.prototype.defaultData = function(data) {
    for (var index in data) {
        this._default[index] = data[index];
    }
};

module.exports = Events;
