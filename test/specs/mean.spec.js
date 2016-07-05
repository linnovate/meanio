'use strict';

var chai = require('chai'),
  expect = chai.expect;
require('mocha-sinon');

var mean = require('../..');

describe('MEAN IO Core', function () {
  it('should extend Container', function() {
    var Container = require('lazy-dependable').Container;
    expect(mean instanceof Container).to.be.true;
  });

  describe('Config', function () {
    it('should load config based on NODE_ENV and NODE_CONFIG_DIR environmental vars', function () {
      expect(mean.getConfig()._test).to.be.true;
    });
  });

  describe('loadConfig', function () {
    beforeEach(function () {
      this.sinon.stub(console, 'error');
      this.sinon.spy(mean.constructor, 'getConfig');
    });

    it('should console.error notice about deprecated loadConfig', function () {
      mean.loadConfig();
      expect(console.error.calledOnce).to.be.true;
    });

    it('should call getConfig', function() {
      mean.loadConfig();
      expect(mean.constructor.getConfig.calledOnce).to.be.true;
    });

    it('should return getConfig', function() {
      expect(mean.loadConfig() === mean.constructor.getConfig());
    })
  });
});
