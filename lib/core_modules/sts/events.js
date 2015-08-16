'use strict';

var sts;

function Events(module) {
    this._default = {};
    this._default.icon = 'fa-bars';
    this._default.icon_col = '#176583';
}


Events.prototype.publish = function(opts) {
    sts = require('./index')();
    for (var index in this._default)
        opts[index] = opts[index] || this._default[index];

    sts.events.publish(opts);
};

Events.prototype.subscribe = function(name, cb) {
    sts = require('./index')();
    sts.events.subscribe(name, cb);
};

Events.prototype.defaultData = function(data) {
    for (var index in data) {
        this._default[index] = data[index];
    }
};

module.exports = Events;
