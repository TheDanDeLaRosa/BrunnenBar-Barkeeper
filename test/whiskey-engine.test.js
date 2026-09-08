/*
 * Whisky engine tests — run with:  node test/whiskey-engine.test.js
 *
 * Two kinds of fixture. Small handmade shelves pin the sharp rules, where
 * being able to read the whole shelf in one screen is what makes the test
 * worth anything. The preview shelf in whiskey/data/demo-menu.js stands in
 * for a real card wherever a rule only shows itself at scale, which also
 * keeps that file honest.
 */
'use strict';

var assert = require('assert');
var E = require('../whiskey/assets/engine.js');
var SRC = require('../assets/menu-source.js');
var Q = require('../whiskey/data/questions.js');
var DEMO = require('../whiskey/data/demo-menu.js');

var passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok   ' + name);
  } catch (err) {
    console.error('  FAIL ' + name + '\n       ' + err.message);
    process.exitCode = 1;
  }
}
function group(name) { console.log('\n' + name); }

// ------------------------------------------------------------- fixtures ---

/* A row shaped like the Menu API, with only the whisky bits spelled out. */
function row(name, whisky, extra) {
  var price = extra && extra.price != null ? extra.price : 6;
  var item = {
    name: name, name_en: name, group: '', group_en: '',
    price: price, prices: [{ size: '2 cl', price: price }],
    description: '', description_en: '', bartender_note: '', bartender_note_en: '',
    ingredients: [], ingredients_en: [], strength: 'stark',
    allergens: (extra && extra.allergens) || [], allergens_en: [], allergen_codes: [],
    alcohol_free: false, pos_sku: name, hidden_on_card: false,
    on_printed_menu: true,
    popularity_rank: extra && extra.rank != null ? extra.rank : 9999
  };
  if (whisky) item.whisky = whisky;
  if (extra && extra.noPrices) { delete item.prices; delete item.price; }
  return item;
}

function prof(o) {
  return {
    kind: o.kind || 'Single Malt',
    origin: o.origin == null ? 'Speyside' : o.origin,
    age_years: o.age === undefined ? 12 : o.age,
    abv: o.abv || 43,
    cask: o.cask || ['Bourbonfass'],
    peat: o.peat === undefined ? 0 : o.peat,
    notes: o.notes || ['malzig'],
    serve: o.serve || ['pur'],
    level: o.level || 'klassiker'
  };
}

var SHELF = DEMO.WHISKY;

// ------------------------------------------------------------------------

group('what the app is allowed to recommend');

test('a row is a whisky because it carries a profile, not because of its section', function () {
  var items = SRC.allItems(DEMO.menu);
  var found = E.bottles(items);
  assert.strictEqual(found.length, DEMO.WHISKY.length);
  found.forEach(function (b) { assert.ok(b.whisky, b.name + ' should carry a profile'); });
});

test('beer and cocktails are never recommendable, however the sections are named', function () {
  var renamed = JSON.parse(JSON.stringify(DEMO.menu));
  renamed.sections.forEach(function (s, i) { s.title = 'Abschnitt ' + i; s.title_en = 'Section ' + i; });
  var before = E.bottles(SRC.allItems(DEMO.menu)).length;
  assert.strictEqual(E.bottles(SRC.allItems(renamed)).length, before,
    'renaming every section must not change what is recommendable');
});

test('a whisky with no profile yet is not offered', function () {
  var shelf = [row('Noch ohne Profil', null), row('Mit Profil', prof({}))];
  assert.deepStrictEqual(E.bottles(shelf).map(function (b) { return b.name; }), ['Mit Profil']);
});

// ------------------------------------------------------------------------

group('prices, read from the card and never written into the app');

test('the cheapest pour is what a budget is measured against', function () {
  var item = row('Talisker', prof({}));
  item.prices = [{ size: '4 cl', price: 13.4 }, { size: '2 cl', price: 6.9 }];
  assert.strictEqual(E.priceOf(item), 6.9);
});

test('price bands are cut at real prices from the shelf', function () {
  var bands = E.priceBands(SHELF);
  var onCard = SHELF.map(E.priceOf);
  assert.ok(bands.length >= 2, 'a spread shelf gives at least two bands');
  bands.forEach(function (b) {
    if (b.max != null) {
      assert.ok(onCard.indexOf(b.max) !== -1, b.max + ' is not a price on the card');
    }
  });
  assert.strictEqual(bands[bands.length - 1].max, null, 'the top band is open');
});

test('a shelf too small to split offers no bands at all', function () {
  assert.deepStrictEqual(E.priceBands([row('a', prof({}), { price: 5 })]), []);
});

// ------------------------------------------------------------------------

group('questions the shelf cannot answer are never asked');

test('a field with one value across the shelf cannot tell two bottles apart', function () {
  var flat = [
    row('a', prof({ origin: 'Speyside', peat: 0 })),
    row('b', prof({ origin: 'Speyside', peat: 0 }))
  ];
  var origin = Q.QUESTIONS.filter(function (q) { return q.id === 'origin'; })[0];
  var peat = Q.QUESTIONS.filter(function (q) { return q.id === 'peat'; })[0];
  assert.strictEqual(E.answerable(flat, origin), false);
  assert.strictEqual(E.answerable(flat, peat), false);
});

test('the same questions come back the moment the card carries the field', function () {
  var mixed = [
    row('a', prof({ origin: 'Speyside', peat: 0 })),
    row('b', prof({ origin: 'Islay', peat: 3 }))
  ];
  var origin = Q.QUESTIONS.filter(function (q) { return q.id === 'origin'; })[0];
  assert.strictEqual(E.answerable(mixed, origin), true);
});

test('every question in the flow names a field the engine knows how to count', function () {
  var cov = E.coverage(SHELF);
  Q.QUESTIONS.forEach(function (q) {
    assert.ok(q.needs, q.id + ' must say which field it scores against');
    assert.ok(q.needs === 'price' || cov[q.needs] !== undefined,
      q.id + ' asks about ' + q.needs + ', which coverage does not know');
  });
});

test('the preview shelf answers every question in the flow', function () {
  var cov = E.coverage(SHELF);
  Q.QUESTIONS.forEach(function (q) {
    if (q.needs === 'price') {
      assert.ok(E.priceBands(SHELF).length >= 2, 'price bands');
    } else {
      assert.ok(cov[q.needs] >= 2, q.needs + ' has only ' + cov[q.needs] + ' value(s)');
    }
  });
});

// ------------------------------------------------------------------------

group('hard rules, which are never relaxed');

test('no smoke means no smoke, even when it empties the shelf', function () {
  var shelf = [
    row('Lagavulin', prof({ peat: 4 })),
    row('Caol Ila', prof({ peat: 3 })),
    row('Talisker', prof({ peat: 2 }))
  ];
  var res = E.recommend(shelf, { peat: '0' });
  assert.strictEqual(res.items.length, 0, 'nothing is better than a smoky surprise');
});

test('a hint of smoke still reaches a guest who asked for none', function () {
  var shelf = [row('Oban', prof({ peat: 1 })), row('Lagavulin', prof({ peat: 4 }))];
  var res = E.recommend(shelf, { peat: '0' });
  assert.deepStrictEqual(res.items.map(function (i) { return i.bottle.name; }), ['Oban']);
});

test('a bottle whose smoke nobody recorded is treated as smoky', function () {
  var unknown = row('Ohne Angabe', prof({}));
  delete unknown.whisky.peat;
  var res = E.recommend([unknown], { peat: '0' });
  assert.strictEqual(res.items.length, 0);
});

test('a budget ceiling is never exceeded', function () {
  var res = E.recommend(SHELF, { budget: '1' });
  var ceiling = E.ceilingFor(SHELF, '1');
  assert.ok(res.items.length, 'the cheapest band should hold something');
  res.items.forEach(function (i) {
    assert.ok(E.priceOf(i.bottle) <= ceiling, i.bottle.name + ' is over the ceiling');
  });
});

test('a bottle with no price is not offered to a guest who set a ceiling', function () {
  var shelf = [
    row('Ohne Preis', prof({}), { noPrices: true }),
    row('Billig', prof({}), { price: 4 }),
    row('Mittel', prof({}), { price: 8 }),
    row('Teuer', prof({}), { price: 20 })
  ];
  var res = E.recommend(shelf, { budget: '1' });
  res.items.forEach(function (i) {
    assert.notStrictEqual(i.bottle.name, 'Ohne Preis');
  });
});

test('anything the guest ruled out is gone', function () {
  var shelf = [
    row('Mit Milch', prof({}), { allergens: ['Milch'] }),
    row('Ohne', prof({}))
  ];
  var res = E.recommend(shelf, { allergens: ['Milch'] });
  assert.deepStrictEqual(res.items.map(function (i) { return i.bottle.name; }), ['Ohne']);
});

// ------------------------------------------------------------------------

group('gates, relaxed only as far as we must and always said out loud');

test('a region we cannot serve is loosened, and the page is told which', function () {
  var shelf = [row('Speysider', prof({ origin: 'Speyside' }))];
  var res = E.recommend(shelf, { origin: ['Islay'] });
  assert.strictEqual(res.relaxed, 'origin');
  assert.strictEqual(res.items.length, 1);
});

test('a region we can serve is not loosened', function () {
  var shelf = [row('Islay', prof({ origin: 'Islay' })), row('Speysider', prof({ origin: 'Speyside' }))];
  var res = E.recommend(shelf, { origin: ['Islay'] });
  assert.strictEqual(res.relaxed, null);
  assert.deepStrictEqual(res.items.map(function (i) { return i.bottle.name; }), ['Islay']);
});

test('a first whisky is kept away from the heavy end of the shelf', function () {
  var shelf = [
    row('Rarität', prof({ level: 'rarität' })),
    row('Kenner', prof({ level: 'kenner' })),
    row('Einstieg', prof({ level: 'einstieg' }))
  ];
  var res = E.recommend(shelf, { level: 'einstieg' });
  assert.deepStrictEqual(res.items.map(function (i) { return i.bottle.name; }), ['Einstieg']);
  assert.strictEqual(res.relaxed, null);
});

test('region gives way before the beginner gate does', function () {
  var shelf = [
    row('Einstieg Speyside', prof({ level: 'einstieg', origin: 'Speyside' })),
    row('Kenner Islay', prof({ level: 'kenner', origin: 'Islay' }))
  ];
  var res = E.recommend(shelf, { level: 'einstieg', origin: ['Islay'] });
  assert.strictEqual(res.relaxed, 'origin');
  assert.deepStrictEqual(res.items.map(function (i) { return i.bottle.name; }), ['Einstieg Speyside']);
});

test('the beginner gate gives way rather than showing nothing at all', function () {
  var shelf = [row('Kenner', prof({ level: 'kenner' }))];
  var res = E.recommend(shelf, { level: 'einstieg' });
  assert.strictEqual(res.relaxed, 'level');
  assert.strictEqual(res.items.length, 1);
});

test('smoke we cannot supply is admitted rather than quietly swapped', function () {
  var shelf = [row('Sanft', prof({ peat: 0, level: 'einstieg' }))];
  var res = E.recommend(shelf, { peat: '4' });
  assert.strictEqual(res.smokeGap, true);
});

test('smoke we can supply is not apologised for', function () {
  var shelf = [row('Rauchig', prof({ peat: 4 })), row('Sanft', prof({ peat: 0 }))];
  assert.strictEqual(E.recommend(shelf, { peat: '4' }).smokeGap, false);
  assert.strictEqual(E.recommend(shelf, { peat: '3' }).smokeGap, false, 'one step off is close enough');
});

test('a guest who asked nothing about smoke is never told about a gap', function () {
  assert.strictEqual(E.recommend(SHELF, {}).smokeGap, false);
});

test('a hard rule is never rescued by relaxing a gate', function () {
  var shelf = [row('Rauchig teuer', prof({ peat: 4, level: 'rarität', origin: 'Islay' }), { price: 30 })];
  var res = E.recommend(shelf, { peat: '0', level: 'einstieg', origin: ['Speyside'] });
  assert.strictEqual(res.items.length, 0);
  assert.strictEqual(res.relaxed, null, 'nothing survived the hard rules, so nothing was loosened');
});

// ------------------------------------------------------------------------

group('scoring');

test('the bottle that tastes of what was asked for wins', function () {
  var shelf = [
    row('Passt', prof({ notes: ['dunkle früchte', 'schokolade'] })),
    row('Passt nicht', prof({ notes: ['blumig'] }))
  ];
  var res = E.recommend(shelf, { notes: ['dunkle früchte', 'schokolade'] });
  assert.strictEqual(res.items[0].bottle.name, 'Passt');
});

test('leaving it to the bar is not a tasting note to match', function () {
  var shelf = [row('a', prof({ notes: ['malzig'] })), row('b', prof({ notes: ['blumig'] }))];
  var res = E.recommend(shelf, { notes: [E.NO_PREFERENCE] });
  assert.strictEqual(res.items.length, 2);
  res.items.forEach(function (i) {
    assert.ok(!i.reasons.some(function (r) { return r.key === 'notes'; }),
      'no note was asked for, so none can be a reason');
  });
});

test('the level one rung away still counts, three rungs away does not', function () {
  var shelf = [
    row('Klassiker', prof({ level: 'klassiker' })),
    row('Rarität', prof({ level: 'rarität' }))
  ];
  var res = E.recommend(shelf, { level: 'kenner' });
  assert.strictEqual(res.items[0].bottle.name, 'Klassiker');
  var far = E.recommend([row('Rarität', prof({ level: 'rarität' }))], { level: 'einstieg' });
  assert.ok(!far.items[0].reasons.some(function (r) { return r.key === 'level'; }));
});

test('a match never claims more than 99 or less than 35 per cent', function () {
  [{}, { peat: '4', notes: ['blumig'], origin: ['Islay'], cask: ['Rumfass'], serve: 'Highball', level: 'einstieg' },
   { peat: '0' }, { notes: ['würzig'] }].forEach(function (answers) {
    E.recommend(SHELF, answers, { limit: 20 }).items.forEach(function (i) {
      assert.ok(i.match >= 35 && i.match <= 99, i.bottle.name + ' claimed ' + i.match);
    });
  });
});

test('at most three reasons are given, and each one is real', function () {
  var res = E.recommend(SHELF, { peat: '2', notes: ['maritim/salzig'], origin: ['Inseln'], serve: 'pur' }, { limit: 8 });
  res.items.forEach(function (i) {
    assert.ok(i.reasons.length <= 3);
    i.reasons.forEach(function (r) {
      if (r.key === 'origin') assert.strictEqual(i.bottle.whisky.origin, r.x);
      if (r.key === 'notes') {
        r.x.split(', ').forEach(function (n) {
          assert.ok(i.bottle.whisky.notes.indexOf(n) !== -1, i.bottle.name + ' does not taste ' + n);
        });
      }
      if (r.key === 'serve') assert.ok(i.bottle.whisky.serve.indexOf('pur') !== -1);
      if (r.key === 'peat_none') assert.strictEqual(i.bottle.whisky.peat, 0);
    });
  });
});

test('the same answers and the same seed give the same advice', function () {
  var a = { peat: '2', notes: ['würzig'] };
  var one = E.recommend(SHELF, a, { seed: 42 }).items.map(function (i) { return i.bottle.name; });
  var two = E.recommend(SHELF, a, { seed: 42 }).items.map(function (i) { return i.bottle.name; });
  assert.deepStrictEqual(one, two);
});

test('two guests at one table who ask for nothing in particular can get different bottles', function () {
  var seen = {};
  for (var s = 0; s < 40; s++) {
    seen[E.recommend(SHELF, {}, { seed: s }).items[0].bottle.name] = true;
  }
  assert.ok(Object.keys(seen).length > 1, 'free rein should not always land on the same bottle');
});

test('the jitter never overturns a clear winner', function () {
  var shelf = [
    row('Genau richtig', prof({ peat: 4, notes: ['schokolade', 'dunkle früchte'], origin: 'Islay' })),
    row('Daneben', prof({ peat: 0, notes: ['blumig'], origin: 'Lowlands' }))
  ];
  for (var s = 0; s < 50; s++) {
    var res = E.recommend(shelf, { peat: '4', notes: ['schokolade', 'dunkle früchte'], origin: ['Islay'] }, { seed: s });
    assert.strictEqual(res.items[0].bottle.name, 'Genau richtig', 'seed ' + s);
  }
});

test('the shelf handed in is never modified', function () {
  var before = JSON.stringify(SHELF);
  E.recommend(SHELF, { peat: '3', notes: ['würzig'], origin: ['Islay'], budget: '2' }, { limit: 8 });
  assert.strictEqual(JSON.stringify(SHELF), before);
});

test('total counts everything that survived, limit only what is shown', function () {
  var res = E.recommend(SHELF, {}, { limit: 3 });
  assert.strictEqual(res.items.length, 3);
  assert.strictEqual(res.total, SHELF.length);
});

// ------------------------------------------------------------------------

group('runner ups say how they differ, and the claim has to be true');

/* The house rule is that a second suggestion is never labelled "also a good
 * fit" when something separates it. The other half of that rule is that the
 * label must not be a story. Every contrast the engine can produce is checked
 * here against the two bottles it was produced from. */
function assertContrastTrue(hero, alt, c) {
  var h = hero.whisky, b = alt.whisky;
  var where = hero.name + ' vs ' + alt.name;
  if (c.kind === 'smokier') assert.ok(b.peat > h.peat, where + ' is not smokier');
  else if (c.kind === 'gentler') assert.ok(b.peat < h.peat, where + ' is not gentler');
  else if (c.kind === 'origin') {
    assert.strictEqual(b.origin, c.value, where + ' origin mislabelled');
    assert.notStrictEqual(b.origin, h.origin, where + ' is the same origin');
  } else if (c.kind === 'cask') {
    assert.ok(b.cask.indexOf(c.value) !== -1, where + ' never saw a ' + c.value);
    assert.ok(h.cask.indexOf(c.value) === -1, where + ' both saw a ' + c.value);
  } else if (c.kind === 'older') assert.ok(b.age_years - h.age_years >= 3, where + ' is not older');
  else if (c.kind === 'younger') assert.ok(h.age_years - b.age_years >= 3, where + ' is not younger');
  else if (c.kind === 'dearer') assert.ok(E.priceOf(alt) / E.priceOf(hero) >= 1.25, where + ' is not dearer');
  else if (c.kind === 'cheaper') assert.ok(E.priceOf(hero) / E.priceOf(alt) >= 1.25, where + ' is not cheaper');
  else if (c.kind === 'note') {
    assert.ok(b.notes.indexOf(c.value) !== -1, where + ' does not taste ' + c.value);
    assert.ok(h.notes.indexOf(c.value) === -1, where + ' both taste ' + c.value);
  } else assert.fail('unknown contrast ' + c.kind);
}

test('every contrast the engine produces is true of that pair', function () {
  var peats = ['', '0', '1', '2', '3', '4'];
  var noteSets = [[], ['würzig'], ['maritim/salzig', 'schokolade'], ['blumig'], [E.NO_PREFERENCE]];
  var origins = [[], ['Islay'], ['Speyside', 'Highlands'], ['USA']];
  var checked = 0;
  peats.forEach(function (p) {
    noteSets.forEach(function (n) {
      origins.forEach(function (o) {
        for (var seed = 0; seed < 3; seed++) {
          var res = E.recommend(SHELF, { peat: p, notes: n, origin: o }, { seed: seed, limit: 8 });
          res.items.forEach(function (item, i) {
            if (i === 0) { assert.strictEqual(item.contrast, null); return; }
            if (item.contrast) { assertContrastTrue(res.items[0].bottle, item.bottle, item.contrast); checked++; }
          });
        }
      });
    });
  });
  assert.ok(checked > 100, 'only checked ' + checked + ' contrasts, expected the shelf to produce more');
});

test('two bottles with nothing between them are not given an invented difference', function () {
  var same = prof({});
  assert.strictEqual(E.contrastOf(row('a', same), row('b', JSON.parse(JSON.stringify(same)))), null);
});

test('smoke is the difference a guest is told about first', function () {
  var hero = row('Sanft', prof({ peat: 0, origin: 'Speyside', notes: ['blumig'] }));
  var alt = row('Rauchig', prof({ peat: 4, origin: 'Islay', notes: ['würzig'] }));
  assert.strictEqual(E.contrastOf(hero, alt).kind, 'smokier');
});

// ------------------------------------------------------------------------

group('the copy has a home for everything the engine can say');

test('every reason key the engine emits has copy in both languages', function () {
  var emitted = {};
  [{}, { peat: '0' }, { peat: '2' }, { peat: '3' }, { notes: ['würzig'] }, { origin: ['Islay'] },
   { cask: ['Sherryfass'] }, { serve: 'pur' }, { level: 'kenner' }, { budget: '1' }].forEach(function (a) {
    E.recommend(SHELF, a, { limit: 8 }).items.forEach(function (i) {
      i.reasons.forEach(function (r) { emitted[r.key] = true; });
    });
  });
  Object.keys(emitted).forEach(function (key) {
    assert.ok(Q.UI.de.reasons[key], 'no German copy for reason ' + key);
    assert.ok(Q.UI.en.reasons[key], 'no English copy for reason ' + key);
  });
  assert.ok(Object.keys(emitted).length >= 8, 'expected the shelf to exercise most reasons');
});

test('every contrast kind the engine can emit has copy in both languages', function () {
  ['smokier', 'gentler', 'origin', 'cask', 'older', 'younger', 'cheaper', 'dearer', 'note']
    .forEach(function (kind) {
      assert.ok(Q.UI.de.contrast[kind], 'no German copy for contrast ' + kind);
      assert.ok(Q.UI.en.contrast[kind], 'no English copy for contrast ' + kind);
    });
});

test('a guest is never offered an answer nothing on the shelf carries', function () {
  E.tailor(SHELF, Q.QUESTIONS).forEach(function (cut) {
    if (cut.bands || cut.q.type === 'scale') return;
    var live = E.valuesOf(SHELF, cut.q.needs);
    (cut.options || cut.q.options).forEach(function (o) {
      if (o.exclusive) return;
      assert.ok(live.indexOf(o.value) !== -1,
        'the ' + cut.q.id + ' question still offers ' + o.value + ', which no bottle carries');
    });
  });
});

test('a region behind the bar survives the cut and one that is not does not', function () {
  var origin = E.tailor(SHELF, Q.QUESTIONS).filter(function (c) { return c.q.id === 'origin'; })[0];
  var offered = origin.options.map(function (o) { return o.value; });
  assert.ok(offered.indexOf('Islay') !== -1, 'Islay is on the shelf and should be offered');
  assert.ok(offered.indexOf('Campbeltown') === -1, 'nothing on the shelf is from Campbeltown');
});

test('the smoke scale keeps every stop even where the shelf has no unpeated malt', function () {
  var smoky = [row('a', prof({ peat: 3 })), row('b', prof({ peat: 4 }))];
  var peat = E.tailor(smoky, Q.QUESTIONS).filter(function (c) { return c.q.id === 'peat'; })[0];
  assert.ok(peat, 'the smoke question should survive');
  assert.strictEqual(peat.options, undefined, 'a scale is never cut down to what exists');
});

test('a question left with one usable answer is dropped rather than asked', function () {
  var oneRegion = [
    row('a', prof({ origin: 'Islay', peat: 1 })),
    row('b', prof({ origin: 'Islay', peat: 3 }))
  ];
  var ids = E.tailor(oneRegion, Q.QUESTIONS).map(function (c) { return c.q.id; });
  assert.ok(ids.indexOf('origin') === -1, 'one region is not a choice');
  assert.ok(ids.indexOf('peat') !== -1, 'smoke still separates these two');
});

test('the whole flow survives a shelf that carries everything', function () {
  var ids = E.tailor(SHELF, Q.QUESTIONS).map(function (c) { return c.q.id; });
  assert.deepStrictEqual(ids, Q.QUESTIONS.map(function (q) { return q.id; }));
});

test('an empty shelf asks nothing at all', function () {
  assert.deepStrictEqual(E.tailor([], Q.QUESTIONS), []);
});

test('every note the flow offers has a name and a comparative in both languages', function () {
  var notes = Q.QUESTIONS.filter(function (q) { return q.id === 'notes'; })[0];
  notes.options.forEach(function (o) {
    if (o.exclusive) return;
    ['de', 'en'].forEach(function (lang) {
      assert.ok(Q.UI[lang].noteNames[o.value], lang + ' has no name for ' + o.value);
      assert.ok(Q.UI[lang].noteCompare[o.value], lang + ' has no comparative for ' + o.value);
    });
  });
});

/* A note can reach a guest through a runner up label without ever having been
 * offered as an answer, so the copy has to cover the shelf and not just the
 * flow. This is the test that catches a new note arriving on the card. */
test('every note on the shelf has a comparative in both languages', function () {
  E.valuesOf(SHELF, 'notes').forEach(function (n) {
    ['de', 'en'].forEach(function (lang) {
      assert.ok(Q.UI[lang].noteCompare[n], lang + ' has no comparative for ' + n + ', which is on the shelf');
    });
  });
});

/* The same for the values quoted back on a card or in a runner up label.
 * German values pass through untouched, English ones need a translation. */
test('every origin, cask and serve on the shelf can be said in English', function () {
  ['origin', 'cask', 'serve'].forEach(function (field) {
    E.valuesOf(SHELF, field).forEach(function (v) {
      var hasEnglishArray = SHELF.some(function (b) { return b.whisky[field + '_en']; });
      assert.ok(Q.VALUE_EN[v] || /^[A-Za-z ]+$/.test(v) || hasEnglishArray,
        v + ' has no English form anywhere');
    });
  });
});

test('every peat stop has a spoken name in both languages', function () {
  var peat = Q.QUESTIONS.filter(function (q) { return q.id === 'peat'; })[0];
  ['de', 'en'].forEach(function (lang) {
    assert.strictEqual(Q.UI[lang].peatNames.length, peat.options.length);
  });
});

test('the house voice rules hold in every guest facing string', function () {
  var banned = /[–—:;•]|\s-\s/;
  var offenders = [];
  function walk(node, path) {
    if (typeof node === 'string') {
      // {x} placeholders and price formatting are allowed, prose punctuation is not.
      if (banned.test(node)) offenders.push(path + '  ' + node);
      return;
    }
    if (node && typeof node === 'object') {
      Object.keys(node).forEach(function (k) { walk(node[k], path + '.' + k); });
    }
  }
  walk(Q.UI, 'UI');
  SHELF.forEach(function (b) {
    walk({
      description: b.description, description_en: b.description_en,
      bartender_note: b.bartender_note, bartender_note_en: b.bartender_note_en
    }, 'shelf.' + b.name);
  });
  Q.QUESTIONS.forEach(function (q) {
    walk({ title: q.title, sub: q.sub }, 'Q.' + q.id);
    q.options.forEach(function (o) { walk({ label: o.label, hint: o.hint }, 'Q.' + q.id + '.' + o.value); });
  });
  assert.deepStrictEqual(offenders, [], 'no dashes, colons or semicolons in guest copy');
});

// ------------------------------------------------------------------------

console.log('\n' + passed + ' passed' + (process.exitCode ? ', SOME FAILED' : '') + '\n');
