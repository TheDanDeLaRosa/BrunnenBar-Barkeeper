/*
 * Tequila engine tests — run with:  node tequila/test/engine.test.js
 *
 * The engine is pure, so this walks the whole answer space rather than
 * spot checking it. Three things it will not let slip. A hard rule is never
 * bent, a reason on a card is never a lie, and a runner up never claims a
 * difference that is not there.
 */
'use strict';

var assert = require('assert');
var A = require('../assets/agave.js');
var E = require('../assets/engine.js');
var SRC = require('../../assets/menu-source.js');
var Q = require('../data/questions.js');
var F = require('./fixture.js');

var passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (err) { console.error('  FAIL ' + name + '\n       ' + err.message); process.exitCode = 1; }
}

var ITEMS = A.agaveItems(F.MENU, SRC);
var STOPS = A.budgetStops(ITEMS);

function byName(n) {
  return ITEMS.filter(function (d) { return d.name === n; })[0];
}
function names(res) { return res.items.map(function (r) { return r.drink.name; }); }

console.log('\nHard rules, never relaxed');

test('an excluded allergen never reaches a guest, at any answer', function () {
  ['Ei', 'Nüsse'].forEach(function (allergen) {
    walk({ exclude: [allergen] }, function (res) {
      res.items.forEach(function (r) {
        assert.strictEqual(r.drink.allergens.indexOf(allergen), -1,
          r.drink.name + ' carries ' + allergen);
      });
    });
  });
});

test('no smoke means no mezcal and nothing tagged smoky, at any answer', function () {
  walk({ exclude: ['rauch'] }, function (res) {
    res.items.forEach(function (r) {
      assert.notStrictEqual(r.drink.kind, 'mezcal', r.drink.name);
      assert.strictEqual(r.drink.tags.indexOf('rauchig'), -1, r.drink.name);
    });
  });
});

test('a budget holds even when it empties the results', function () {
  STOPS.forEach(function (stop) {
    walk({ budget: String(stop) }, function (res) {
      res.items.forEach(function (r) {
        assert.ok(r.drink.price != null && r.drink.price <= stop,
          r.drink.name + ' at ' + r.drink.price + ' is over ' + stop);
      });
    });
  });
});

test('a price the card does not carry is never offered against a budget', function () {
  var noPrice = A.derive({ name: 'Sotol', group: 'Agave', prices: [], allergens: [] });
  assert.strictEqual(noPrice.price, null);
  var res = E.recommend(ITEMS.concat([noPrice]), { budget: '20' }, { limit: 99 });
  assert.strictEqual(names(res).indexOf('Sotol'), -1);
});

test('asking for smoke and excluding it returns nothing rather than something wrong', function () {
  var res = E.recommend(ITEMS, { character: ['rauchig'], exclude: ['rauch'] }, {});
  res.items.forEach(function (r) {
    assert.strictEqual(r.drink.tags.indexOf('rauchig'), -1);
  });
});

console.log('\nThe one gate');

test('nothing neat in range falls back to mixed and says so', function () {
  // Two euro buys nothing neat on this card, and nothing mixed either, so
  // widen it to a budget that leaves only mixed drinks under it.
  var cheapPours = ITEMS.filter(function (d) { return d.pour && d.price <= 9; });
  assert.strictEqual(cheapPours.length, 0, 'fixture must have no pour at or under 9');
  var res = E.recommend(ITEMS, { serve: 'pur', budget: '9' }, {});
  assert.strictEqual(res.relaxed, 'serve');
  assert.ok(res.items.length > 0);
  res.items.forEach(function (r) { assert.strictEqual(r.drink.pour, false); });
});

test('the gate is not relaxed while it still has something to offer', function () {
  var res = E.recommend(ITEMS, { serve: 'pur' }, {});
  assert.strictEqual(res.relaxed, null);
  res.items.forEach(function (r) { assert.strictEqual(r.drink.pour, true); });
});

test('a gate is never relaxed to get around a hard rule', function () {
  walk({}, function (res, answers) {
    if (res.relaxed !== 'serve') return;
    res.items.forEach(function (r) {
      assert.ok(E.passesHard(r.drink, answers), r.drink.name + ' slipped a hard rule');
    });
  });
});

console.log('\nWhat the data does not say');

test('an unnamed expression is not punished for the card being brief', function () {
  var margarita = byName('Margarita');
  assert.strictEqual(margarita.expression, '');
  var res = E.recommend(ITEMS, { agave: ['reposado'] }, { limit: 99 });
  assert.ok(names(res).indexOf('Margarita') !== -1,
    'Margarita must stay reachable when reposado is asked for');
});

test('a missing strength scores neutral rather than being guessed', function () {
  var ocho = byName('Ocho Plata');
  assert.strictEqual(ocho.strength, null);
  ['1', '2', '3'].forEach(function (s) {
    var res = E.recommend(ITEMS, { strength: s }, { limit: 99 });
    assert.ok(names(res).indexOf('Ocho Plata') !== -1, 'dropped at strength ' + s);
  });
});

console.log('\nReasons are claims, and every claim is checked');

test('no reason printed on a card is false', function () {
  walk({}, function (res, answers) {
    res.items.forEach(function (row) {
      var d = row.drink;
      row.reasons.forEach(function (r) {
        if (r.key === 'kind') assert.strictEqual(d.kind, r.x, d.name);
        if (r.key === 'expression') assert.strictEqual(d.expression, r.x, d.name);
        if (r.key === 'character') {
          String(r.x).split(', ').forEach(function (tag) {
            assert.ok(d.tags.indexOf(tag) !== -1, d.name + ' does not taste ' + tag);
          });
          (r.from || []).filter(Boolean).forEach(function (ing) {
            assert.ok(d.ing.indexOf(ing) !== -1 || ing === d.name,
              d.name + ' has no ' + ing + ' to taste of');
          });
        }
        if (r.key === 'strength_exact') {
          assert.strictEqual(d.strength, Number(answers.strength), d.name);
        }
        if (r.key === 'strength_near') {
          assert.strictEqual(Math.abs(d.strength - Number(answers.strength)), 1, d.name);
        }
        if (r.key === 'budget') {
          assert.ok(d.price <= Number(answers.budget), d.name);
        }
      });
    });
  });
});

test('every reason key has copy in both languages', function () {
  var keys = {};
  walk({}, function (res) {
    res.items.forEach(function (row) {
      row.reasons.forEach(function (r) { keys[r.key] = true; });
    });
  });
  Object.keys(keys).forEach(function (k) {
    ['de', 'en'].forEach(function (lang) {
      assert.ok(Q.UI[lang].reasons[k], 'no ' + lang + ' copy for reason ' + k);
    });
  });
});

console.log('\nRunner ups say how they differ');

test('every contrast claim is true of that pair', function () {
  var ingFreq = {};
  ITEMS.forEach(function (d) {
    d.ing.forEach(function (i) { ingFreq[i] = (ingFreq[i] || 0) + 1; });
  });
  var checked = 0;
  ITEMS.forEach(function (hero) {
    ITEMS.forEach(function (alt) {
      if (hero === alt) return;
      var c = E.contrastOf(hero, alt, ingFreq);
      if (!c) return;
      checked++;
      var where = hero.name + ' vs ' + alt.name + ' claimed ' + c.kind;
      if (c.kind === 'smoky') assert.strictEqual(alt.kind, 'mezcal', where);
      if (c.kind === 'unsmoked') assert.notStrictEqual(alt.kind, 'mezcal', where);
      if (c.kind === 'expression') {
        assert.strictEqual(alt.expression, c.value, where);
        assert.notStrictEqual(hero.expression, c.value, where);
      }
      if (c.kind === 'neat') { assert.ok(alt.pour, where); assert.ok(!hero.pour, where); }
      if (c.kind === 'mixed') { assert.ok(!alt.pour, where); assert.ok(hero.pour, where); }
      if (c.kind === 'stronger') assert.ok(alt.strength > hero.strength, where);
      if (c.kind === 'lighter') assert.ok(alt.strength < hero.strength, where);
      if (c.kind === 'ingredient') {
        assert.ok(alt.ing.indexOf(c.value) !== -1, where);
        assert.strictEqual(hero.ing.indexOf(c.value), -1, where);
        assert.strictEqual(A.GENERIC_ING.indexOf(A.norm(c.value)), -1,
          where + ' but ' + c.value + ' is too generic to name');
        assert.strictEqual(A.isAgaveWord(c.value), false,
          where + ' but every drink here has agave in it, so ' + c.value +
          ' is not a reason to pick one');
      }
      if (c.kind === 'cheaper') {
        assert.ok(hero.price - alt.price >= E.PRICE_GAP, where);
      }
      if (c.kind === 'character') {
        assert.ok(alt.tags.indexOf(c.value) !== -1, where);
        assert.strictEqual(hero.tags.indexOf(c.value), -1, where);
      }
    });
  });
  console.log('       (' + checked + ' pairs checked)');
});

test('every contrast kind the engine can emit has copy in both languages', function () {
  var ingFreq = {};
  var kinds = {};
  ITEMS.forEach(function (hero) {
    ITEMS.forEach(function (alt) {
      var c = hero === alt ? null : E.contrastOf(hero, alt, ingFreq);
      if (c) kinds[c.kind] = true;
    });
  });
  Object.keys(kinds).forEach(function (k) {
    ['de', 'en'].forEach(function (lang) {
      assert.ok(Q.UI[lang].contrast[k], 'no ' + lang + ' copy for contrast ' + k);
    });
  });
});

test('the generic ingredient list is actually reaching the contrast', function () {
  // isGeneric reads its vocabulary from BBAgave at call time. If the load
  // order in index.html ever changes, this is what notices.
  var a = { kind: 'tequila', expression: '', pour: false, strength: 2, price: 9,
            tags: [], ing: ['Tequila', 'Limette'] };
  var b = { kind: 'tequila', expression: '', pour: false, strength: 2, price: 9,
            tags: [], ing: ['Tequila'] };
  assert.strictEqual(E.contrastOf(b, a, {}), null,
    'Limette alone is not a reason to pick a different drink');
});

console.log('\nBehaviour under every answer');

test('every combination returns something unless a hard rule emptied the card', function () {
  var walked = 0;
  walk({}, function (res, answers) {
    walked++;
    var survivors = ITEMS.filter(function (d) { return E.passesHard(d, answers); });
    if (survivors.length) {
      assert.ok(res.items.length > 0, 'nothing offered for ' + JSON.stringify(answers));
    } else {
      assert.strictEqual(res.items.length, 0);
    }
  });
  console.log('       (' + walked + ' answer combinations checked)');
});

test('results come back ranked, and never more than asked for', function () {
  walk({}, function (res) {
    for (var i = 1; i < res.items.length; i++) {
      assert.ok(res.items[i - 1].score >= res.items[i].score, 'out of order');
    }
    assert.ok(res.items.length <= 3);
  });
});

test('the same answers give the same advice', function () {
  var answers = { serve: 'cocktail', agave: ['reposado'], strength: '3', character: ['süß'] };
  var a = E.recommend(ITEMS, answers, { seed: 42 });
  var b = E.recommend(ITEMS, answers, { seed: 42 });
  assert.deepStrictEqual(names(a), names(b));
});

test('free rein spreads the answers instead of always handing over one drink', function () {
  var seen = {};
  for (var s = 0; s < 40; s++) {
    seen[names(E.recommend(ITEMS, { character: ['barkeeper'] }, { seed: s }))[0]] = true;
  }
  assert.ok(Object.keys(seen).length > 1,
    'handing the choice back should not always produce the same drink');
});

test('a stated preference is not drowned out by that jitter', function () {
  for (var s = 0; s < 40; s++) {
    var top = E.recommend(ITEMS, { serve: 'pur', agave: ['mezcal'] }, { seed: s }).items[0];
    assert.strictEqual(top.drink.kind, 'mezcal', 'seed ' + s + ' gave ' + top.drink.name);
  }
});

console.log('\nQuestions and data agree');

test('every static answer value is something the card can actually answer', function () {
  var kinds = {}, exprs = {}, tags = {}, allergens = {};
  ITEMS.forEach(function (d) {
    kinds[d.kind] = true;
    if (d.expression) exprs[d.expression] = true;
    d.tags.forEach(function (t) { tags[t] = true; });
    d.allergens.forEach(function (a) { allergens[a] = true; });
  });
  // The agave question builds itself from the card, so check what it would
  // actually offer rather than the vocabulary it draws from.
  Q.agaveOptions(ITEMS).forEach(function (opt) {
    assert.ok(exprs[opt.value] || kinds[opt.value], 'no item is a ' + opt.value);
  });
  assert.ok(Q.AGAVE_CHOICES.length > Q.agaveOptions(ITEMS).length,
    'this fixture should not carry every expression, or the filter proves nothing');

  Q.QUESTIONS.forEach(function (q) {
    (q.options || []).forEach(function (opt) {
      var v = opt.value;
      if (opt.exclusive) return;                       // the sentinel, not a value
      if (q.id === 'character') {
        assert.ok(A.CHARACTER[v], v + ' is not a character the derivation can produce');
      } else if (q.id === 'exclude' && v !== E.NO_SMOKE) {
        // Allergen values are the card's own strings, so they only have to
        // be strings the card could carry, not ones this fixture does.
        assert.strictEqual(typeof v, 'string', v);
      } else if (q.id === 'strength') {
        assert.ok(['1', '2', '3'].indexOf(v) !== -1, v);
      }
    });
  });
});

test('every option and question carries both languages', function () {
  Q.QUESTIONS.forEach(function (q) {
    ['de', 'en'].forEach(function (lang) {
      assert.ok(q.title[lang], q.id + ' title ' + lang);
      assert.ok(!q.sub || q.sub[lang], q.id + ' sub ' + lang);
    });
    (q.options || Q.AGAVE_CHOICES).forEach(function (opt) {
      ['de', 'en'].forEach(function (lang) {
        assert.ok(opt.label[lang], q.id + '/' + opt.value + ' label ' + lang);
        assert.ok(!opt.hint || opt.hint[lang], q.id + '/' + opt.value + ' hint ' + lang);
      });
    });
  });
});

test('every character and expression the engine can name reads back in both languages', function () {
  ['de', 'en'].forEach(function (lang) {
    Object.keys(A.CHARACTER).forEach(function (tag) {
      assert.ok(Q.UI[lang].characterNames[tag], lang + ' has no name for ' + tag);
      assert.ok(Q.UI[lang].characterCompare[tag], lang + ' has no comparative for ' + tag);
    });
    A.EXPRESSIONS.forEach(function (e) {
      assert.ok(Q.UI[lang].expressionNames[e[1]], lang + ' has no name for ' + e[1]);
    });
    ['tequila', 'mezcal', 'agave'].forEach(function (k) {
      assert.ok(Q.UI[lang].kindNames[k], lang + ' has no name for ' + k);
    });
  });
});

test('the guest copy keeps the house voice', function () {
  // No hyphens, no dashes, no colons, no semicolons. Checked rather than
  // trusted, because it is the rule most easily lost in a hurry.
  var offenders = [];
  function check(path, s) {
    if (typeof s !== 'string') return;
    if (/[–—;:]/.test(s) || / - /.test(s)) offenders.push(path + '  ' + s);
  }
  function walkCopy(node, path) {
    if (typeof node === 'string') return check(path, node);
    if (!node || typeof node !== 'object') return;
    Object.keys(node).forEach(function (k) { walkCopy(node[k], path + '.' + k); });
  }
  Q.QUESTIONS.forEach(function (q) {
    walkCopy(q.title, q.id + '.title');
    walkCopy(q.sub, q.id + '.sub');
    (q.options || Q.AGAVE_CHOICES).forEach(function (o) {
      walkCopy(o.label, q.id + '.' + o.value + '.label');
      walkCopy(o.hint, q.id + '.' + o.value + '.hint');
    });
  });
  ['de', 'en'].forEach(function (lang) { walkCopy(Q.UI[lang], 'UI.' + lang); });
  assert.strictEqual(offenders.length, 0, 'house voice broken\n       ' + offenders.join('\n       '));
});

// ------------------------------------------------------------- the walk ---

/* Every combination of answers the interface can produce, with `fixed`
 * pinned. Cheap enough to run in full, so it runs in full. */
function walk(fixed, fn) {
  var serves = ['', 'pur', 'cocktail'];
  var agaves = [[], ['blanco'], ['reposado'], ['anejo'], ['cristalino'], ['mezcal'],
                ['blanco', 'reposado']];
  var strengths = ['', '1', '2', '3'];
  var characters = [[], ['barkeeper'], ['sauer/zitrus'], ['rauchig'], ['süß'], ['bitter'],
                    ['prickelnd'], ['fruchtig'], ['scharf'], ['kräuterig/frisch'],
                    ['cremig'], ['sauer/zitrus', 'süß']];
  var budgets = [''].concat(STOPS.map(String));
  var excludes = [[], ['rauch'], ['Ei'], ['Nüsse'], ['rauch', 'Ei', 'Nüsse', 'Milch']];

  serves.forEach(function (serve) {
    agaves.forEach(function (agave) {
      strengths.forEach(function (strength) {
        characters.forEach(function (character) {
          budgets.forEach(function (budget) {
            excludes.forEach(function (exclude) {
              var answers = Object.assign({
                serve: serve, agave: agave, strength: strength,
                character: character, budget: budget, exclude: exclude
              }, fixed);
              fn(E.recommend(ITEMS, answers, { seed: 7 }), answers);
            });
          });
        });
      });
    });
  });
}

console.log('\n' + passed + ' passed\n');
