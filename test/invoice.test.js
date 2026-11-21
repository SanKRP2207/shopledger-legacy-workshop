'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

test('CURRENT BEHAVIOUR: invoice defaults to 18% GST when order lines omit gstRate', function () {
  var order = {
    items: [{ id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 100, qty: 1 }]
  };

  var billed = pricing.computeTotals(order.items, '');
  var invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.equal(billed.tax, 5);
  assert.equal(billed.total, 105);
  assert.equal(invoiceFigures.rows[0].gstPercent, 18);
  assert.equal(invoiceFigures.tax, 18);
  assert.equal(invoiceFigures.cgst, 9);
  assert.equal(invoiceFigures.sgst, 9);
  assert.equal(invoiceFigures.total, 118);
});

test('CURRENT BEHAVIOUR: invoice percentage coupon is calculated on subtotal plus tax', function () {
  var order = {
    coupon: 'SAVE10',
    items: [{ id: 2, name: 'Rice', sku: 'RICE', hsn: '1006', price: 500, qty: 1 }]
  };

  var billed = pricing.computeTotals(order.items, order.coupon);
  var invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.equal(billed.subtotal, 500);
  assert.equal(billed.discount, 50);
  assert.equal(billed.tax, 22.5);
  assert.equal(billed.total, 472.5);
  assert.equal(invoiceFigures.subtotal, 500);
  assert.equal(invoiceFigures.tax, 90);
  assert.equal(invoiceFigures.discount, 59);
  assert.equal(invoiceFigures.total, 531);
});

test('CURRENT BEHAVIOUR: invoice rows show undiscounted line values and invoice splits its own tax in half', function () {
  var order = {
    items: [
      { id: 3, name: 'Rice', sku: 'RICE', hsn: '1006', price: 100, qty: 1 },
      { id: 4, name: 'Tea', sku: 'TEA', hsn: '0902', price: 100, qty: 1 }
    ]
  };

  var billed = pricing.computeTotals(order.items, '');
  var invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.equal(billed.tax, 23);
  assert.equal(invoiceFigures.tax, 36);
  assert.equal(invoiceFigures.cgst, 18);
  assert.equal(invoiceFigures.sgst, 18);
  assert.deepEqual(invoiceFigures.rows.map(function (row) {
    return { line: row.line, lineTax: row.lineTax, gstPercent: row.gstPercent };
  }), [
    { line: 100, lineTax: 18, gstPercent: 18 },
    { line: 100, lineTax: 18, gstPercent: 18 }
  ]);
});
