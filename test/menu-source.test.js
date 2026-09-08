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
  content_hash: 'fa59f27a2a8dc192',
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
      on_printed_menu: true, popularity_rank: 9999,
      image: 'https://brunnenbar.com/img/helles.jpg', menu_class: 'plowhorse'
    }] },
    { title: 'Wein', title_en: 'Wine', items: [{
      name: 'Riesling', name_en: 'Riesling', group: 'Weisswein', group_en: 'White wine',
      price: 6.5, prices: [{ size: '0,2 l', price: 6.5 }, { size: '0,5 l', price: 15 }],
      description: 'Trocken.', description_en: '',
      bartender_note: '', bartender_note_en: '',
      ingredients: [], ingredients_en: [], strength: '',
      allergens: ['Sulfite'], allergens_en: ['Sulphites'], allergen_codes: [12],
      alcohol_free: false, pos_sku: '', hidden_on_card: false,
      on_printed_menu: true, popularity_rank: 40,
      image: null, menu_class: 'star'
    }] },
    { title: 'Tequila & Mezcal Neat', title_en: 'Tequila & mezcal neat', items: [{
      name: 'Don Julio Reposado 4cl', name_en: 'Don Julio Reposado 4cl',
      group: 'Reposado', group_en: 'Reposado',
      price: 9.5, prices: [{ size: '4 cl', price: 9.5 }],
      description: 'Acht Monate im Fass.', description_en: 'Eight months in cask.',
      bartender_note: '', bartender_note_en: '',
      // A neat pour can name its own bottle here. It is still not a cocktail.
      ingredients: ['Don Julio Reposado'], ingredients_en: ['Don Julio Reposado'],
      strength: 'stark', allergens: [], allergens_en: [], allergen_codes: [],
      alcohol_free: false, pos_sku: '', hidden_on_card: false,
      on_printed_menu: true, popularity_rank: 12, image: null, menu_class: 'puzzle',
      brand: 'Don Julio', agave_kind: 'Reposado',
      agave_expression: 'Don Julio Reposado', agave_region: 'Los Altos, Jalisco',
      additive_free: true
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
  assert.strictEqual(menu.sections.length, 3);
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

q('notices a real change through content_hash, and ignores a rebuild', function () {
  var a = { published_at: '2026-09-07T23:10:16+02:00', content_hash: 'aaa' };
  // Same content, built again. published_at moved, the hash did not.
  var rebuilt = { published_at: '2026-09-08T04:00:00+02:00', content_hash: 'aaa' };
  var edited = { published_at: '2026-09-08T04:00:00+02:00', content_hash: 'bbb' };
  assert.strictEqual(src.hasChanged(a, rebuilt), false, 'a rebuild is not a change');
  assert.strictEqual(src.hasChanged(a, edited), true);
});

q('falls back to published_at when a payload carries no hash', function () {
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
    ['Augustiner Helles 0,5l', 'Riesling', 'Don Julio Reposado 4cl']);
  assert.strictEqual(items[0].section, 'Bier');
  assert.strictEqual(items[1].section_en, 'Wine');
});

q('a till article never reaches a guest', function () {
  var hidden = JSON.parse(JSON.stringify(MENU));
  hidden.sections[0].items[0].hidden_on_card = true;
  var shown = src.allItems(hidden).map(function (i) { return i.name; });
  assert.strictEqual(shown.indexOf('Augustiner Helles 0,5l'), -1,
    'hidden_on_card is a till article, not a guest position');
  assert.strictEqual(shown.length, 2, 'and nothing else is dropped with it');
});

q('availability is still not filtered, everything published is orderable', function () {
  assert.strictEqual(src.allItems(MENU).length, 3, 'the only filtering is hidden_on_card');
});

q('beer and wine are carried but never scored, without naming any section', function () {
  assert.strictEqual(src.allItems(MENU).length, 3, 'everything stays available to list');
  assert.strictEqual(src.scoreableItems(MENU).length, 0, 'nothing without ingredients is scored');

  var withCocktail = JSON.parse(JSON.stringify(MENU));
  withCocktail.sections.push({ title: 'Sours', title_en: 'Sours', items: [{
    name: 'Whiskey Sour', name_en: 'Whiskey Sour', group: '', group_en: '',
    price: 9.7, prices: [{ size: '', price: 9.7 }],
    description: 'x', description_en: 'x', bartender_note: '', bartender_note_en: '',
    ingredients: ['Four Roses', 'Zitrone', 'Zucker'],
    ingredients_en: ['Four Roses', 'Lemon', 'Sugar'],
    strength: 'stark', allergens: ['Ei'], allergens_en: ['Egg'], allergen_codes: [3],
    alcohol_free: false, pos_sku: '', hidden_on_card: false,
    on_printed_menu: true, popularity_rank: 8
  }] });
  var scoreable = src.scoreableItems(withCocktail);
  assert.strictEqual(scoreable.length, 1);
  assert.strictEqual(scoreable[0].name, 'Whiskey Sour');
});

q('the cocktail test does not depend on section names', function () {
  var renamed = JSON.parse(JSON.stringify(MENU));
  renamed.sections[0].title = 'Etwas ganz Neues';
  assert.strictEqual(src.scoreableItems(renamed).length, 0,
    'renaming a section must not change what is scoreable');
});

console.log('\nThe rules the second brief added');

q('a neat pour is never recommended as a cocktail', function () {
  // Don Julio Reposado lists itself as its own ingredient, so the ingredient
  // test alone would have called it a cocktail.
  var neat = src.allItems(MENU).filter(function (i) { return i.brand; })[0];
  assert.ok(neat, 'fixture should carry a neat pour');
  assert.ok(neat.ingredients.length, 'and it does have an ingredient list');
  assert.strictEqual(src.isNeatSpirit(neat), true);
  assert.strictEqual(src.isScoreable(neat), false,
    'the cocktail app must not recommend a bottle poured neat');
});

q('the neat sections are still carried, for the other two apps', function () {
  var names = src.allItems(MENU).map(function (i) { return i.name; });
  assert.ok(names.indexOf('Don Julio Reposado 4cl') !== -1,
    'the tequila app reads the same one source');
});

q('a missing photo is null and not an empty string or a broken link', function () {
  var items = src.allItems(MENU);
  assert.strictEqual(src.imageOf(items[0]), 'https://brunnenbar.com/img/helles.jpg');
  assert.strictEqual(src.imageOf(items[1]), null, 'Riesling has no photo');
  assert.strictEqual(src.imageOf({}), null);
  assert.strictEqual(src.imageOf({ image: '' }), null, 'an empty string is not a photo');
});

q('the internal grading is named as internal', function () {
  // menu_class grades margin and popularity. Showing a guest that the drink
  // they are about to order is a "dog" would be quite a thing to ship.
  assert.ok(src.INTERNAL_FIELDS.indexOf('menu_class') !== -1);
  assert.ok(src.INTERNAL_FIELDS.indexOf('pos_sku') !== -1);
});

q('the endpoint is asked at most hourly', function () {
  assert.strictEqual(src.MAX_AGE_MS, 60 * 60 * 1000, 'the brief sets the ceiling at hourly');
});

queue.then(function () {
  console.log('\n' + passed + ' passed' + (process.exitCode ? ', SOME FAILED' : '') + '\n');
});
