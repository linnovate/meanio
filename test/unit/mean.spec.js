'use strict';

var chai = require('chai'),
  expect = chai.expect;
require('mocha-sinon');

var mean = require('../..');

describe('MEAN IO Core', function () {
  it('should extend Container', function () {
    var Container = require('lazy-dependable').Container;
    expect(mean instanceof Container).to.be.true;
  });

  describe('Config', function () {
    it('should load config based on NODE_ENV and NODE_CONFIG_DIR environmental vars', function () {
      expect(mean.getConfig()._test).to.be.true;
    });
  });

  describe('Menus', function () {
    var Menus = require('../../lib/core_modules/menu');
    it('should be the same as exported', function () {
      expect(mean.Menus === Menus).to.be.true;
    });
  });
});
