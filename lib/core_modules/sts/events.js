'use strict';

var sts;

function Events(module) {
    this.opts = {};
    this.opts.icon = 'fa-bars';
    this.opts.icon_col = '#176583';
}


Events.prototype.publish = function(opts) {
    sts = require('./index')();
    for (var index in opts)
        this.opts[index] = opts[index];

    sts.events.publish(this.opts);
};

Events.prototype.subscribe = function(name, cb) {
    sts = require('./index')();
    sts.events.subscribe(name, cb);
};

Events.prototype.defaultData = function(data) {
    for (var index in data) {
        this.opts[index] = data[index];
    }
};

module.exports = Events;
