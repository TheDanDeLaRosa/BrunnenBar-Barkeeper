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

test('the whisky shelf next door is never pulled in', function () {
  assert.strictEqual(A.derive(raw('Talisker 10')), null);
  assert.strictEqual(A.derive(raw('Four Roses')), null);
});

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

test('a till article is carried in the payload and never shown', function () {
  // hidden_on_card is a Kassenartikel per the 08.09.2026 data spec. Dropped
  // at the source, so no app can forget.
  var raws = F.MENU.sections.reduce(function (a, s) { return a.concat(s.items); }, []);
  assert.ok(raws.some(function (i) { return i.hidden_on_card === true; }),
    'the fixture must actually contain one');
  assert.strictEqual(ITEMS.filter(function (d) { return /Flasche/.test(d.name); }).length, 0);
});

test('an item with agave of its own never depends on a section title', function () {
  /* The strong half of the rule, and the one that matters. Every item that
   * can vouch for itself survives any rename at all. */
  var renamed = JSON.parse(JSON.stringify(F.MENU));
  renamed.sections.forEach(function (s, i) {
    s.title = 'Abschnitt ' + i;
    s.title_en = 'Section ' + i;
  });
  var after = A.agaveItems(renamed, SRC).map(function (d) { return d.name; });
  SRC.allItems(F.MENU).filter(A.isAgave).forEach(function (i) {
    assert.ok(after.indexOf(i.name) !== -1, i.name + ' lost to a rename');
  });
});

test('the section can add an item, and is the only thing that can lose one', function () {
  /* The data spec asks every app to pick its sections by keyword. That is
   * how El Jefe reaches this app at all, since it names no agave anywhere,
   * and it is also the one thing a keyword-free rename can cost. Said out
   * loud here rather than left as a surprise. */
  var jefe = SRC.allItems(F.MENU).filter(function (i) { return i.name === 'El Jefe'; })[0];
  assert.strictEqual(A.isAgave(jefe), false, 'it vouches for nothing itself');
  assert.strictEqual(A.isRelevant(jefe, SRC), true, 'the section vouches for it');
  assert.ok(ITEMS.some(function (d) { return d.name === 'El Jefe'; }));

  // A rename that keeps a keyword keeps the item.
  var kept = JSON.parse(JSON.stringify(F.MENU));
  kept.sections.forEach(function (s) {
    if (s.title === 'Tequila Cocktails') { s.title = 'Agave Drinks'; s.title_en = 'Agave Drinks'; }
  });
  assert.ok(A.agaveItems(kept, SRC).some(function (d) { return d.name === 'El Jefe'; }));

  // One that drops every keyword does not.
  var lost = JSON.parse(JSON.stringify(F.MENU));
  lost.sections.forEach(function (s) {
    if (s.title === 'Tequila Cocktails') { s.title = 'Hausdrinks'; s.title_en = 'House drinks'; }
  });
  assert.ok(!A.agaveItems(lost, SRC).some(function (d) { return d.name === 'El Jefe'; }));
});

test('a brand name carries agave where the word tequila never appears', function () {
  var paloma = byName('Paloma');
  assert.strictEqual(paloma.brand, 'El Destilador');
  var text = (paloma.name + JSON.stringify(paloma.ing)).toLowerCase();
  assert.ok(text.indexOf('tequila') === -1, 'Paloma must not spell out tequila anywhere');
});

test('card order is preserved, never resorted', function () {
  var order = SRC.allItems(F.MENU)
    .filter(function (i) { return A.isRelevant(i, SRC); })
    .map(function (i) { return i.name; });
  assert.deepStrictEqual(ITEMS.map(function (d) { return d.name; }), order);
});

console.log('\nThe card\'s own fields beat the bottle name');

test('agave_expression places a bottle whose name never says what it is', function () {
  // The whole reason the field was asked for.
  assert.strictEqual(byName('Don Julio 1942').expression, 'anejo');
  assert.strictEqual(A.expressionOf({ name: 'Don Julio 1942' }), '',
    'and the name alone still cannot place it, which is the point');
});

test('a field written for a person comes back as a key', function () {
  assert.strictEqual(A.expressionOf({ agave_expression: 'Añejo' }), 'anejo');
  assert.strictEqual(A.expressionOf({ agave_expression: 'Extra Añejo' }), 'extra-anejo');
  assert.strictEqual(A.kindOf({ agave_kind: 'Tequila' }), 'tequila');
  assert.strictEqual(A.kindOf({ agave_kind: 'Mezcal' }), 'mezcal');
});

test('an expression nobody has thought of yet is kept, not dropped', function () {
  assert.strictEqual(A.expressionOf({ agave_expression: 'Doble Reposado' }), 'reposado');
  assert.strictEqual(A.expressionOf({ agave_expression: 'Ancestral' }), 'ancestral');
});

test('brand comes off the field, so a house nobody listed still lands', function () {
  var mz = byName('Nuestra Soledad Mezcal');
  assert.strictEqual(mz.brand, 'Nuestra Soledad');
  assert.strictEqual(A.brandOf({ name: 'Nuestra Soledad Mezcal' }), '',
    'and the brand list alone does not know it, which is the point');
  assert.strictEqual(mz.portfolio, '', 'not a Diageo house');
});

test('the shelf never decides which spirit is in the glass', function () {
  /* The real section is called "Tequila & Mezcal Neat". Reading that as the
   * bottle would make every Don Julio on it a mezcal, tag it smoky and drop
   * it the moment a guest says no smoke. */
  var stripped = A.agaveItems(F.beforePublish(), SRC);
  stripped.filter(function (d) { return d.brand === 'Don Julio'; })
    .forEach(function (d) {
      assert.strictEqual(d.kind, 'tequila', d.name);
      assert.strictEqual(d.tags.indexOf('rauchig'), -1, d.name + ' is not smoky');
    });
});

test('a shelf holding one kind may say so, a shelf holding two may not', function () {
  assert.strictEqual(A.kindOf({ name: 'Ocho Plata', group: 'Tequila' }), 'tequila');
  assert.strictEqual(A.kindOf({ name: 'Bruxo', group: 'Mezcal' }), 'mezcal');
  assert.strictEqual(A.kindOf({ name: 'Ocho Plata', group: 'Tequila & Mezcal Neat' }), 'agave');
});

test('region and additive policy are read where the card carries them', function () {
  var blanco = byName('Don Julio Blanco');
  assert.deepStrictEqual(blanco.region, { text: 'Highland', key: 'highland' });
  assert.strictEqual(blanco.additiveFree, false);

  var mz = byName('Nuestra Soledad Mezcal');
  assert.strictEqual(mz.region.text, 'Oaxaca / Valles');
  assert.strictEqual(mz.region.key, 'lowland');
  assert.strictEqual(mz.additiveFree, true);
});

test('a card that does not say is not a card that says no', function () {
  assert.strictEqual(byName('Margarita').additiveFree, null);
  assert.strictEqual(byName('Margarita').region, null);
  assert.strictEqual(A.additiveFreeOf({}), null);
  assert.strictEqual(A.additiveFreeOf({ additive_free: false }), false);
});

test('a region the lookup does not know is shown as the card writes it', function () {
  var r = A.regionOf({ agave_region: 'Jalisco, irgendwo' });
  assert.strictEqual(r.text, 'Jalisco, irgendwo');
  assert.strictEqual(r.key, '');
});

test('the two spirit fields are read as the enums they are', function () {
  /* Settled 08.09.2026. agave_kind is the spirit category, agave_expression
   * is the maturation. The shim that read them whichever way round they
   * arrived is gone, so this pins the direction rather than tolerating both. */
  assert.strictEqual(A.kindOf({ agave_kind: 'Tequila', agave_expression: 'Añejo' }), 'tequila');
  assert.strictEqual(A.expressionOf({ agave_kind: 'Tequila', agave_expression: 'Añejo' }), 'anejo');
  assert.strictEqual(A.kindOf({ agave_kind: 'Mezcal', agave_expression: 'Joven' }), 'mezcal');
  assert.strictEqual(A.expressionOf({ agave_kind: 'Mezcal', agave_expression: 'Joven' }), 'joven');
});

test('joven is its own answer rather than quietly relabelled blanco', function () {
  // It is a value in the card's enum, so a guest is offered the word the
  // card in front of them uses.
  assert.strictEqual(byName('Nuestra Soledad Mezcal').expression, 'joven');
  assert.strictEqual(A.expressionOf({ agave_expression: 'Blanco' }), 'blanco');
});

test('how long it sat in oak is read where the card records it', function () {
  assert.strictEqual(byName('Don Julio Añejo').agedMonths, 18);
  assert.strictEqual(byName('Don Julio 1942').agedMonths, 30);
  assert.strictEqual(byName('Don Julio Blanco').agedMonths, 0, 'zero is a number, not a blank');
  assert.strictEqual(byName('Ocho Plata').agedMonths, null);
  assert.strictEqual(A.agedMonthsOf({ aged_months: 'acht' }), null);
});

test('the margin bucket is never handed to the interface', function () {
  // menu_class is internal. The spec says do not show it, and the surest way
  // is for the interface never to receive it.
  var raws = F.MENU.sections.reduce(function (a, s) { return a.concat(s.items); }, []);
  assert.ok(raws.some(function (i) { return i.menu_class; }), 'the fixture must carry it');
  ITEMS.forEach(function (d) {
    assert.strictEqual('menu_class' in d, false, d.name);
  });
});

test('the leader marker and the photo come straight off the card', function () {
  var blanco = byName('Don Julio Blanco');
  assert.strictEqual(blanco.recommended, true);
  assert.match(blanco.image, /^https:\/\/brunnenbar\.com\//);
  var rosado = byName('Don Julio Rosado');
  assert.strictEqual(rosado.recommended, false);
  assert.strictEqual(rosado.image, null, 'no photo is null, never a placeholder');
});

test('the number on the bottle is read, and only shown', function () {
  assert.strictEqual(byName('Don Julio Blanco').abv, 38);
  assert.strictEqual(byName('Nuestra Soledad Mezcal').abv, 42);
  assert.strictEqual(byName('Ocho Plata').abv, null);
  assert.strictEqual(byName('Margarita').abv, null, 'a cocktail has no single number');
  assert.strictEqual(A.abvOf({ abv: 0 }), null);
  assert.strictEqual(A.abvOf({ abv: '38' }), null);

  /* Shown, never scored. Two pours at 38 and 42 per cent taste the same as
   * far as a recommendation goes, and the strength question runs on the
   * card's own words. */
  var E = require('../assets/engine.js');
  assert.ok(JSON.stringify(E.WEIGHTS).indexOf('abv') === -1);
});

test('zero proof is a strength of its own rather than an unknown', function () {
  assert.strictEqual(A.strengthOf({ strength: 'alkoholfrei' }), 0);
  assert.strictEqual(A.strengthOf({ strength: 'leicht' }), 1);
});

console.log('\nBefore the seat republishes');

test('every bottle still lands, and only 1942 loses anything', function () {
  var after = {}, before = {};
  A.agaveItems(F.MENU, SRC).forEach(function (d) { after[d.name] = d; });
  A.agaveItems(F.beforePublish(), SRC).forEach(function (d) { before[d.name] = d; });

  assert.deepStrictEqual(Object.keys(before), Object.keys(after),
    'the same items must be found either way');

  /* The two bottles whose names do not spell out what the field says. 1942
   * never says anejo, and the mezcal never says joven. Everything else reads
   * the same either way. */
  var lost = Object.keys(after).filter(function (n) {
    return before[n].expression !== after[n].expression || before[n].kind !== after[n].kind;
  });
  assert.deepStrictEqual(lost.sort(), ['Don Julio 1942', 'Nuestra Soledad Mezcal']);
  assert.strictEqual(before['Don Julio 1942'].expression, '');
  assert.strictEqual(before['Nuestra Soledad Mezcal'].kind, 'mezcal', 'the kind survives');
});

test('the flavours degrade with the fields, and nothing is invented', function () {
  var before = {};
  A.agaveItems(F.beforePublish(), SRC).forEach(function (d) { before[d.name] = d; });
  // A pour has no ingredients to read, so without flavour_tags it says nothing.
  assert.deepStrictEqual(before['Don Julio Blanco'].tags, []);
  assert.strictEqual(before['Don Julio Anejo'] || before['Don Julio Añejo'].agedMonths, null);
  // The cocktails are unaffected, they were always read from ingredients.
  assert.ok(before['Margarita'].tags.indexOf('sauer/zitrus') !== -1);
});

test('the fields it cannot see are absent rather than guessed', function () {
  A.agaveItems(F.beforePublish(), SRC).forEach(function (d) {
    assert.strictEqual(d.region, null, d.name);
    assert.strictEqual(d.additiveFree, null, d.name);
  });
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

test('plata and silver are blanco under another name', function () {
  ['Ocho Plata', 'Herradura Silver'].forEach(function (n) {
    assert.strictEqual(A.expressionOf({ name: n }), 'blanco', n);
  });
  // Joven is not, because the card's enum has it as its own value.
  assert.strictEqual(A.expressionOf({ name: 'Union Joven' }), 'joven');
});

test('an expression the card does not name stays unknown', function () {
  assert.strictEqual(byName('Margarita').expression, '');
});

test('mezcal wins the kind even when tequila is in the same glass', function () {
  assert.strictEqual(A.kindOf({ name: 'Mix', ingredients: ['Tequila', 'Mezcal'] }), 'mezcal');
  assert.strictEqual(byName('Margarita Rojas').kind, 'mezcal');
  assert.strictEqual(byName('Don Julio Blanco').kind, 'tequila');
});

test('rosado is its own answer and not folded into reposado', function () {
  assert.strictEqual(byName('Don Julio Rosado').expression, 'rosado');
  assert.strictEqual(A.expressionOf({ name: 'Don Julio Reposado' }), 'reposado');
});

test('the Diageo houses are recorded and every other house is blank', function () {
  assert.strictEqual(byName('Don Julio Blanco').portfolio, 'Diageo');
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
  var mz = byName('Nuestra Soledad Mezcal');
  assert.deepStrictEqual(mz.ing, []);
  assert.ok(mz.tags.indexOf('rauchig') !== -1);
});

test('every flavour on the card is one the app has a word for', function () {
  /* If the bar adds a tag nobody has written copy for, this is what says so,
   * rather than the option quietly never appearing. */
  var Q = require('../data/questions.js');
  var known = {};
  Q.CHARACTER_CHOICES.forEach(function (o) { known[o.value] = true; });
  ITEMS.forEach(function (d) {
    d.tags.forEach(function (t) {
      assert.ok(known[t], 'no copy for the flavour ' + JSON.stringify(t) +
        ' on ' + d.name + '. Add it to CHARACTER_CHOICES or alias it.');
    });
  });
});

test('a pour the card has not described claims nothing', function () {
  assert.deepStrictEqual(byName('Ocho Plata').tags, []);
});

test('a neat pour finally tastes of something', function () {
  /* The whole point of flavour_tags on the pours. Before it, a blanco and an
   * añejo were identical to this app, which is the one difference that
   * matters most. */
  var blanco = byName('Don Julio Blanco').tags;
  var anejo = byName('Don Julio Añejo').tags;
  assert.ok(blanco.length && anejo.length);
  assert.strictEqual(blanco.filter(function (t) { return anejo.indexOf(t) !== -1; }).length, 0,
    'they should now have nothing in common');
});

test('the card writes citrus two ways and the app reads one', function () {
  /* The cocktail half says sauer/zitrus, the neat pours say zitrus. Without
   * the alias a guest asking for citrus matches the Margarita and not the
   * Blanco, which is the kind of gap nobody notices. */
  assert.strictEqual(A.canonicalTag('zitrus'), 'sauer/zitrus');
  assert.strictEqual(A.canonicalTag('frisch'), 'kräuterig/frisch');
  assert.strictEqual(A.canonicalTag('vanille'), 'vanille', 'anything else is left alone');

  var blanco = byName('Don Julio Blanco');
  assert.ok(blanco.item.flavour_tags.indexOf('zitrus') !== -1, 'the fixture must use the raw word');
  assert.ok(blanco.tags.indexOf('sauer/zitrus') !== -1);
  assert.strictEqual(blanco.tags.indexOf('zitrus'), -1, 'and only the one spelling survives');

  // The same tag reaches both halves of the card, which is the point.
  assert.ok(byName('Margarita').tags.indexOf('sauer/zitrus') !== -1);
});

test('a mezcal the bar described is not argued with', function () {
  /* Smoke is added only where the card gave no flavour_tags at all. If the
   * bar tags a mezcal and leaves smoke off, the bar is right. */
  var withTags = A.derive({ name: 'Leiser Mezcal', agave_kind: 'Mezcal',
    flavour_tags: ['zitrus'], prices: [], allergens: [], ingredients: [] });
  assert.deepStrictEqual(withTags.tags, ['sauer/zitrus']);

  var silent = A.derive({ name: 'Namenloser Mezcal', agave_kind: 'Mezcal',
    prices: [], allergens: [], ingredients: [] });
  assert.ok(silent.tags.indexOf('rauchig') !== -1);
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
