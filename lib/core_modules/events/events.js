'use strict';

var EventEmitter2 = require('eventemitter2').EventEmitter2;
var emitter = new EventEmitter2({
  wildcard: true,
  delimiter: '.',
  // set this to `true` if you want to emit the newListener event. The default value is `true`
  newListener: true,
  // the maximum amount of listeners that can be assigned to an event, default 10.
  maxListeners: 20
});


function Events(module) {
    this._default = {};
}

Events.prototype.publish = function(opts) {
    if (!opts) return;
    // Grab event type and other defaults from the package
    for (var index in this._default) {
      if (this._default.hasOwnProperty(index)){
        opts[index] = opts[index] || this._default[index];
      }
    }
    if (!opts.type) {
      console.log('Error: events require a "type" property')
      return;
    }
    if (!opts.action) {
      console.log('Error: events require an "action" property')
      return;
    }
    emitter.emit([opts.type, opts.action], opts);
};

Events.prototype.subscribe = function(name, cb) {
    emitter.on(name, cb);
};

/**
 * Fires on any event
 * @param  {Function} cb function(event, value)
 */
Events.prototype.onAny = function(cb) {
    emitter.onAny(cb);
};

Events.prototype.defaultData = function(data) {
    for (var index in data) {
        this._default[index] = data[index];
    }
};

module.exports = Events;
