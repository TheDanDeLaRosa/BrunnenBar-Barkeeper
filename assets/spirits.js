/*
 * BrunnenBar — which spirit family an ingredient belongs to
 * =========================================================================
 * Lifted out of the node build so the browser can use it too. The live Menu
 * API carries no base spirit field, so it is worked out from the ingredient
 * list here, in both the app and the tools, from one dictionary.
 *
 * Every key is a string that really appears in the data, which is why this is
 * a readable list rather than a pile of regexes. A regex matched "Gin" inside
 * "gingerle" and missed "Bombay Sapphire" entirely.
 * =========================================================================
 */
(function (root) {
  'use strict';

  var SPIRIT_OF = {
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
  var MULTI = { 'Gin oder Wodka': ['gin', 'vodka'] };

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

  var SPIRIT_LOOKUP = {};
  Object.keys(SPIRIT_OF).forEach(function (k) { SPIRIT_LOOKUP[normKey(k)] = SPIRIT_OF[k]; });
  var MULTI_LOOKUP = {};
  Object.keys(MULTI).forEach(function (k) { MULTI_LOOKUP[normKey(k)] = MULTI[k]; });

  function spiritsOf(ingredients, alcoholFree) {
    if (alcoholFree) return { base: 'none', spirits: [] };
    var found = [];
    function add(f) { if (found.indexOf(f) === -1) found.push(f); }
    (ingredients || []).forEach(function (ing) {
      var key = normKey(ing);
      if (MULTI_LOOKUP[key]) { MULTI_LOOKUP[key].forEach(add); return; }
      if (SPIRIT_LOOKUP[key]) add(SPIRIT_LOOKUP[key]);
    });
    return { base: found[0] || 'other', spirits: found };
  }

  var api = { SPIRIT_OF: SPIRIT_OF, MULTI: MULTI, normKey: normKey, spiritsOf: spiritsOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBSpirits = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
