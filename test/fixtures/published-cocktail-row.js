/*
 * One row, copied verbatim out of a real published payload.
 * =========================================================================
 * Taken from the capture of page 217 at content_hash fa59f27a2a8dc192,
 * which the tequila branch keeps in full at test/fixtures/menu-live.json.
 * Only `section` and `section_en` were dropped, because the loader adds
 * those on the way through and they are not part of the row.
 *
 * It is here for one reason. That payload carries `flavour_tags` on all one
 * hundred and twenty five cocktails, and the whisky app briefly treated the
 * presence of tasting tags as evidence of being a whisky. Read against the
 * real card it called this drink a whisky, along with the Aperol Spritz and
 * the shots.
 *
 * So the rule is narrower now, and this row is what holds it there. Anyone
 * widening the classifier again will fail a test naming a real drink from a
 * real build rather than something invented to make a point.
 * =========================================================================
 */
(function (root) {
  'use strict';

  var ROW = {
    name: 'Whiskey Sour',
    name_en: 'Whiskey Sour',
    group: '', group_en: '',
    price: 9.7,
    prices: [{ size: '', price: 9.7 }],
    description: 'Bourbon, Zitrone, Zucker und Eiweiss für die Schaumkrone. So alt wie die Barkultur selbst.',
    description_en: 'Bourbon, lemon, sugar and egg white for the foam crown. As old as bar culture itself.',
    bartender_note: 'Einer der aeltesten Cocktails ueberhaupt, schon 1862 in Jerry Thomas legendaerem Barbuch.',
    bartender_note_en: "One of the oldest cocktails there is, already in Jerry Thomas' legendary 1862 bar book.",
    ingredients: ['Four Roses', 'Zitrone', 'Zucker', 'Eiweiss'],
    ingredients_en: ['Four Roses', 'Lemon', 'Sugar', 'Egg white'],
    strength: 'kräftig',
    strength_level: 4,
    flavour_tags: ['sauer/zitrus', 'cremig'],
    flavour_tags_en: ['sour/citrus', 'creamy'],
    serve_style: 'Sour',
    serve_style_en: 'Sour',
    moment: ['Mittendrin'],
    moment_en: ['Midway'],
    glass: 'Tumbler',
    glass_en: 'Tumbler',
    allergens: ['Ei'],
    allergens_en: ['Egg'],
    allergen_codes: [],
    alcohol_free: false,
    image: null,
    pos_sku: '183',
    popularity_rank: 8,
    menu_class: 'star',
    hidden_on_card: false,
    on_printed_menu: true
  };

  /* The four fields the cocktail app has been waiting for, all present on
   * this row. Kept as a list so a test can say which one went missing. */
  var COCKTAIL_FIELDS = ['flavour_tags', 'serve_style', 'moment', 'strength_level'];

  var api = { ROW: ROW, COCKTAIL_FIELDS: COCKTAIL_FIELDS, CONTENT_HASH: 'fa59f27a2a8dc192' };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBPublishedRow = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
