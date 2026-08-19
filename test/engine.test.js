/*
 * Engine tests — run with:  node test/engine.test.js
 * No framework, no dependencies. Exits non-zero on failure.
 */
'use strict';

var assert = require('assert');
var engine = require('../assets/engine.js');
var menuMod = require('../data/menu.js');
var questions = require('../data/questions.js');
var source = require('../data/cocktails.json');

var MENU = menuMod.MENU;
var passed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (err) { console.error('  FAIL ' + name + '\n       ' + err.message); process.exitCode = 1; }
}

function ids(res) { return res.items.map(function (i) { return i.drink.id; }); }
function names(res) { return res.items.map(function (i) { return i.drink.name; }); }

function ask(over) {
  return Object.assign({
    moment: 'Mittendrin', strength: '3', spirit: [], avoid: [],
    flavours: ['sauer/zitrus'], serve: '', familiarity: 'egal', allergens: []
  }, over);
}

function opt(id) {
  return questions.QUESTIONS.filter(function (q) { return q.id === id; })[0]
    .options.map(function (o) { return o.value; });
}

console.log('\nBuild output matches the source export');

test('every available drink from the export is in the menu, and no others', function () {
  var expected = source.drinks.filter(function (d) { return d.available; });
  assert.strictEqual(MENU.length, expected.length,
    'menu has ' + MENU.length + ' drinks, export has ' + expected.length + ' available');
  var built = MENU.map(function (d) { return d.name; }).sort();
  var want = expected.map(function (d) { return d.name; }).sort();
  assert.deepStrictEqual(built, want);
});

test('nothing marked unavailable can ever be recommended', function () {
  var blocked = source.drinks.filter(function (d) { return !d.available; })
    .map(function (d) { return d.name; });
  assert.ok(blocked.length > 0, 'the export should contain unavailable drinks');
  var inMenu = MENU.filter(function (d) { return blocked.indexOf(d.name) !== -1; });
  assert.deepStrictEqual(inMenu, [], 'unavailable drinks leaked into the menu');
});

test('Gin Basil stays out while there is no basil', function () {
  assert.ok(!MENU.some(function (d) { return /Gin Basil/.test(d.name); }),
    'Gin Basil is unavailable and must not appear');
});

test('ids are unique and every drink is fully populated', function () {
  var seen = {};
  MENU.forEach(function (d) {
    assert.ok(d.id && !seen[d.id], 'duplicate or missing id: ' + d.id);
    seen[d.id] = true;
    assert.ok(d.name, d.id + ': no name');
    assert.ok(d.tagline, d.id + ': no tagline for the guest');
    assert.ok(d.ing.length, d.id + ': no ingredients');
    assert.ok(d.glass, d.id + ': no glass');
    assert.ok(d.strength >= 0 && d.strength <= 5, d.id + ': strength out of the 0-5 range');
    assert.ok(d.moments.length, d.id + ': no moment');
    assert.ok(Array.isArray(d.spirits), d.id + ': no spirits array');
  });
});

test('alcohol-free drinks are consistent', function () {
  MENU.filter(function (d) { return d.alcoholFree; }).forEach(function (d) {
    assert.strictEqual(d.strength, 0, d.name + ': alcohol-free but strength ' + d.strength);
    assert.strictEqual(d.base, 'none', d.name + ': alcohol-free but base ' + d.base);
    assert.deepStrictEqual(d.spirits, [], d.name + ': alcohol-free but carries spirits');
  });
  assert.ok(MENU.filter(function (d) { return d.alcoholFree; }).length >= 10,
    'expected a real zero-proof selection');
});

console.log('\nQuestion values line up with the data');

test('every strength option matches drinks that exist', function () {
  opt('strength').forEach(function (v) {
    assert.ok(MENU.some(function (d) { return d.strength === Number(v); }),
      'no drink at strength ' + v);
  });
});

test('every flavour option is a real flavour_tag', function () {
  opt('flavours').filter(function (v) { return v !== engine.NO_PREFERENCE; }).forEach(function (v) {
    assert.ok(MENU.some(function (d) { return d.flavours.indexOf(v) !== -1; }),
      'no drink tagged "' + v + '"');
  });
});

test('every allergen option is a real allergen string', function () {
  var used = {};
  MENU.forEach(function (d) { d.allergens.forEach(function (x) { used[x] = true; }); });
  opt('allergens').forEach(function (v) {
    assert.ok(used[v], 'no drink declares allergen "' + v + '"');
  });
  Object.keys(used).forEach(function (x) {
    assert.ok(opt('allergens').indexOf(x) !== -1,
      'allergen "' + x + '" exists in the data but no question can filter it out');
  });
});

test('every moment option is a real moment', function () {
  opt('moment').filter(function (v) { return v !== 'shots'; }).forEach(function (v) {
    assert.ok(MENU.some(function (d) { return d.moments.indexOf(v) !== -1; }),
      'no drink for moment "' + v + '"');
  });
});

test('every spirit option matches at least one drink', function () {
  opt('spirit').forEach(function (v) {
    assert.ok(MENU.some(function (d) { return d.spirits.indexOf(v) !== -1; }),
      'no drink contains spirit "' + v + '"');
  });
});

test('every serve option maps to drinks that exist', function () {
  opt('serve').forEach(function (v) {
    assert.ok(MENU.some(function (d) { return engine.serveGroupOf(d.serve) === v; }),
      'no drink in serve group "' + v + '"');
  });
});

test('every serve style in the data is covered by a group', function () {
  MENU.forEach(function (d) {
    assert.ok(engine.serveGroupOf(d.serve) || d.serve === "Bartender's Choice",
      d.name + ': serve style "' + d.serve + '" belongs to no group');
  });
});

test('the barkeeper\'s-choice option is exclusive and is not a flavour tag', function () {
  var flavourQ = questions.QUESTIONS.filter(function (q) { return q.id === 'flavours'; })[0];
  var exclusive = flavourQ.options.filter(function (o) { return o.exclusive; });
  assert.strictEqual(exclusive.length, 1, 'expected exactly one exclusive option');
  assert.strictEqual(exclusive[0].value, engine.NO_PREFERENCE);
  assert.ok(!MENU.some(function (d) { return d.flavours.indexOf(engine.NO_PREFERENCE) !== -1; }),
    'the sentinel must not collide with a real flavour tag');
});

test('barkeeper\'s choice scores identically to expressing no flavour at all', function () {
  var viaOption = engine.recommend(MENU, ask({ flavours: [engine.NO_PREFERENCE] }), { seed: 7 });
  var viaEmpty = engine.recommend(MENU, ask({ flavours: [] }), { seed: 7 });
  assert.deepStrictEqual(ids(viaOption), ids(viaEmpty),
    'the sentinel should mean "no preference", not "match nothing"');
});

test('barkeeper\'s choice actually varies between guests', function () {
  var a = ask({ flavours: [engine.NO_PREFERENCE], familiarity: 'egal' });
  var seen = {};
  for (var s = 0; s < 30; s++) seen[ids(engine.recommend(MENU, a, { seed: s }))[0]] = true;
  assert.ok(Object.keys(seen).length >= 5,
    'free rein produced only ' + Object.keys(seen).length + ' different top picks');
});

test('barkeeper\'s choice still respects the hard rules', function () {
  var res = engine.recommend(MENU, ask({
    flavours: [engine.NO_PREFERENCE], allergens: ['Ei', 'Milch', 'Nüsse'], avoid: ['whiskey']
  }), { limit: 999 });
  assert.ok(res.items.length > 0);
  res.items.forEach(function (i) {
    assert.strictEqual(i.drink.allergens.length, 0, i.drink.name + ' has allergens');
    assert.ok(i.drink.spirits.indexOf('whiskey') === -1, i.drink.name + ' contains whiskey');
  });
});

test('dropping Frozen and Hot from the question leaves those drinks reachable', function () {
  var offered = opt('serve');
  assert.ok(offered.indexOf('frozen') === -1 && offered.indexOf('heiss') === -1,
    'Frozen and Hot should not be offered as choices');
  // but they must still be groupable, or the menu would contain ungrouped styles
  assert.strictEqual(engine.serveGroupOf('Frozen'), 'frozen');
  assert.strictEqual(engine.serveGroupOf('Hot'), 'heiss');
  var reachable = engine.recommend(MENU, ask({
    flavours: [engine.NO_PREFERENCE], serve: '', strength: '2'
  }), { limit: 999 });
  assert.ok(reachable.items.some(function (i) { return i.drink.serve === 'Frozen'; }),
    'frozen drinks should still be recommendable when no serve style is asked for');
});

console.log('\nHard rules — these must never be violated');

test('an allergen exclusion is absolute', function () {
  ['Ei', 'Milch', 'Nüsse'].forEach(function (al) {
    var res = engine.recommend(MENU, ask({ allergens: [al] }), { limit: 999 });
    res.items.forEach(function (i) {
      assert.ok(i.drink.allergens.indexOf(al) === -1,
        i.drink.name + ' surfaced despite "' + al + '" being excluded');
    });
  });
});

test('excluding every allergen at once never leaks one through', function () {
  var res = engine.recommend(MENU, ask({ allergens: ['Ei', 'Milch', 'Nüsse'] }), { limit: 999 });
  assert.ok(res.items.length > 20, 'should still have plenty to offer');
  res.items.forEach(function (i) {
    assert.strictEqual(i.drink.allergens.length, 0, i.drink.name + ' has allergens but was shown');
  });
});

test('a rejected spirit never appears, as base or as a supporting pour', function () {
  var res = engine.recommend(MENU, ask({ avoid: ['whiskey', 'aperitivo'] }), { limit: 999 });
  res.items.forEach(function (i) {
    var d = i.drink;
    assert.ok(d.spirits.indexOf('whiskey') === -1, d.name + ' contains whiskey');
    assert.ok(d.spirits.indexOf('aperitivo') === -1, d.name + ' contains aperitivo');
  });
});

test('"nothing bitter" removes Campari drinks even when another spirit leads', function () {
  var res = engine.recommend(MENU, ask({ avoid: ['aperitivo'], flavours: ['bitter'] }), { limit: 999 });
  var shown = names(res);
  ['Negroni', 'Boulevardier', 'Americano', 'Negroni Sbagliato'].forEach(function (n) {
    assert.ok(shown.indexOf(n) === -1, n + ' slipped through the aperitivo exclusion');
  });
});

test('hard rules survive even a near-impossible combination', function () {
  var res = engine.recommend(MENU, ask({
    moment: 'shots', allergens: ['Ei', 'Milch', 'Nüsse'],
    avoid: ['vodka', 'whiskey', 'rum', 'gin', 'likoer']
  }), { limit: 999 });
  res.items.forEach(function (i) {
    assert.strictEqual(i.drink.allergens.length, 0);
    ['vodka', 'whiskey', 'rum', 'gin', 'likoer'].forEach(function (s) {
      assert.ok(i.drink.spirits.indexOf(s) === -1, i.drink.name + ' contains ' + s);
    });
  });
});

console.log('\nGates');

test('zero proof returns only alcohol-free drinks', function () {
  var res = engine.recommend(MENU, ask({ strength: '0' }), { limit: 999 });
  assert.ok(res.items.length >= 10);
  res.items.forEach(function (i) {
    assert.ok(i.drink.alcoholFree, i.drink.name + ' is not alcohol-free');
  });
});

test('asking for alcohol never returns an alcohol-free drink', function () {
  ['1', '2', '3', '4', '5'].forEach(function (s) {
    var res = engine.recommend(MENU, ask({ strength: s }), { limit: 999 });
    res.items.forEach(function (i) {
      assert.ok(!i.drink.alcoholFree, i.drink.name + ' is alcohol-free but strength ' + s + ' was asked');
    });
  });
});

test('shots appear only when shots were asked for', function () {
  var evening = engine.recommend(MENU, ask({ moment: 'Mittendrin' }), { limit: 999 });
  evening.items.forEach(function (i) {
    assert.notStrictEqual(i.drink.serve, 'Shot', i.drink.name + ' is a shot but a full drink was asked for');
  });
  var round = engine.recommend(MENU, ask({ moment: 'shots' }), { limit: 999 });
  assert.ok(round.items.length >= 10, 'expected the shot list');
  round.items.forEach(function (i) {
    assert.strictEqual(i.drink.serve, 'Shot', i.drink.name + ' is not a shot');
  });
});

test('an impossible combination relaxes a gate rather than showing nothing', function () {
  var res = engine.recommend(MENU, ask({ moment: 'shots', strength: '0' }), { limit: 999 });
  assert.ok(res.items.length > 0, 'should fall back rather than show an empty screen');
  assert.strictEqual(res.relaxed, 'shot');
  res.items.forEach(function (i) {
    assert.ok(i.drink.alcoholFree, 'relaxing the shot gate must not smuggle alcohol in');
  });
});

console.log('\nRecommendation quality');

test('bitter + strong + late surfaces the stirred bitter drinks', function () {
  var res = engine.recommend(MENU, ask({
    moment: 'Später Abend', strength: '5', flavours: ['bitter'], serve: 'kurz'
  }));
  var top = names(res);
  assert.ok(top.some(function (n) { return /Negroni|Boulevardier|Manhattan|Old Fashioned/.test(n); }),
    'expected a bitter stirred classic, got: ' + top.join(', '));
});

test('coffee surfaces the Espresso Martini', function () {
  var res = engine.recommend(MENU, ask({ flavours: ['kaffee'], moment: 'Später Abend' }));
  assert.ok(names(res).indexOf('Espresso Martini') !== -1,
    'expected Espresso Martini, got: ' + names(res).join(', '));
});

test('a preferred spirit dominates the results', function () {
  var res = engine.recommend(MENU, ask({ spirit: ['tequila', 'mezcal'], flavours: ['sauer/zitrus'] }));
  var agave = res.items.filter(function (i) {
    return i.drink.spirits.indexOf('tequila') !== -1 || i.drink.spirits.indexOf('mezcal') !== -1;
  });
  assert.ok(agave.length >= 2, 'expected mostly agave drinks, got: ' + names(res).join(', '));
});

test('"what most people order" really does rank by sales', function () {
  var res = engine.recommend(MENU, ask({ familiarity: 'beliebt', flavours: ['fruchtig'] }));
  var best = Math.min.apply(null, res.items.map(function (i) { return i.drink.rank; }));
  assert.ok(best <= 15, 'expected a top seller, best rank was ' + best);
});

test('"hardly anyone orders it" prefers the long tail', function () {
  var pop = engine.recommend(MENU, ask({ familiarity: 'beliebt', flavours: ['fruchtig'] }));
  var rare = engine.recommend(MENU, ask({ familiarity: 'entdecken', flavours: ['fruchtig'] }));
  var avg = function (r) {
    return r.items.reduce(function (s, i) { return s + i.drink.sold; }, 0) / r.items.length;
  };
  assert.ok(avg(rare) < avg(pop),
    'the discovery path should surface less-sold drinks (' + avg(rare) + ' vs ' + avg(pop) + ')');
});

test('a spritz request returns actual spritzes', function () {
  var res = engine.recommend(MENU, ask({ serve: 'spritzig', strength: '1', flavours: ['prickelnd'] }));
  assert.strictEqual(res.items[0].drink.serve, 'Spritz',
    'expected a Spritz on top, got ' + res.items[0].drink.name);
});

test('a bartender\'s-choice catch-all never outranks a real drink', function () {
  var res = engine.recommend(MENU, ask({}), { limit: 999 });
  var real = res.items.filter(function (i) { return i.drink.serve !== "Bartender's Choice"; });
  var catchAll = res.items.filter(function (i) { return i.drink.serve === "Bartender's Choice"; });
  if (catchAll.length && real.length) {
    assert.ok(real[0].score > catchAll[0].score,
      '"' + catchAll[0].drink.name + '" outranked every real drink');
  }
});

console.log('\nOutput contract');

test('results are ordered, capped, and carry usable reasons', function () {
  var res = engine.recommend(MENU, ask({ spirit: ['gin'], allergens: ['Ei'] }), { limit: 3 });
  assert.ok(res.items.length <= 3);
  for (var i = 1; i < res.items.length; i++) {
    assert.ok(res.items[i - 1].score >= res.items[i].score, 'results are not sorted');
  }
  res.items.forEach(function (item) {
    assert.ok(item.match >= 35 && item.match <= 99, 'match % outside the presentable range: ' + item.match);
    assert.ok(item.reasons.length >= 1, item.drink.name + ': no reason to show the guest');
    item.reasons.forEach(function (r) {
      assert.ok(questions.UI.de.reasons[r.key], 'no German copy for reason "' + r.key + '"');
      assert.ok(questions.UI.en.reasons[r.key], 'no English copy for reason "' + r.key + '"');
    });
  });
});

test('every spirit family in the menu has a display name in both languages', function () {
  var fams = {};
  MENU.forEach(function (d) { fams[d.base] = true; d.spirits.forEach(function (s) { fams[s] = true; }); });
  Object.keys(fams).forEach(function (f) {
    assert.ok(questions.UI.de.spiritNames[f], 'no German name for spirit family "' + f + '"');
    assert.ok(questions.UI.en.spiritNames[f], 'no English name for spirit family "' + f + '"');
  });
});

test('every flavour tag in the data has a display name in both languages', function () {
  var tags = {};
  MENU.forEach(function (d) { d.flavours.forEach(function (f) { tags[f] = true; }); });
  Object.keys(tags).forEach(function (f) {
    assert.ok(questions.UI.de.flavourNames[f], 'no German display name for flavour "' + f + '"');
    assert.ok(questions.UI.en.flavourNames[f], 'no English display name for flavour "' + f + '"');
  });
});

test('the same answers and seed always give the same result', function () {
  var a = ask({ familiarity: 'egal' });
  assert.deepStrictEqual(
    ids(engine.recommend(MENU, a, { seed: 42 })),
    ids(engine.recommend(MENU, a, { seed: 42 })));
});

test('the seed breaks ties without overturning a clear winner', function () {
  // Predictability beats novelty here: the same answers should give the same
  // advice. The seed exists only to stop exact ties resolving by menu order.
  var a = ask({ spirit: ['whiskey'], flavours: ['bitter'], strength: '5' });
  var tops = {};
  for (var s = 0; s < 30; s++) tops[ids(engine.recommend(MENU, a, { seed: s }))[0]] = true;
  assert.strictEqual(Object.keys(tops).length, 1,
    'a clear best match should not change between guests');
});

test('a drink whose alcohol-free flag conflicts with its strength is treated as alcoholic', function () {
  // Rosato Spritz is alcohol_free:true in the export but rated strength 1,
  // and its recipe carries Ramazzotti Rosato. Fail safe, never the other way.
  var conflicted = source.drinks.filter(function (d) {
    return d.available && d.alcohol_free && d.strength.level !== 0;
  });
  conflicted.forEach(function (d) {
    var built = MENU.filter(function (m) { return m.name === d.name; })[0];
    assert.ok(built, d.name + ' should still be on the menu, just not as zero proof');
    assert.strictEqual(built.alcoholFree, false,
      d.name + ' has a conflicting alcohol-free flag and must not count as zero proof');
  });
  // and it must never reach a guest who asked for zero proof
  var res = engine.recommend(MENU, ask({ strength: '0' }), { limit: 999 });
  res.items.forEach(function (i) {
    assert.strictEqual(i.drink.strength, 0,
      i.drink.name + ' reached the zero-proof list at strength ' + i.drink.strength);
  });
});

test('every reachable answer combination returns something', function () {
  var moments = opt('moment');
  var strengths = opt('strength');
  var flavours = opt('flavours');
  var serves = [''].concat(opt('serve'));
  var fams = opt('familiarity');
  var combos = 0, worst = null;
  moments.forEach(function (m) {
    strengths.forEach(function (st) {
      flavours.forEach(function (f) {
        serves.forEach(function (sv) {
          fams.forEach(function (fam) {
            combos++;
            var res = engine.recommend(MENU, {
              moment: m, strength: st, spirit: [], avoid: [],
              flavours: [f], serve: sv, familiarity: fam, allergens: []
            });
            if (!res.items.length) worst = [m, st, f, sv || 'any', fam].join(' / ');
          });
        });
      });
    });
  });
  assert.strictEqual(worst, null, 'empty result for ' + worst);
  console.log('       (' + combos + ' combinations checked)');
});

test('every combination still returns something with all allergens excluded', function () {
  var combos = 0, worst = null;
  opt('moment').forEach(function (m) {
    opt('strength').forEach(function (st) {
      opt('flavours').forEach(function (f) {
        combos++;
        var res = engine.recommend(MENU, {
          moment: m, strength: st, spirit: [], avoid: [],
          flavours: [f], serve: '', familiarity: 'egal',
          allergens: ['Ei', 'Milch', 'Nüsse']
        });
        if (!res.items.length) worst = [m, st, f].join(' / ');
      });
    });
  });
  assert.strictEqual(worst, null, 'empty result for ' + worst);
  console.log('       (' + combos + ' allergen-restricted combinations checked)');
});

console.log('\n' + passed + ' passed' + (process.exitCode ? ', SOME FAILED' : '') + '\n');
