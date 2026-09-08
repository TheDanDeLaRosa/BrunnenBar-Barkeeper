/*
 * Agave derivation tests — run with:  node tequila/test/agave.test.js
 *
 * These pin the two things that would otherwise rot quietly. That a section
 * name never decides anything, and that a sweetener is never mistaken for a
 * spirit.
 */
'use strict';

var assert = require('assert');
var A = require('../assets/agave.js');
var SRC = require('../../assets/menu-source.js');
var F = require('./fixture.js');

var passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (err) { console.error('  FAIL ' + name + '\n       ' + err.message); process.exitCode = 1; }
}

var ITEMS = A.agaveItems(F.MENU, SRC);
function byName(n) {
  var hit = ITEMS.filter(function (d) { return d.name === n; })[0];
  assert.ok(hit, n + ' should be an agave item');
  return hit;
}
function raw(n) {
  return SRC.allItems(F.MENU).filter(function (i) { return i.name === n; })[0];
}

console.log('\nMembership');

test('beer and wine carry no agave and are never derived', function () {
  assert.strictEqual(A.derive(raw('Helles 0,5l')), null);
  assert.strictEqual(A.derive(raw('Riesling')), null);
});

test('agave syrup in a gin drink is a sweetener, not a spirit', function () {
  // The single most tempting shortcut, and the one that would pull half the
  // card into a tequila app.
  var gin = raw('Gin Sour');
  assert.ok(gin.ingredients.indexOf('Agave') !== -1, 'fixture must actually contain agave syrup');
  assert.strictEqual(A.isAgave(gin), false);
  assert.strictEqual(A.derive(gin), null);
});

test('membership never depends on a section title', function () {
  var renamed = JSON.parse(JSON.stringify(F.MENU));
  renamed.sections.forEach(function (s, i) {
    s.title = 'Abschnitt ' + i;
    s.title_en = 'Section ' + i;
  });
  var after = A.agaveItems(renamed, SRC).map(function (d) { return d.name; });
  assert.deepStrictEqual(after, ITEMS.map(function (d) { return d.name; }));
});

test('a brand name carries agave where the word tequila never appears', function () {
  var paloma = byName('Paloma');
  assert.strictEqual(paloma.brand, 'El Destilador');
  var text = (paloma.name + JSON.stringify(paloma.ing)).toLowerCase();
  assert.ok(text.indexOf('tequila') === -1, 'Paloma must not spell out tequila anywhere');
});

test('card order is preserved, never resorted', function () {
  var order = SRC.allItems(F.MENU).filter(A.isAgave).map(function (i) { return i.name; });
  assert.deepStrictEqual(ITEMS.map(function (d) { return d.name; }), order);
});

console.log('\nExpression and kind');

test('anejo is found whether or not the card spells the tilde', function () {
  assert.strictEqual(A.expressionOf({ name: 'Don Julio Añejo' }), 'anejo');
  assert.strictEqual(A.expressionOf({ name: 'Don Julio Anejo' }), 'anejo');
  assert.strictEqual(A.expressionOf({ name: 'DON JULIO ANEJO' }), 'anejo');
});

test('extra anejo beats anejo, which contains it', function () {
  assert.strictEqual(A.expressionOf({ name: 'Don Julio Extra Añejo' }), 'extra-anejo');
});

test('plata, silver and joven are all blanco', function () {
  ['Ocho Plata', 'Herradura Silver', 'Union Joven'].forEach(function (n) {
    assert.strictEqual(A.expressionOf({ name: n }), 'blanco', n);
  });
});

test('an expression the card does not name stays unknown', function () {
  assert.strictEqual(byName('Margarita').expression, '');
});

test('mezcal wins the kind even when tequila is in the same glass', function () {
  assert.strictEqual(A.kindOf({ name: 'Mix', ingredients: ['Tequila', 'Mezcal'] }), 'mezcal');
  assert.strictEqual(byName('Margarita Rojas').kind, 'mezcal');
  assert.strictEqual(byName('Don Julio Blanco').kind, 'tequila');
});

test('the Diageo houses are recorded and every other house is blank', function () {
  assert.strictEqual(byName('Don Julio Blanco').portfolio, 'Diageo');
  assert.strictEqual(byName('Casamigos Mezcal').portfolio, 'Diageo');
  assert.strictEqual(byName('Paloma').portfolio, '');
  assert.strictEqual(byName('Ocho Plata').brand, '');
});

console.log('\nPour, strength and price');

test('no ingredients or one ingredient is a pour, two or more is built', function () {
  assert.strictEqual(byName('Don Julio Blanco').pour, true);
  assert.strictEqual(A.isPour({ ingredients: ['Don Julio Blanco'] }), true);
  assert.strictEqual(byName('Margarita').pour, false);
});

test('strength that the card does not record stays null, never a guess', function () {
  assert.strictEqual(byName('Ocho Plata').strength, null);
  assert.strictEqual(A.strengthOf({ strength: '' }), null);
  assert.strictEqual(A.strengthOf({ strength: 'irgendwas' }), null);
  assert.strictEqual(A.strengthOf({ strength: 'mild' }), 1);
  assert.strictEqual(A.strengthOf({ strength: 'Mittel' }), 2);
  assert.strictEqual(A.strengthOf({ strength: 'stark' }), 3);
});

test('price is the cheapest size the card lists', function () {
  assert.strictEqual(byName('Don Julio Blanco').price, 9.5);   // 2 cl at 9.50, 4 cl at 17
  assert.strictEqual(A.priceOf({ prices: [], price: 7 }), 7);
  assert.strictEqual(A.priceOf({ prices: [] }), null);
});

test('budget stops rise, do not repeat and stay under the top price', function () {
  var stops = A.budgetStops(ITEMS);
  var top = Math.max.apply(null, ITEMS.map(function (d) { return d.price; }));
  assert.ok(stops.length >= 2, 'this card should spread far enough to ask');
  stops.forEach(function (v, i) {
    assert.ok(v < top, v + ' must be under the top price ' + top);
    if (i) assert.ok(v > stops[i - 1], 'stops must rise');
  });
  assert.deepStrictEqual(A.budgetStops([{ price: 9 }, { price: 9 }]), [],
    'a card that does not spread is not worth a question');
});

console.log('\nCharacter');

test('every character tag names the ingredient it was read off', function () {
  var m = byName('Margarita');
  assert.ok(m.tags.indexOf('sauer/zitrus') !== -1);
  assert.strictEqual(m.tagFrom['sauer/zitrus'], 'Limette');
  assert.strictEqual(m.tagFrom['süß'], 'Cointreau');
  m.tags.forEach(function (tag) {
    assert.ok(m.tagFrom[tag], tag + ' must say where it came from');
  });
});

test('a neat mezcal is smoky with no ingredient list to read', function () {
  var mz = byName('Casamigos Mezcal');
  assert.deepStrictEqual(mz.ing, []);
  assert.ok(mz.tags.indexOf('rauchig') !== -1);
});

test('a neat tequila claims no character it cannot show', function () {
  assert.deepStrictEqual(byName('Don Julio Blanco').tags, []);
});

test('the Menu API flavour field wins over the derivation the day it lands', function () {
  var withField = A.derive({
    name: 'Margarita', group: 'Agave',
    ingredients: ['Tequila', 'Limette', 'Cointreau'],
    flavour_tags: ['sauer/zitrus', 'überraschend'], prices: [], allergens: []
  });
  assert.deepStrictEqual(withField.tags, ['sauer/zitrus', 'überraschend']);
});

console.log('\nVocabulary hygiene');

test('every vocabulary entry is already normalised, so it can actually match', function () {
  var words = A.SPIRIT_WORDS
    .concat(A.BRANDS.map(function (b) { return b[0]; }))
    .concat(A.EXPRESSIONS.map(function (e) { return e[0]; }))
    .concat(A.GENERIC_ING)
    .concat(Object.keys(A.STRENGTH));
  Object.keys(A.CHARACTER).forEach(function (k) {
    words = words.concat(A.CHARACTER[k]);
  });
  words.forEach(function (w) {
    assert.strictEqual(w, A.norm(w), JSON.stringify(w) + ' would never match, normalise it');
  });
});

test('the expression list is ordered so no entry is shadowed by a shorter one', function () {
  A.EXPRESSIONS.forEach(function (row, i) {
    A.EXPRESSIONS.slice(0, i).forEach(function (earlier) {
      assert.ok(row[0].indexOf(earlier[0]) === -1,
        row[0] + ' is unreachable, ' + earlier[0] + ' matches first');
    });
  });
});

console.log('\n' + passed + ' passed\n');
