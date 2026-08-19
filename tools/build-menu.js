#!/usr/bin/env node
/*
 * BrunnenBar — menu build step
 * =========================================================================
 * Reads data/cocktails.json (the bar's export, the single source of truth)
 * and writes data/menu.js, which the website loads as a plain <script>.
 *
 *   node tools/build-menu.js
 *
 * Why a build step at all: a browser cannot read a .json file from the
 * file system without a web server, and this page has to work when opened
 * straight off disk or an iPad behind the bar. So the JSON is baked into a
 * JS file. Re-export from BarPatrol, drop the JSON in, run this, done.
 *
 * What it derives that the export does not carry:
 *   id       a stable slug
 *   base     the leading spirit, for "I feel like gin tonight"
 *   spirits  EVERY spirit in the drink, for "no whiskey, ever"
 *
 * What it drops: anything with available:false. Per the export's own field
 * notes, that means "aktuell nicht machbar, nicht empfehlen".
 * =========================================================================
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'cocktails.json');
const OUT = path.join(ROOT, 'data', 'menu.js');

/* Explicit dictionary rather than pattern matching: every string here is
 * one that actually appears in ingredients_guest, so the bar can read this
 * list and check it. Anything unrecognised is reported by the build rather
 * than silently guessed at. Syrups and juices are deliberately absent -
 * only things that carry a spirit identity belong here. */
const SPIRIT_OF = {
  // gin
  'Tanqueray': 'gin', 'Tanqueray No. Ten': 'gin', 'Bombay Sapphire': 'gin',
  "Hendrick's": 'gin', 'August Gin': 'gin', 'Fugger Gin': 'gin', 'Gin': 'gin',
  // vodka
  'Absolut': 'vodka', 'Vodka': 'vodka', 'Wodka': 'vodka', 'Ketel One': 'vodka',
  'Augsburg City Wodka': 'vodka',
  // rum
  'Bacardi': 'rum', 'Havana Club': 'rum', 'Zacapa 23': 'rum', 'Rum': 'rum',
  'dunkler Rum': 'rum', 'Malibu': 'rum', 'RumChata': 'rum',
  // cachaca
  'Cachaça': 'cachaca',
  // agave
  'Don Julio Blanco': 'tequila', 'Don Julio Reposado': 'tequila',
  'Don Julio Añejo': 'tequila', 'El Destilador Blanco': 'tequila',
  'Tequila': 'tequila', 'Reposado': 'tequila', 'Mezcal': 'mezcal',
  // whisk(e)y and brandy
  'Bourbon': 'whiskey', 'Four Roses': 'whiskey', 'Bulleit Bourbon': 'whiskey',
  "Jack Daniel's": 'whiskey', 'Johnnie Walker Black': 'whiskey',
  'Talisker': 'whiskey', 'Irish Whiskey': 'whiskey', 'Whiskey': 'whiskey',
  'Asbach Uralt': 'whiskey',
  // pisco
  'Pisco': 'pisco',
  // aperitivo and vermouth
  'Aperol': 'aperitivo', 'Campari': 'aperitivo', 'roter Wermut': 'aperitivo',
  'trockener Wermut': 'aperitivo', 'Sarti Rosa': 'aperitivo', 'Lillet': 'aperitivo',
  'Lillet Blanc': 'aperitivo', 'Aperitivo': 'aperitivo', 'Fresco Aperitivo': 'aperitivo',
  'Rosato Aperitivo': 'aperitivo', 'Amaro': 'aperitivo',
  'Martini Floreale': 'aperitivo', 'Martini Vibrante': 'aperitivo',
  // sparkling wine
  'Prosecco': 'sekt',
  // liqueurs and schnapps
  'Kahlúa': 'likoer', 'Amaretto': 'likoer', 'Frangelico': 'likoer', 'Baileys': 'likoer',
  'Licor 43': 'likoer', 'Berliner Luft': 'likoer', 'Ficken Likör': 'likoer',
  'Sambuca': 'likoer', 'Raki': 'likoer', 'Jägermeister': 'likoer', 'Limoncello': 'likoer',
  'Pfeffi': 'likoer', 'Marillenschnaps': 'likoer', 'Haselnusslikör': 'likoer',
  'Pfirsichlikör': 'likoer', 'Crème de Mûre': 'likoer', 'Bénédictine': 'likoer',
  'St. Germain': 'likoer', 'Grand Marnier': 'likoer', 'Cointreau': 'likoer',
  'Blue Curaçao': 'likoer', 'gingerle': 'likoer'
};

// "Gin oder Wodka" is a genuine either/or on the card, not one spirit.
const MULTI = { 'Gin oder Wodka': ['gin', 'vodka'] };

/* Exports have arrived carrying "Don Julio Anejo" and "Roter Wermut"
 * alongside "Don Julio Añejo" and "roter Wermut". Match on a normalised key
 * so a dropped accent or a stray capital cannot silently cost a drink its
 * spirit, and the dictionary above stays readable in its proper spelling. */
function normKey(str) {
  return String(str).toLowerCase().trim()
    .replace(/ñ/g, 'n').replace(/[áàâ]/g, 'a').replace(/[éèê]/g, 'e')
    .replace(/[íì]/g, 'i').replace(/[óò]/g, 'o').replace(/[úù]/g, 'u')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/\s+/g, ' ');
}

const SPIRIT_LOOKUP = {};
Object.keys(SPIRIT_OF).forEach(k => { SPIRIT_LOOKUP[normKey(k)] = SPIRIT_OF[k]; });
const MULTI_LOOKUP = {};
Object.keys(MULTI).forEach(k => { MULTI_LOOKUP[normKey(k)] = MULTI[k]; });

/* A drink counts as alcohol free only when the export says so AND rates it
 * at strength 0. The two fields disagreeing means someone changed one and
 * not the other, and the safe reading of "maybe alcoholic" is "alcoholic".
 * Conflicts are reported by the build, never silently resolved. */
function isAlcoholFree(drink) {
  return !!drink.alcohol_free && drink.strength && drink.strength.level === 0;
}

function spiritsOf(drink) {
  if (isAlcoholFree(drink)) return { base: 'none', spirits: [] };
  const found = [];
  const add = f => { if (!found.includes(f)) found.push(f); };
  for (const ing of drink.ingredients_guest || []) {
    const key = normKey(ing);
    if (MULTI_LOOKUP[key]) { MULTI_LOOKUP[key].forEach(add); continue; }
    if (SPIRIT_LOOKUP[key]) add(SPIRIT_LOOKUP[key]);
  }
  return { base: found[0] || 'other', spirits: found };
}

function slug(name) {
  return String(name).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[àáâ]/g, 'a').replace(/[èéê]/g, 'e').replace(/ç/g, 'c').replace(/ñ/g, 'n')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* The export grew a few near-duplicate section names by hand. Fold them
 * together so the card does not show "Rum/Cachaça" and "Rum / Cachaca" as
 * two different things. */
const SECTION_ALIASES = {
  'Rum / Cachaca': 'Rum/Cachaça',
  'Apertive Cocktails': 'Aperitivo Cocktails',
  'Tequila/Agave': 'Agave Cocktails',
  'Tequila': 'Agave Cocktails',
  'Vodka Cocktails': 'Vodka',
  'Gin Cocktails': 'Gin',
  'Whiskey Cocktails': 'Whiskey'
};

function main() {
  const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const all = raw.drinks || [];

  const dropped = all.filter(d => !d.available);
  const kept = all.filter(d => d.available);

  const seen = new Map();
  const sectionsRenamed = new Set();

  const menu = kept.map(d => {
    let id = slug(d.name);
    if (seen.has(id)) { const n = seen.get(id) + 1; seen.set(id, n); id = id + '-' + n; }
    else seen.set(id, 1);

    const { base, spirits } = spiritsOf(d);
    const section = SECTION_ALIASES[d.section] || d.section;
    if (section !== d.section) sectionsRenamed.add(d.section + ' -> ' + section);

    return {
      id,
      name: d.name,
      section,
      // Every English field falls back to its German counterpart, so a
      // partially translated export degrades per drink rather than breaking.
      tagline: d.tagline_de || '',
      taglineEn: d.tagline_en || '',
      note: d.bartender_note_de || '',
      noteEn: d.bartender_note_en || '',
      ing: d.ingredients_guest || [],
      ingEn: d.ingredients_guest_en || [],
      glass: d.glass || '',
      glassEn: d.glass_en || '',
      serve: d.serve_style || '',
      strength: d.strength && typeof d.strength.level === 'number' ? d.strength.level : 3,
      strengthLabel: (d.strength && d.strength.label) || '',
      flavours: d.flavour_tags || [],
      moments: d.moment || [],
      allergens: d.allergens || [],
      alcoholFree: isAlcoholFree(d),
      price: typeof d.price_eur === 'number' ? d.price_eur : null,
      sold: typeof d.units_sold === 'number' ? d.units_sold : 0,
      rank: typeof d.popularity_rank === 'number' ? d.popularity_rank : 999,
      onPrintedMenu: !!d.on_printed_menu,
      base,
      spirits
    };
  });

  /* The export carries German and English as parallel arrays. If they ever
   * drift out of step the wrong word ends up against the wrong ingredient,
   * so check parity before trusting them, and refuse to build a term map
   * from any drink whose arrays disagree. */
  const parityErrors = [];
  kept.forEach(d => {
    [['ingredients_guest', 'ingredients_guest_en'], ['flavour_tags', 'flavour_tags_en'],
     ['moment', 'moment_en'], ['allergens', 'allergens_en']].forEach(([de, en]) => {
      const a = d[de] || [], b = d[en] || [];
      if (a.length && b.length && a.length !== b.length) {
        parityErrors.push(d.name + ': ' + de + ' has ' + a.length + ' entries, ' + en + ' has ' + b.length);
      }
    });
  });
  if (parityErrors.length) {
    console.log('\n!! GERMAN AND ENGLISH ARRAYS OUT OF STEP:');
    parityErrors.forEach(e => console.log('   ' + e));
  }

  /* One ingredient, one English word. Built from the export rather than kept
   * by hand, so it cannot drift from the card. Used where a single term is
   * named on its own, such as the "Something with Cucumber" label. */
  const ingEnMap = {};
  const clashes = {};
  kept.forEach(d => {
    const a = d.ingredients_guest || [], b = d.ingredients_guest_en || [];
    if (a.length !== b.length) return;
    a.forEach((de, i) => {
      const en = b[i];
      if (!en) return;
      if (ingEnMap[de] && ingEnMap[de] !== en) {
        (clashes[de] = clashes[de] || new Set()).add(ingEnMap[de]).add(en);
      } else ingEnMap[de] = en;
    });
  });
  if (Object.keys(clashes).length) {
    console.log('\n!! ONE INGREDIENT, TWO ENGLISH WORDS:');
    Object.keys(clashes).forEach(k => console.log('   ' + k + ' -> ' + [...clashes[k]].join(' / ')));
  }

  const missingEn = {
    tagline: menu.filter(d => !d.taglineEn).length,
    ingredients: menu.filter(d => !d.ingEn.length).length,
    glass: menu.filter(d => !d.glassEn).length
  };
  const gaps = Object.keys(missingEn).filter(k => missingEn[k]);
  if (gaps.length) {
    console.log('\n!! DRINKS WITH NO ENGLISH (they fall back to German):');
    gaps.forEach(k => console.log('   ' + k + ': ' + missingEn[k] + '/' + menu.length));
  } else {
    console.log('English: complete for all ' + menu.length + ' drinks');
  }

  const banner =
    '/*\n' +
    ' * GENERATED FILE - DO NOT EDIT BY HAND.\n' +
    ' *\n' +
    ' * Source:    data/cocktails.json (' + (raw.bar || '') + ', export ' + (raw.generated || '?') + ')\n' +
    ' * Rebuild:   node tools/build-menu.js\n' +
    ' *\n' +
    ' * ' + menu.length + ' drinks available, ' + dropped.length + ' dropped as unavailable.\n' +
    ' * Sales basis: ' + (raw.sales_basis || 'n/a') + '\n' +
    ' */\n';

  const body =
    '(function (root) {\n' +
    "  'use strict';\n" +
    '  var MENU = ' + JSON.stringify(menu, null, 1).replace(/\n/g, '\n  ') + ';\n' +
    '  var META = ' + JSON.stringify({
      bar: raw.bar, generated: raw.generated, version: raw.version,
      salesBasis: raw.sales_basis, count: menu.length
    }, null, 1).replace(/\n/g, '\n  ') + ';\n' +
    '  var ING_EN = ' + JSON.stringify(ingEnMap, null, 1).replace(/\n/g, '\n  ') + ';\n' +
    '  var api = { MENU: MENU, META: META, ING_EN: ING_EN };\n' +
    "  if (typeof module !== 'undefined' && module.exports) module.exports = api;\n" +
    '  root.BBMenu = api;\n' +
    "})(typeof globalThis !== 'undefined' ? globalThis : this);\n";

  fs.writeFileSync(OUT, banner + body, 'utf8');

  // ---- report -----------------------------------------------------------
  console.log('Source:  ' + path.relative(ROOT, SRC));
  console.log('Wrote:   ' + path.relative(ROOT, OUT));
  console.log('Kept:    ' + menu.length + ' available drinks');
  console.log('Dropped: ' + dropped.length + ' unavailable');
  console.log('         ' + dropped.slice(0, 3).map(d => d.name).join(', ') + (dropped.length > 3 ? ', …' : ''));
  console.log('Zero-proof available: ' + menu.filter(d => d.alcoholFree).length);

  const byBase = {};
  menu.forEach(d => { byBase[d.base] = (byBase[d.base] || 0) + 1; });
  console.log('Base spirits: ' + JSON.stringify(byBase));

  const conflicts = kept.filter(d => !!d.alcohol_free !== isAlcoholFree(d));
  if (conflicts.length) {
    console.log('\n!! ALCOHOL-FREE FLAG CONFLICTS - treated as CONTAINING ALCOHOL:');
    conflicts.forEach(d => {
      console.log('   ' + d.name + '  (alcohol_free:true but strength ' +
        d.strength.level + ' "' + d.strength.label + '")');
      console.log('     recipe: ' + (d.bar_recipe || []).map(r => r.product).join(', '));
    });
    console.log('   Fix data/cocktails.json, then rebuild.');
  }

  // A new flavour tag with no interface copy would reach a guest as a raw slug.
  let copy = null;
  try { copy = require('../data/questions.js').UI; } catch (e) { /* optional */ }
  if (copy) {
    const unknown = {};
    menu.forEach(d => (d.flavours || []).forEach(f => {
      if (!copy.de.flavourNames[f] || !copy.en.flavourNames[f]) {
        (unknown[f] = unknown[f] || []).push(d.name);
      }
    }));
    const keys = Object.keys(unknown);
    if (keys.length) {
      console.log('\n!! FLAVOUR TAGS WITH NO INTERFACE COPY:');
      keys.forEach(f => console.log('   "' + f + '"  on ' + unknown[f].join(', ')));
      console.log('   Add them to flavourNames and flavourCompare in data/questions.js,');
      console.log('   or fold them into the tags the rest of the card already uses.');
    }
  }

  const noSpirit = menu.filter(d => !d.alcoholFree && d.base === 'other');
  if (noSpirit.length) {
    console.log('\nNo spirit family recognised (will not match a spirit preference):');
    noSpirit.forEach(d => console.log('  - ' + d.name + '  [' + d.ing.join(', ') + ']'));
  }
  if (sectionsRenamed.size) {
    console.log('\nSection names folded together:');
    [...sectionsRenamed].forEach(s => console.log('  ' + s));
  }
}

main();
