'use strict';
/* jshint -W024 */
/* jshint expr:true */

var chai = require('chai'),
  expect = chai.expect;
require('mocha-sinon');

var Events = require('../../../lib/core_modules/module/events.js');

describe('Module Events', function () {
  var e1 = new Events('one');
  var e2 = new Events('two');
  var listener;

  beforeEach(function () {
    listener = this.sinon.stub();
    listener.reset();
  });

  it('should have all EventEmitter2 functions', function () {
    expect(e1.addListener).to.exist;
    expect(e1.on).to.exist;
    expect(e1.onAny).to.exist;
    expect(e1.offAny).to.exist;
    expect(e1.once).to.exist;
    expect(e1.many).to.exist;
    expect(e1.removeListener).to.exist;
    expect(e1.off).to.exist;
    expect(e1.removeAllListeners).to.exist;
    expect(e1.setMaxListeners).to.exist;
    expect(e1.listeners).to.exist;
    expect(e1.listenersAny).to.exist;
  });

  describe('Namespacing', function () {
    it('should use name', function () {
      e1.on([e1.name, 'test'], listener);
      e1.emit('test');
      expect(listener.calledOnce).to.be.true;
    });

    it('should allow .on across namespaces', function () {
      e1.on([e2.name, 'test'], listener);
      e2.emit('test');
      expect(listener.calledOnce).to.be.true;
    });
  });

  describe('Default Data', function () {
    var def = {test: true};
    it('should send default data', function () {
      e1.setDefaults(def);
      e1.on('one.test', listener);
      e1.emit('test');
      expect(listener.calledOnce).to.be.true;
      expect(listener.calledWith(def)).to.be.true;
    });
  });
});
