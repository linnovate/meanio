'use strict';

var chai = require('chai'),
  expect = chai.expect;

var Menus = require('../../../lib/core_modules/menu');

describe('Menus', function () {
  describe('Functions', function() {
    it('should have expected functions', function() {
      expect(Menus.prototype.add).to.exist;
      expect(Menus.prototype.get).to.exist;
    });
  });
});
