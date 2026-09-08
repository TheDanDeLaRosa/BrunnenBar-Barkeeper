/*
 * Pulls the four fields the Menu API is missing out of the last BarPatrol
 * export, so nobody has to tag 148 drinks by hand.
 *
 *   node tools/export-missing-fields.js
 *
 * Writes docs/menu-api-feldwerte.json, keyed by the drink name exactly as it
 * appears in the export. Whoever owns the publishing pipeline merges these
 * onto the matching item and the app starts scoring with no further change.
 *
 * Three repairs are applied on the way out, all of them reported. They are
 * repairs to the old export, not to the API, and each one is a value that
 * matched nothing downstream.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var raw = require('../test/fixtures/export-2026-08-19.json');
var drinks = Array.isArray(raw) ? raw : Object.values(raw).find(Array.isArray);

var MOMENT_FIX = { 'Spaeter Abend': 'Später Abend' };

/* Three tags appear on exactly one drink and match nothing the other 147 use.
 * kraeftig duplicates the strength scale. bitter-suess is two existing tags
 * written as one. holzig is genuinely new and is kept. */
var FLAVOUR_FIX = {
  'kraeftig':     [],
  'bitter-suess': ['bitter', 'süß']
};
var FLAVOUR_EN = {
  'bitter': 'bitter', 'süß': 'sweet', 'fruchtig': 'fruity', 'prickelnd': 'sparkling',
  'sauer/zitrus': 'sour/citrus', 'kaffee': 'coffee', 'cremig': 'creamy',
  'kräuterig/frisch': 'herbal/fresh', 'überraschend': 'surprising', 'rauchig': 'smoky',
  'salzig': 'salty', 'scharf': 'spicy', 'holzig': 'woody'
};

var report = { moment: [], flavour: [], alcoholFree: [], unknownTag: [] };
var out = {};

drinks.forEach(function (d) {
  // ---- moment
  var moment = (d.moment || []).map(function (m) {
    if (MOMENT_FIX[m]) { report.moment.push(d.name + ': ' + m + ' -> ' + MOMENT_FIX[m]); return MOMENT_FIX[m]; }
    return m;
  });

  // ---- flavour, deduped after folding
  var tags = [];
  (d.flavour_tags || []).forEach(function (t) {
    var repl = FLAVOUR_FIX[t];
    if (repl) {
      report.flavour.push(d.name + ': ' + t + ' -> ' + (repl.length ? repl.join(' + ') : 'entfernt'));
      repl.forEach(function (r) { if (tags.indexOf(r) < 0) tags.push(r); });
    } else if (tags.indexOf(t) < 0) {
      tags.push(t);
    }
  });
  tags.forEach(function (t) {
    if (!FLAVOUR_EN[t]) report.unknownTag.push(d.name + ': ' + t);
  });

  // ---- strength, and the safe reading of a contradiction
  var level = d.strength && typeof d.strength.level === 'number' ? d.strength.level : null;
  if (d.alcohol_free && level !== 0) {
    report.alcoholFree.push(d.name + ': alcohol_free true bei Stärke ' + level);
  }

  out[d.name] = {
    flavour_tags: tags,
    flavour_tags_en: tags.map(function (t) { return FLAVOUR_EN[t] || t; }),
    serve_style: d.serve_style,
    serve_style_en: d.serve_style_en,
    moment: moment,
    moment_en: d.moment_en,
    strength_level: level,
    glass: d.glass,
    glass_en: d.glass_en
  };
});

var dest = path.join(__dirname, '..', 'docs', 'menu-api-feldwerte.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');

console.log('\n' + Object.keys(out).length + ' Getränke geschrieben nach docs/menu-api-feldwerte.json\n');

function section(title, rows) {
  if (!rows.length) return;
  console.log(title);
  rows.forEach(function (r) { console.log('   ' + r); });
  console.log('');
}
section('Moment repariert', report.moment);
section('Flavour Tags zusammengeführt', report.flavour);
section('Tag ohne englische Entsprechung', report.unknownTag);
section('ACHTUNG, alkoholfrei widerspricht der Stärke', report.alcoholFree);
