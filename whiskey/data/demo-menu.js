/*
 * PREVIEW DATA. NOT THE CARD. NOT A FALLBACK.
 * =========================================================================
 * The Menu API now carries fifteen profiled whiskies. Until the website seat
 * republishes menu.json to page 217 they are not reachable from a browser,
 * and this file is the only way to see the app work in the meantime. The day
 * that publish lands, delete it.
 *
 * What is real here and what is not:
 *
 *   real     which bottles are on the shelf, which of them sit behind
 *            hidden_on_card, and that Jack Daniel's is profiled in the
 *            Spirituosen section rather than in Whisk(e)y
 *   real     the peat and origin values, as Dan described them
 *   INVENTED every price, every tasting note, every description
 *
 * The invented half is why the page shouts in gold on every screen while
 * this file is loaded, and why it is loaded only when the address bar says
 * ?demo=1 and never when a fetch fails.
 *
 * The origin values are deliberately spelled the way the card spells them,
 * Highland and Lowland rather than Highlands and Lowlands, Kentucky and
 * Tennessee rather than USA. The app builds its answers from whatever the
 * card carries, so this is also the test that it does.
 * =========================================================================
 */
(function (root) {
  'use strict';

  /* Fills in the fields every Menu API row carries, so the table below can
   * stay readable and show only what makes one bottle different. */
  function bottle(o) {
    var small = o.price;
    var large = Math.round((small * 2 - 0.4) * 10) / 10;
    return {
      name: o.name, name_en: o.name,
      group: o.group || '', group_en: o.group_en || o.group || '',
      price: small,
      prices: [{ size: '2 cl', price: small }, { size: '4 cl', price: large }],
      description: o.de, description_en: o.en,
      bartender_note: o.noteDe || '', bartender_note_en: o.noteEn || '',
      ingredients: [], ingredients_en: [],
      strength: 'stark',
      allergens: [], allergens_en: [], allergen_codes: [],
      alcohol_free: false,
      image: null,
      pos_sku: o.sku || '',
      hidden_on_card: o.backBar === true,
      on_printed_menu: o.backBar !== true,
      popularity_rank: o.rank == null ? 9999 : o.rank,
      menu_class: o.cls || 'plowhorse',
      recommended: o.leader === true,

      // The whisky profile, flat on the item the way the card carries it.
      peat: o.peat,
      origin: o.origin,
      notes: o.notes,
      notes_en: o.notesEn,
      brand: o.brand,
      whisky_kind: o.kind,
      whisky_expression: o.expression || '',
      whisky_age_years: o.age == null ? null : o.age,
      abv: o.abv,
      cask: o.cask, cask_en: o.caskEn,
      whisky_serve: o.serve, whisky_serve_en: o.serveEn,
      whisky_level: o.level
    };
  }

  var NEAT = ['pur', 'mit Wasser'];
  var NEAT_EN = ['neat', 'with water'];
  var ICE = ['pur', 'mit Wasser', 'auf Eis'];
  var ICE_EN = ['neat', 'with water', 'on ice'];
  var LONG = ['pur', 'auf Eis', 'Highball'];
  var LONG_EN = ['neat', 'on ice', 'highball'];
  var TALL = ['pur', 'mit Wasser', 'Highball'];
  var TALL_EN = ['neat', 'with water', 'highball'];

  var BOURBON = ['Bourbonfass'], BOURBON_EN = ['Bourbon cask'];
  var SHERRY = ['Sherryfass'], SHERRY_EN = ['Sherry cask'];
  var BOTH = ['Bourbonfass', 'Sherryfass'], BOTH_EN = ['Bourbon cask', 'Sherry cask'];
  var OAK = ['Neue Eiche'], OAK_EN = ['New oak'];

  // ------------------------------------------------- on the guest neat card --

  var NEAT_CARD = [
    bottle({
      name: 'Oban 14', brand: 'Oban', kind: 'Single Malt', expression: '14 Jahre',
      origin: 'Highland', peat: 1, age: 14, abv: 43, price: 7.5, rank: 3, cls: 'star',
      cask: BOTH, caskEn: BOTH_EN, level: 'klassiker', serve: NEAT, serveEn: NEAT_EN,
      notes: ['maritim/salzig', 'fruchtig', 'würzig'], notesEn: ['maritime/salty', 'fruity', 'spicy'],
      de: 'Genau zwischen den sanften Speysiders und dem Rauch der Inseln. Ein guter erster Schritt Richtung Westküste.',
      en: 'Right between the gentle Speysiders and the smoke of the islands. A good first step towards the west coast.'
    }),
    bottle({
      name: 'Bulleit Bourbon', brand: 'Bulleit', kind: 'Bourbon',
      origin: 'Kentucky', peat: 0, age: null, abv: 45, price: 5.5, rank: 2, cls: 'star',
      cask: OAK, caskEn: OAK_EN, level: 'klassiker', serve: LONG, serveEn: LONG_EN,
      notes: ['würzig', 'honig/vanille', 'fruchtig'], notesEn: ['spicy', 'honey/vanilla', 'fruity'],
      de: 'Hoher Roggenanteil, deshalb pfeffriger als die meisten Bourbons. Der Whiskey in unserem Mint Julep.',
      en: 'A high rye share, which makes it peppier than most bourbons. The whiskey in our Mint Julep.'
    }),
    bottle({
      name: 'Talisker 10', brand: 'Talisker', kind: 'Single Malt', expression: '10 Jahre',
      origin: 'Skye', peat: 2, age: 10, abv: 45.8, price: 6.9, rank: 1, cls: 'star', leader: true,
      cask: BOURBON, caskEn: BOURBON_EN, level: 'klassiker', serve: TALL, serveEn: TALL_EN,
      notes: ['maritim/salzig', 'würzig', 'fruchtig'], notesEn: ['maritime/salty', 'spicy', 'fruity'],
      de: 'Pfeffer, Salz und ein Feuer am Strand. Von Skye und schmeckt auch danach.',
      en: 'Pepper, salt and a fire on the beach. From Skye and it tastes like it.',
      noteDe: 'Wir bauen daraus auch den Talisker Campfire mit warmer Schokolade, frag einfach danach.',
      noteEn: 'We also build the Talisker Campfire from it with warm chocolate, just ask.'
    }),
    bottle({
      name: 'Singleton of Dufftown 12', brand: 'Singleton', kind: 'Single Malt', expression: '12 Jahre',
      origin: 'Speyside', peat: 0, age: 12, abv: 40, price: 5.5, rank: 5, cls: 'plowhorse',
      cask: BOTH, caskEn: BOTH_EN, level: 'einstieg', serve: ICE, serveEn: ICE_EN,
      notes: ['fruchtig', 'honig/vanille', 'malzig'], notesEn: ['fruity', 'honey/vanilla', 'malty'],
      de: 'Weich, süß und ohne jede Kante. Der Whisky, mit dem hier die meisten anfangen.',
      en: 'Soft, sweet and without an edge anywhere. The whisky most people here start with.'
    }),
    bottle({
      name: 'Lagavulin 16', brand: 'Lagavulin', kind: 'Single Malt', expression: '16 Jahre',
      origin: 'Islay', peat: 4, age: 16, abv: 43, price: 9.5, rank: 7, cls: 'puzzle',
      cask: BOTH, caskEn: BOTH_EN, level: 'rarität', serve: NEAT, serveEn: NEAT_EN,
      notes: ['dunkle früchte', 'schokolade', 'maritim/salzig'], notesEn: ['dark fruit', 'chocolate', 'maritime/salty'],
      de: 'Der lauteste Whisky im Regal und gleichzeitig der eleganteste. Torf, Teer und dunkle Frucht.',
      en: 'The loudest whisky on the shelf and somehow also the most elegant. Peat, tar and dark fruit.'
    }),
    bottle({
      name: 'Dalwhinnie 15', brand: 'Dalwhinnie', kind: 'Single Malt', expression: '15 Jahre',
      origin: 'Highland', peat: 1, age: 15, abv: 43, price: 6.9, rank: 8, cls: 'puzzle',
      cask: BOURBON, caskEn: BOURBON_EN, level: 'kenner', serve: NEAT, serveEn: NEAT_EN,
      notes: ['honig/vanille', 'blumig', 'malzig'], notesEn: ['honey/vanilla', 'floral', 'malty'],
      de: 'Aus der kältesten Destillerie Schottlands und trotzdem der wärmste Honig.',
      en: "From Scotland's coldest distillery and still the warmest honey.",
      noteDe: 'Probier ihn mal ganz leicht gekühlt, das machen sie in Dalwhinnie selbst so.',
      noteEn: 'Try it very lightly chilled, that is how they drink it at Dalwhinnie.'
    }),
    bottle({
      name: 'Glenkinchie 12', brand: 'Glenkinchie', kind: 'Single Malt', expression: '12 Jahre',
      origin: 'Lowland', peat: 0, age: 12, abv: 43, price: 5.9, rank: 9, cls: 'dog',
      cask: BOURBON, caskEn: BOURBON_EN, level: 'einstieg', serve: ICE, serveEn: ICE_EN,
      notes: ['blumig', 'zitrus', 'malzig'], notesEn: ['floral', 'citrus', 'malty'],
      de: 'Der Garten von Edinburgh im Glas, grasig und hell und sehr freundlich.',
      en: 'The garden of Edinburgh in a glass, grassy and bright and very friendly.'
    }),
    bottle({
      name: 'Buffalo Trace', brand: 'Buffalo Trace', kind: 'Bourbon',
      origin: 'Kentucky', peat: 0, age: null, abv: 45, price: 5.9, rank: 6, cls: 'star',
      cask: OAK, caskEn: OAK_EN, level: 'klassiker', serve: LONG, serveEn: LONG_EN,
      notes: ['honig/vanille', 'schokolade', 'würzig'], notesEn: ['honey/vanilla', 'chocolate', 'spicy'],
      de: 'Vanille, Karamell und ein bisschen Minze. Der Bourbon, den Bourbontrinker bestellen.',
      en: 'Vanilla, caramel and a little mint. The bourbon that bourbon drinkers order.'
    })
  ];

  // ------------------------- back bar, in the app but not on the printed card --

  var BACK_BAR = [
    bottle({
      name: 'Jameson', brand: 'Jameson', kind: 'Irish Blend', backBar: true,
      origin: 'Ireland', peat: 0, age: null, abv: 40, price: 4.5, rank: 4, cls: 'plowhorse',
      cask: BOTH, caskEn: BOTH_EN, level: 'einstieg', serve: LONG, serveEn: LONG_EN,
      notes: ['fruchtig', 'nussig', 'honig/vanille'], notesEn: ['fruity', 'nutty', 'honey/vanilla'],
      de: 'Dreifach gebrannt und deshalb so weich. Der freundlichste Weg in den Whiskey.',
      en: 'Triple distilled and that is why it is so soft. The friendliest way into whiskey.'
    }),
    bottle({
      name: 'Johnnie Walker Black Label 12', brand: 'Johnnie Walker', kind: 'Blended Scotch',
      expression: 'Black Label 12', backBar: true,
      origin: 'Scotland', peat: 1, age: 12, abv: 40, price: 5.5, rank: 10, cls: 'plowhorse',
      cask: BOTH, caskEn: BOTH_EN, level: 'klassiker', serve: LONG, serveEn: LONG_EN,
      notes: ['fruchtig', 'würzig', 'honig/vanille'], notesEn: ['fruity', 'spicy', 'honey/vanilla'],
      de: 'Vierzig Whiskys in einer Flasche und trotzdem immer gleich gut. Der Klassiker hinter jeder Bar.',
      en: 'Forty whiskies in one bottle and reliably good every time. The classic behind every bar.'
    }),
    bottle({
      name: 'Johnnie Walker Black Ruby', brand: 'Johnnie Walker', kind: 'Blended Scotch',
      expression: 'Black Ruby', backBar: true,
      origin: 'Scotland', peat: 1, age: null, abv: 40, price: 5.9, cls: 'puzzle',
      cask: ['Portfass', 'Sherryfass'], caskEn: ['Port cask', 'Sherry cask'],
      level: 'kenner', serve: LONG, serveEn: LONG_EN,
      notes: ['dunkle früchte', 'schokolade', 'fruchtig'], notesEn: ['dark fruit', 'chocolate', 'fruity'],
      de: 'Der Black Label mit einer dunklen roten Frucht darüber. Süßer, runder, abends.',
      en: 'Black Label with a dark red fruit laid over it. Sweeter, rounder, an evening pour.'
    }),
    bottle({
      name: 'Bulleit Rye', brand: 'Bulleit', kind: 'Rye', backBar: true,
      origin: 'Kentucky', peat: 0, age: null, abv: 45, price: 5.9, cls: 'puzzle',
      cask: OAK, caskEn: OAK_EN, level: 'kenner', serve: LONG, serveEn: LONG_EN,
      notes: ['würzig', 'zitrus', 'schokolade'], notesEn: ['spicy', 'citrus', 'chocolate'],
      de: 'Fast nur Roggen. Trocken, scharf und genau richtig für einen Manhattan.',
      en: 'Almost all rye. Dry, sharp and exactly right for a Manhattan.'
    }),
    bottle({
      name: 'Talisker Skye', brand: 'Talisker', kind: 'Single Malt', expression: 'Skye', backBar: true,
      origin: 'Skye', peat: 2, age: null, abv: 45.8, price: 6.5, cls: 'puzzle',
      cask: BOTH, caskEn: BOTH_EN, level: 'kenner', serve: TALL, serveEn: TALL_EN,
      notes: ['maritim/salzig', 'honig/vanille', 'würzig'],
      notesEn: ['maritime/salty', 'honey/vanilla', 'spicy'],
      de: 'Der weichere Talisker. Gleicher Wind, weniger Kante, mehr Süße.',
      en: 'The softer Talisker. Same wind, less edge, more sweetness.'
    }),
    bottle({
      name: 'Singleton of Dufftown 15', brand: 'Singleton', kind: 'Single Malt',
      expression: '15 Jahre', backBar: true,
      origin: 'Speyside', peat: 0, age: 15, abv: 40, price: 7.9, cls: 'puzzle',
      cask: SHERRY, caskEn: SHERRY_EN, level: 'kenner', serve: NEAT, serveEn: NEAT_EN,
      notes: ['dunkle früchte', 'nussig', 'malzig'], notesEn: ['dark fruit', 'nutty', 'malty'],
      de: 'Der grosse Bruder vom Zwölfer. Drei Jahre länger im Sherryfass und man schmeckt jedes davon.',
      en: 'The big brother of the twelve. Three more years in sherry and you taste every one of them.'
    })
  ];

  /* Profiled where it lives, which is the Spirituosen section and not the
   * whisky one. The app finds it anyway, which is the entire argument for
   * reading the data instead of the section title. */
  var ELSEWHERE = [
    bottle({
      name: "Jack Daniel's Old No. 7", brand: "Jack Daniel's", kind: 'Tennessee Whiskey',
      expression: 'Old No. 7',
      origin: 'Tennessee', peat: 0, age: null, abv: 40, price: 4.5, rank: 11, cls: 'plowhorse',
      cask: OAK, caskEn: OAK_EN, level: 'einstieg', serve: LONG, serveEn: LONG_EN,
      notes: ['honig/vanille', 'schokolade', 'malzig'], notesEn: ['honey/vanilla', 'chocolate', 'malty'],
      de: 'Durch Holzkohle gefiltert, deshalb so weich und süß. Der meistbestellte Whiskey der Welt.',
      en: 'Filtered through charcoal, which is why it is so soft and sweet. The most ordered whiskey in the world.'
    })
  ];

  /* Rows that are not whisky, so the app has to prove it tells them apart by
   * the data and not by the section they sit in. The two flavoured bottles
   * are the real case, they are whiskey in the bar and unprofiled on the
   * card, and until someone profiles them the app must leave them alone. */
  var OTHER = [
    {
      name: 'Augustiner Helles 0,5l', name_en: 'Augustiner Helles 0,5l',
      group: 'Helles', group_en: 'Lager', price: 4.4, prices: [{ size: '', price: 4.4 }],
      description: 'Münchens Kult-Helles, schlank, malzig, unaufgeregt gut.',
      description_en: "Munich's cult lager, lean, malty, effortlessly good.",
      bartender_note: '', bartender_note_en: '',
      ingredients: [], ingredients_en: [], strength: '',
      allergens: ['Gluten'], allergens_en: ['Gluten'], allergen_codes: [1],
      alcohol_free: false, image: null, pos_sku: '', hidden_on_card: false,
      on_printed_menu: true, popularity_rank: 9999, menu_class: 'plowhorse', recommended: false
    },
    {
      name: 'Old Fashioned', name_en: 'Old Fashioned',
      group: '', group_en: '', price: 9.7, prices: [{ size: '', price: 9.7 }],
      description: 'Whiskey, Zucker, Bitter, Eis. Der älteste Cocktail der Welt.',
      description_en: 'Whiskey, sugar, bitters, ice. The oldest cocktail in the world.',
      bartender_note: '', bartender_note_en: '',
      ingredients: ['Four Roses', 'Zucker', 'Angostura'],
      ingredients_en: ['Four Roses', 'Sugar', 'Angostura'],
      strength: 'stark', allergens: [], allergens_en: [], allergen_codes: [],
      alcohol_free: false, image: null, pos_sku: '149', hidden_on_card: false,
      on_printed_menu: false, popularity_rank: 58, menu_class: 'star', recommended: false
    },
    {
      name: 'Fireball', name_en: 'Fireball',
      group: '', group_en: '', price: 3.5, prices: [{ size: '2 cl', price: 3.5 }],
      description: 'Zimtlikör auf Whiskeybasis, süß und heiß.',
      description_en: 'Cinnamon liqueur on a whiskey base, sweet and hot.',
      bartender_note: '', bartender_note_en: '',
      ingredients: [], ingredients_en: [], strength: 'mittel',
      allergens: [], allergens_en: [], allergen_codes: [],
      alcohol_free: false, image: null, pos_sku: '', hidden_on_card: true,
      on_printed_menu: false, popularity_rank: 9999, menu_class: 'plowhorse',
      recommended: false, brand: 'Fireball'
    }
  ];

  var MENU = {
    name: 'BrunnenBar VORSCHAU',
    generated: '2026-09-08',
    published_at: '2026-09-08T00:00:00+02:00',
    content_hash: 'vorschau-nicht-echt',
    url: 'preview only, not the Menu API',
    languages: ['de', 'en'],
    allergens: { de: {}, en: {}, intro_de: '', intro_en: '', outro_de: '', outro_en: '' },
    sections: [
      { title: 'Whisk(e)y Neat', title_en: 'Whisk(e)y Neat', items: NEAT_CARD.concat(BACK_BAR) },
      { title: 'Spirituosen', title_en: 'Spirits', items: ELSEWHERE.concat([OTHER[2]]) },
      { title: 'Bier', title_en: 'Beer', items: [OTHER[0]] },
      { title: 'Whisk(e)y Cocktails', title_en: 'Whisk(e)y Cocktails', items: [OTHER[1]] }
    ]
  };

  var WHISKY = NEAT_CARD.concat(BACK_BAR, ELSEWHERE);

  var api = { menu: MENU, WHISKY: WHISKY, OTHER: OTHER };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBWhiskyDemo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
