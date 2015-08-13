'use strict';

var sts;

function Events(module, Meanio) {
    this.module = module;
    this.designProp = {
        color: '#176583',
        icon: 'fa-bars'
    };
}


Events.prototype.publish = function(name, opts) {
    sts = require('./index')();
    opts.design = this.designProp;
    sts.events.publish(this.module, name, opts);
};

Events.prototype.subscribe = function(name, cb) {
    sts = require('./index')();
    sts.events.subscribe(name, cb);
};

Events.prototype.design = function(data) {
    this.designProp.color = data.color || this.designProp.color;
    this.designProp.icon = data.icon || this.designProp.icon
};

module.exports = Events;
