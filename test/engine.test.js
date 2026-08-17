/*
 * Engine tests — run with:  node test/engine.test.js
 * No framework, no dependencies. Exits non-zero on failure.
 */
'use strict';

var assert = require('assert');
var engine = require('../assets/engine.js');
var data = require('../data/cocktails.js');
var questions = require('../data/questions.js');

var MENU = data.COCKTAILS;
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

function ids(result) {
  return result.items.map(function (i) { return i.cocktail.id; });
}

function ask(overrides) {
  return Object.assign({
    occasion: 'main', strength: '2', spirit: [], avoid: [],
    flavour: 'citrus', texture: '', adventure: '2', avoidFlags: []
  }, overrides);
}

console.log('\nData integrity');

test('every cocktail has a unique id', function () {
  var seen = {};
  MENU.forEach(function (c) {
    assert.ok(!seen[c.id], 'duplicate id: ' + c.id);
    seen[c.id] = true;
  });
});

test('every cocktail is fully populated', function () {
  var dims = ['sour', 'sweet', 'bitter', 'herbal', 'fruity', 'boozy', 'creamy', 'smoky', 'spicy', 'fresh'];
  var textures = ['long', 'short', 'frothy', 'sparkling', 'hot', 'shot'];
  MENU.forEach(function (c) {
    assert.ok(c.name, c.id + ': missing name');
    assert.ok(data.BASES.indexOf(c.base) !== -1, c.id + ': unknown base ' + c.base);
    assert.ok(textures.indexOf(c.texture) !== -1, c.id + ': unknown texture ' + c.texture);
    assert.ok(c.strength >= 0 && c.strength <= 3, c.id + ': strength out of range');
    assert.ok(c.adventure >= 0 && c.adventure <= 3, c.id + ': adventure out of range');
    assert.ok((c.occasion || []).length > 0, c.id + ': no occasion');
    assert.ok(c.ing.de.length && c.ing.en.length, c.id + ': missing ingredients');
    assert.ok(c.note.de && c.note.en, c.id + ': missing bartender note');
    assert.ok(c.glass.de && c.glass.en, c.id + ': missing glassware');
    dims.forEach(function (d) {
      assert.ok(typeof c.profile[d] === 'number' && c.profile[d] >= 0 && c.profile[d] <= 4,
        c.id + ': profile.' + d + ' out of range');
    });
  });
});

test('zero-proof drinks are flagged consistently in both directions', function () {
  MENU.forEach(function (c) {
    if (c.naOf) {
      var parent = MENU.filter(function (x) { return x.id === c.naOf; })[0];
      assert.ok(parent, c.id + ': naOf points at missing ' + c.naOf);
      assert.strictEqual(parent.hasNA, c.id, c.naOf + ': hasNA does not point back');
      assert.strictEqual(c.strength, 0, c.id + ': zero-proof build must have strength 0');
      assert.strictEqual(c.base, 'none', c.id + ': zero-proof build must have base "none"');
      assert.strictEqual(c.profile.boozy, 0, c.id + ': zero-proof build must not read boozy');
    }
    if (c.hasNA) {
      var na = MENU.filter(function (x) { return x.id === c.hasNA; })[0];
      assert.ok(na, c.id + ': hasNA points at missing ' + c.hasNA);
    }
  });
});

test('every question option value is reachable and every flag is offered', function () {
  var offeredFlags = questions.QUESTIONS
    .filter(function (q) { return q.id === 'avoidFlags'; })[0]
    .options.map(function (o) { return o.value; });
  MENU.forEach(function (c) {
    (c.flags || []).forEach(function (f) {
      assert.ok(offeredFlags.indexOf(f) !== -1, c.id + ': flag "' + f + '" cannot be filtered out by any question');
    });
  });
});

console.log('\nHard rules — these must never be violated');

test('an allergen exclusion is absolute', function () {
  ['egg', 'dairy', 'nuts', 'coffee'].forEach(function (flag) {
    var res = engine.recommend(MENU, ask({ avoidFlags: [flag] }), { limit: 99 });
    res.items.forEach(function (i) {
      assert.ok((i.cocktail.flags || []).indexOf(flag) === -1,
        i.cocktail.id + ' surfaced despite "' + flag + '" being excluded');
    });
  });
});

test('excluding every allergen at once still never leaks one through', function () {
  var res = engine.recommend(MENU, ask({ avoidFlags: ['egg', 'dairy', 'nuts', 'coffee'] }), { limit: 99 });
  assert.ok(res.items.length > 0, 'should still have plenty to offer');
  res.items.forEach(function (i) {
    assert.strictEqual((i.cocktail.flags || []).length, 0, i.cocktail.id + ' has flags but was shown');
  });
});

test('a rejected spirit never appears, as base or as support', function () {
  var res = engine.recommend(MENU, ask({ avoid: ['whiskey', 'aperitivo'] }), { limit: 99 });
  res.items.forEach(function (i) {
    var c = i.cocktail;
    assert.notStrictEqual(c.base, 'whiskey', c.id + ' is whiskey-based');
    assert.notStrictEqual(c.base, 'aperitivo', c.id + ' is aperitivo-based');
    assert.ok((c.also || []).indexOf('whiskey') === -1, c.id + ' contains whiskey');
    assert.ok((c.also || []).indexOf('aperitivo') === -1, c.id + ' contains aperitivo');
  });
});

test('Boulevardier is dropped for "nothing bitter" even though it is bourbon-based', function () {
  var res = engine.recommend(MENU, ask({ avoid: ['aperitivo'] }), { limit: 99 });
  assert.ok(ids(res).indexOf('boulevardier') === -1, 'Campari slipped through via the `also` field');
  assert.ok(ids(res).indexOf('negroni') === -1);
  assert.ok(ids(res).indexOf('take-it-easy') === -1);
});

test('hard rules are never relaxed, even when they empty the pool', function () {
  // Nothing on the card is a nut-free, dairy-free, egg-free HOT shot.
  var res = engine.recommend(MENU, ask({
    occasion: 'shot', avoidFlags: ['egg', 'dairy', 'nuts', 'coffee'], avoid: ['vodka', 'whiskey', 'rum']
  }), { limit: 99 });
  res.items.forEach(function (i) {
    assert.strictEqual((i.cocktail.flags || []).length, 0);
    assert.ok(['vodka', 'whiskey', 'rum'].indexOf(i.cocktail.base) === -1);
  });
});

console.log('\nGates');

test('zero proof returns only zero-proof builds', function () {
  var res = engine.recommend(MENU, ask({ strength: '0' }), { limit: 99 });
  assert.ok(res.items.length >= 3, 'expected the three alcohol-free builds');
  res.items.forEach(function (i) {
    assert.strictEqual(i.cocktail.strength, 0, i.cocktail.id + ' is not alcohol-free');
  });
});

test('asking for alcohol never returns a zero-proof build', function () {
  ['1', '2', '3'].forEach(function (s) {
    var res = engine.recommend(MENU, ask({ strength: s }), { limit: 99 });
    res.items.forEach(function (i) {
      assert.notStrictEqual(i.cocktail.strength, 0, i.cocktail.id + ' is alcohol-free but strength ' + s + ' was asked');
    });
  });
});

test('shots are only offered when shots were asked for', function () {
  var evening = engine.recommend(MENU, ask({ occasion: 'main' }), { limit: 99 });
  evening.items.forEach(function (i) {
    assert.notStrictEqual(i.cocktail.texture, 'shot', i.cocktail.id + ' is a shot but the guest wanted an evening drink');
  });
  var round = engine.recommend(MENU, ask({ occasion: 'shot' }), { limit: 99 });
  assert.ok(round.items.length >= 3, 'expected all three shots');
  round.items.forEach(function (i) {
    assert.strictEqual(i.cocktail.texture, 'shot', i.cocktail.id + ' is not a shot');
  });
});

test('an impossible-but-legal combination relaxes a gate rather than returning nothing', function () {
  // Zero proof + a round of shots: no such thing on the card.
  var res = engine.recommend(MENU, ask({ occasion: 'shot', strength: '0' }), { limit: 99 });
  assert.ok(res.items.length > 0, 'should fall back rather than show an empty screen');
  assert.strictEqual(res.relaxed, 'shot');
  res.items.forEach(function (i) {
    assert.strictEqual(i.cocktail.strength, 0, 'relaxing the shot gate must not smuggle alcohol in');
  });
});

console.log('\nRecommendation quality');

test('bitter + spirit-forward + nightcap surfaces the bitter stirred drinks', function () {
  var res = engine.recommend(MENU, ask({
    occasion: 'nightcap', strength: '3', flavour: 'bitter', texture: 'short', adventure: '2'
  }));
  var top = ids(res).slice(0, 3);
  assert.ok(top.indexOf('negroni') !== -1 || top.indexOf('boulevardier') !== -1,
    'expected Negroni or Boulevardier in the top three, got: ' + top.join(', '));
});

test('smoky picks up the mezcal Margarita', function () {
  var res = engine.recommend(MENU, ask({ flavour: 'smoky', strength: '3', adventure: '2' }));
  assert.ok(ids(res).slice(0, 3).indexOf('margarita-rojas') !== -1,
    'expected Margarita Rojas, got: ' + ids(res).slice(0, 3).join(', '));
});

test('rich + nightcap surfaces the Espresso Martini', function () {
  var res = engine.recommend(MENU, ask({
    occasion: 'nightcap', strength: '3', flavour: 'rich', adventure: '0'
  }));
  assert.ok(ids(res).slice(0, 3).indexOf('espresso-martini') !== -1,
    'expected Espresso Martini, got: ' + ids(res).slice(0, 3).join(', '));
});

test('rich + no caffeine drops the Espresso Martini entirely', function () {
  var res = engine.recommend(MENU, ask({
    occasion: 'nightcap', strength: '3', flavour: 'rich', avoidFlags: ['coffee']
  }), { limit: 99 });
  assert.ok(ids(res).indexOf('espresso-martini') === -1);
});

test('herbal + gin lands on a herbal gin drink', function () {
  var res = engine.recommend(MENU, ask({ flavour: 'herbal', spirit: ['gin'], adventure: '2' }));
  var top = ids(res).slice(0, 3);
  assert.ok(top.indexOf('gin-basil-smash') !== -1 || top.indexOf('ricky-ricky') !== -1,
    'expected Gin Basil Smash or Ricky Ricky, got: ' + top.join(', '));
});

test('"give me a classic" ranks classics above house creations', function () {
  var res = engine.recommend(MENU, ask({ adventure: '0', flavour: 'citrus', strength: '3' }));
  assert.ok(!res.items[0].cocktail.house, 'a house creation topped a request for a classic');
});

test('"show me something new" favours house creations', function () {
  var res = engine.recommend(MENU, ask({ adventure: '2', flavour: 'fruity' }));
  var top3 = res.items.slice(0, 3);
  assert.ok(top3.some(function (i) { return i.cocktail.house; }),
    'expected at least one house creation in the top three');
});

test('a preferred spirit dominates the results', function () {
  var res = engine.recommend(MENU, ask({ spirit: ['tequila', 'mezcal'], flavour: 'citrus' }));
  var top3 = res.items.slice(0, 3);
  var agave = top3.filter(function (i) { return ['tequila', 'mezcal'].indexOf(i.cocktail.base) !== -1; });
  assert.ok(agave.length >= 2, 'expected mostly agave drinks, got: ' + ids(res).slice(0, 3).join(', '));
});

test('a hot drink is not recommended for a summer aperitif', function () {
  var res = engine.recommend(MENU, ask({ occasion: 'aperitif', flavour: 'rich', strength: '2' }));
  assert.notStrictEqual(res.items[0].cocktail.id, 'campfire-hot-chocolate');
});

test('a hot drink IS recommended when asked for directly', function () {
  var res = engine.recommend(MENU, ask({
    occasion: 'nightcap', texture: 'hot', flavour: 'rich', strength: '2', adventure: '2'
  }));
  assert.strictEqual(res.items[0].cocktail.id, 'campfire-hot-chocolate');
});

console.log('\nOutput contract');

test('results are ordered, capped, and carry usable reasons', function () {
  var res = engine.recommend(MENU, ask({}), { limit: 6 });
  assert.ok(res.items.length <= 6);
  for (var i = 1; i < res.items.length; i++) {
    assert.ok(res.items[i - 1].score >= res.items[i].score, 'results are not sorted by score');
  }
  res.items.forEach(function (item) {
    assert.ok(item.match >= 35 && item.match <= 99, 'match % out of the presentable range: ' + item.match);
    assert.ok(item.reasons.length >= 1, item.cocktail.id + ': no reason to show the guest');
    item.reasons.forEach(function (r) {
      assert.ok(questions.UI.de.reasons[r.key], 'no German copy for reason "' + r.key + '"');
      assert.ok(questions.UI.en.reasons[r.key], 'no English copy for reason "' + r.key + '"');
    });
  });
});

test('the same answers and seed always give the same result', function () {
  var a = ask({ adventure: '3' });
  var one = ids(engine.recommend(MENU, a, { seed: 42 }));
  var two = ids(engine.recommend(MENU, a, { seed: 42 }));
  assert.deepStrictEqual(one, two, 'results are not stable for a fixed seed');
});

test('"surprise me" actually varies between guests', function () {
  var a = ask({ adventure: '3' });
  var seen = {};
  for (var s = 0; s < 25; s++) seen[ids(engine.recommend(MENU, a, { seed: s }))[0]] = true;
  assert.ok(Object.keys(seen).length >= 4,
    'surprise me only ever produced ' + Object.keys(seen).length + ' different top picks');
});

test('every reachable answer combination returns something', function () {
  var occasions = ['aperitif', 'main', 'nightcap', 'celebration', 'shot'];
  var strengths = ['0', '1', '2', '3'];
  var flavours = ['citrus', 'bitter', 'herbal', 'fruity', 'rich', 'smoky', 'spirit'];
  var textures = ['', 'long', 'short', 'frothy', 'sparkling', 'hot'];
  var adventures = ['0', '2', '3'];
  var combos = 0;
  occasions.forEach(function (o) {
    strengths.forEach(function (s) {
      flavours.forEach(function (f) {
        textures.forEach(function (t) {
          adventures.forEach(function (adv) {
            combos++;
            var res = engine.recommend(MENU, {
              occasion: o, strength: s, spirit: [], avoid: [],
              flavour: f, texture: t, adventure: adv, avoidFlags: []
            });
            assert.ok(res.items.length > 0,
              'empty result for ' + [o, s, f, t || 'any', adv].join(' / '));
          });
        });
      });
    });
  });
  console.log('       (' + combos + ' combinations checked)');
});

console.log('\n' + passed + ' passed' + (process.exitCode ? ', SOME FAILED' : '') + '\n');
