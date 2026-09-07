/*
 * Menu API loader tests — run with:  node test/menu-source.test.js
 *
 * The live endpoint is unreachable from the build environment, so these run
 * against a fixture shaped exactly like the documented WordPress response.
 * They pin the behaviour the brief asks for, in particular the two rules that
 * would otherwise be tempting to soften: never fall back to a bundled copy,
 * and never repair broken encoding.
 */
'use strict';

var assert = require('assert');
var src = require('../assets/menu-source.js');

var passed = 0;
function test(name, fn) {
  try {
    var r = fn();
    if (r && typeof r.then === 'function') return r.then(
      function () { passed++; console.log('  ok   ' + name); },
      function (e) { console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; });
    passed++; console.log('  ok   ' + name);
  } catch (err) {
    console.error('  FAIL ' + name + '\n       ' + err.message); process.exitCode = 1;
  }
  return Promise.resolve();
}

// ------------------------------------------------------------- fixtures ---

var MENU = {
  name: 'BrunnenBar',
  generated: '2026-09-07',
  published_at: '2026-09-07T23:10:16+02:00',
  languages: ['de', 'en'],
  allergens: { de: { '1': 'Glutenhaltige Getreide' }, en: { '1': 'Cereals containing gluten' },
               intro_de: 'i', intro_en: 'i', outro_de: 'o', outro_en: 'o' },
  sections: [
    { title: 'Bier', title_en: 'Beer', items: [{
      name: 'Augustiner Helles 0,5l', name_en: 'Augustiner Helles 0,5l',
      group: 'Helles', group_en: 'Lager',
      price: 4.4, prices: [{ size: '', price: 4.4 }],
      description: 'Münchens Kult-Helles.', description_en: "Munich's cult lager.",
      bartender_note: '', bartender_note_en: '',
      ingredients: [], ingredients_en: [], strength: '',
      allergens: ['Gluten'], allergens_en: ['Gluten'], allergen_codes: [1],
      alcohol_free: false, pos_sku: '', hidden_on_card: false,
      on_printed_menu: true, popularity_rank: 9999
    }] },
    { title: 'Wein', title_en: 'Wine', items: [{
      name: 'Riesling', name_en: 'Riesling', group: 'Weisswein', group_en: 'White wine',
      price: 6.5, prices: [{ size: '0,2 l', price: 6.5 }, { size: '0,5 l', price: 15 }],
      description: 'Trocken.', description_en: '',
      bartender_note: '', bartender_note_en: '',
      ingredients: [], ingredients_en: [], strength: '',
      allergens: ['Sulfite'], allergens_en: ['Sulphites'], allergen_codes: [12],
      alcohol_free: false, pos_sku: '', hidden_on_card: false,
      on_printed_menu: true, popularity_rank: 40
    }] }
  ]
};

function page(json) {
  return { content: { rendered: '<p>x</p><pre id="bb-menu">' + json + '</pre><p>y</p>' } };
}
function ok(body) {
  return { ok: true, status: 200, json: function () { return Promise.resolve(body); } };
}
function jsonText(o) { return JSON.stringify(o); }

// in-memory localStorage
function fakeStore() {
  var m = {};
  return { getItem: function (k) { return k in m ? m[k] : null; },
           setItem: function (k, v) { m[k] = String(v); },
           removeItem: function (k) { delete m[k]; }, _m: m };
}
globalThis.localStorage = fakeStore();

// -------------------------------------------------------------- parsing ---

console.log('\nReading the one source');

var queue = Promise.resolve();
function q(name, fn) { queue = queue.then(function () { return test(name, fn); }); }

q('pulls the menu out of the pre block and ignores the rest of the page', function () {
  var menu = src.extract(page(jsonText(MENU)));
  assert.strictEqual(menu.name, 'BrunnenBar');
  assert.strictEqual(menu.sections.length, 2);
});

q('refuses a page with no menu block', function () {
  assert.throws(function () { src.extract({ content: { rendered: '<p>nothing</p>' } }); },
    /Menu Block nicht gefunden/);
});

q('reports HTML entities instead of repairing them', function () {
  // The brief is explicit: if &amp; shows up the pipeline is broken, say so.
  var broken = page('{"name":"Gin &amp; Tonic","sections":[]}');
  assert.throws(function () { src.extract(broken); }, /pipeline is broken/);
});

q('accepts the unicode-escaped ampersand the pipeline actually emits', function () {
  var fine = page('{"name":"Gin \\u0026 Tonic","sections":[]}');
  assert.strictEqual(src.extract(fine).name, 'Gin & Tonic');
});

console.log('\nFetching, caching, failing');

q('fetches with cache disabled and the documented URL', function () {
  src._reset();
  var seen = {};
  return src.loadMenu({ fetchImpl: function (url, init) {
    seen.url = url; seen.init = init; return Promise.resolve(ok(page(jsonText(MENU))));
  } }).then(function (out) {
    assert.strictEqual(seen.url, 'https://brunnenbar.com/wp-json/wp/v2/pages/217?_fields=content');
    assert.strictEqual(seen.init.cache, 'no-store');
    assert.strictEqual(out.fromCache, false);
    assert.strictEqual(out.menu.name, 'BrunnenBar');
  });
});

q('reuses a recent menu instead of hammering the endpoint', function () {
  src._reset();
  var calls = 0;
  var f = function () { calls++; return Promise.resolve(ok(page(jsonText(MENU)))); };
  return src.loadMenu({ fetchImpl: f })
    .then(function () { return src.loadMenu({ fetchImpl: f }); })
    .then(function () { assert.strictEqual(calls, 1, 'should have used the in-memory copy'); });
});

q('goes back to the network once the copy is older than the max age', function () {
  src._reset();
  var calls = 0;
  var f = function () { calls++; return Promise.resolve(ok(page(jsonText(MENU)))); };
  var t0 = Date.now();
  return src.loadMenu({ fetchImpl: f, now: t0 })
    .then(function () { return src.loadMenu({ fetchImpl: f, now: t0 + src.MAX_AGE_MS + 1 }); })
    .then(function () { assert.strictEqual(calls, 2); });
});

q('surfaces the HTTP status when the endpoint answers badly', function () {
  src._reset();
  globalThis.localStorage = fakeStore();          // nothing saved yet
  return src.loadMenu({ fetchImpl: function () {
    return Promise.resolve({ ok: false, status: 503, json: function () { return Promise.resolve({}); } });
  } }).then(function () { throw new Error('should have rejected'); },
            function (err) { assert.match(err.message, /Menu HTTP 503/); });
});

q('falls back to the last response THIS browser received, and dates it', function () {
  src._reset();
  globalThis.localStorage = fakeStore();
  return src.loadMenu({ fetchImpl: function () { return Promise.resolve(ok(page(jsonText(MENU)))); } })
    .then(function () {
      src._reset();                                // new page load
      return src.loadMenu({ fetchImpl: function () { return Promise.reject(new Error('offline')); } });
    })
    .then(function (out) {
      assert.strictEqual(out.fromCache, true, 'should be serving the saved copy');
      assert.strictEqual(out.menu.name, 'BrunnenBar');
      assert.ok(typeof out.ageMs === 'number', 'the interface needs the age to show it');
      assert.ok(out.error, 'the original failure should still be reported');
    });
});

q('fails outright rather than inventing a menu when nothing was ever saved', function () {
  src._reset();
  globalThis.localStorage = fakeStore();
  return src.loadMenu({ fetchImpl: function () { return Promise.reject(new Error('offline')); } })
    .then(function () { throw new Error('should have rejected'); },
          function (err) { assert.match(err.message, /offline/); });
});

q('notices a republish through published_at', function () {
  var older = { published_at: '2026-09-07T23:10:16+02:00' };
  var newer = { published_at: '2026-09-08T10:00:00+02:00' };
  assert.strictEqual(src.hasChanged(older, older), false);
  assert.strictEqual(src.hasChanged(older, newer), true);
});

console.log('\nPresenting what it returns');

q('prices come from the prices array, in German, every size shown', function () {
  var items = src.allItems(MENU);
  var bier = items[0], wein = items[1];
  assert.deepStrictEqual(src.priceList(bier), ['4,40 €']);
  assert.deepStrictEqual(src.priceList(wein), ['0,2 l  6,50 €', '0,5 l  15,00 €']);
});

q('English is used where present and falls back per field', function () {
  var items = src.allItems(MENU);
  assert.strictEqual(src.field(items[0], 'description', 'en'), "Munich's cult lager.");
  assert.strictEqual(src.field(items[0], 'description', 'de'), 'Münchens Kult-Helles.');
  // Riesling has no English description, so German shows rather than a blank.
  assert.strictEqual(src.field(items[1], 'description', 'en'), 'Trocken.');
});

q('section order and item order are preserved exactly', function () {
  var items = src.allItems(MENU);
  assert.deepStrictEqual(items.map(function (i) { return i.name; }),
    ['Augustiner Helles 0,5l', 'Riesling']);
  assert.strictEqual(items[0].section, 'Bier');
  assert.strictEqual(items[1].section_en, 'Wine');
});

q('nothing is filtered out, since everything published is orderable', function () {
  var hidden = JSON.parse(JSON.stringify(MENU));
  hidden.sections[0].items[0].hidden_on_card = true;
  assert.strictEqual(src.allItems(hidden).length, 2,
    'hidden_on_card only means it is off the printed card');
});

queue.then(function () {
  console.log('\n' + passed + ' passed' + (process.exitCode ? ', SOME FAILED' : '') + '\n');
});
