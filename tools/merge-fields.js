/*
 * Adds the four missing fields to the live menu, without touching anything
 * else in it.
 *
 *   node tools/merge-fields.js path/to/menu.json [out.json]
 *
 * menu.json is the source of truth. Names, prices, sections, order, spelling,
 * what is even on the card, all of it comes from there and none of it is
 * changed. The old BarPatrol export is used for one thing only, looking up
 * the flavour, serve, moment and strength values that the API does not carry
 * yet.
 *
 * The input file is never modified. Output goes to a new file so a person can
 * read the report and the diff before anything is published.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var SRC = process.argv[2];
var OUT = process.argv[3] || 'menu.merged.json';

if (!SRC) {
  console.error('\n  node tools/merge-fields.js path/to/menu.json [out.json]\n');
  process.exit(1);
}

var menu = JSON.parse(fs.readFileSync(SRC, 'utf8'));
var values = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'docs', 'menu-api-feldwerte.json'), 'utf8'));

var FIELDS = ['flavour_tags', 'flavour_tags_en', 'serve_style', 'serve_style_en',
              'moment', 'moment_en', 'strength_level', 'glass', 'glass_en'];

/* Names are compared with the decoration stripped, so a drink is still found
 * when the card gained a size, an accent or a stray hyphen. Anything that
 * needs more than this is reported, never guessed at. */
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/ñ/g, 'n').replace(/[éèê]/g, 'e').replace(/[áà]/g, 'a')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/* Plain edit distance, only ever used to suggest. */
function dist(a, b) {
  var prev = [], cur = [], i, j;
  for (j = 0; j <= b.length; j++) prev[j] = j;
  for (i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1,
                        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur.slice();
  }
  return prev[b.length];
}

var lookup = {};
Object.keys(values).forEach(function (name) { lookup[norm(name)] = { name: name, v: values[name] }; });
var usedKeys = {};

var report = { filled: 0, already: [], missing: [], suggest: [], partial: [] };

(menu.sections || []).forEach(function (section) {
  (section.items || []).forEach(function (item) {
    // Only cocktails. Beer and wine have no ingredient list and need none of
    // these fields, so they are not reported as gaps.
    if (!(item.ingredients && item.ingredients.length)) return;

    var key = norm(item.name);
    var hit = lookup[key];

    if (!hit) {
      // Nothing matched outright. Offer the closest name rather than picking it.
      var best = null, bestD = Infinity;
      Object.keys(lookup).forEach(function (k) {
        var d = dist(key, k);
        if (d < bestD) { bestD = d; best = lookup[k].name; }
      });
      if (best && bestD <= Math.max(3, Math.round(key.length * 0.25))) {
        report.suggest.push(item.name + '  ->  ' + best + '   (Abstand ' + bestD + ')');
      } else {
        report.missing.push(item.name);
      }
      return;
    }

    usedKeys[key] = true;

    var wrote = 0, skipped = [];
    FIELDS.forEach(function (f) {
      if (hit.v[f] == null) return;
      // Never overwrite. If the API already carries a field it is the truth.
      var have = item[f];
      if (have != null && !(Array.isArray(have) && !have.length) && have !== '') {
        skipped.push(f);
        return;
      }
      item[f] = hit.v[f];
      wrote++;
    });

    if (wrote) report.filled++;
    if (skipped.length) report.already.push(item.name + ': ' + skipped.join(', '));

    var gaps = FIELDS.filter(function (f) { return item[f] == null; });
    if (gaps.length) report.partial.push(item.name + ': ' + gaps.join(', '));
  });
});

var orphans = Object.keys(lookup)
  .filter(function (k) { return !usedKeys[k]; })
  .map(function (k) { return lookup[k].name; });

fs.writeFileSync(OUT, JSON.stringify(menu, null, 2) + '\n');

function section(title, rows, note, cap) {
  if (!rows.length) return;
  console.log(title + '  (' + rows.length + ')');
  if (note) console.log('   ' + note);
  var show = cap ? rows.slice(0, cap) : rows;
  show.forEach(function (r) { console.log('   ' + r); });
  if (show.length < rows.length) console.log('   und ' + (rows.length - show.length) + ' weitere');
  console.log('');
}

console.log('\n' + report.filled + ' Getränke ergänzt, geschrieben nach ' + OUT + '\n');
section('Feld war schon da und wurde nicht angefasst', report.already);
section('Kein Wert gefunden, Name weicht ab', report.suggest,
  'Bitte prüfen und im Export oder auf der Karte angleichen, hier wird nichts geraten.');
section('Kein Wert vorhanden, muss vergeben werden', report.missing,
  'Neue Getränke, die es im alten Export nicht gab.');
section('Nach dem Zusammenführen immer noch unvollständig', report.partial);
section('Im Export, aber nicht mehr auf der Karte', orphans,
  'Nur zur Information, wird übersprungen.', 15);
if (!report.suggest.length && !report.missing.length && !report.partial.length) {
  console.log('Alle Cocktails vollständig.\n');
}
