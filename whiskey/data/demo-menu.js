/*
 * PREVIEW DATA. NOT THE BAR'S CARD. NOT A FALLBACK.
 * =========================================================================
 * Every price, every tasting note and every description in this file is
 * invented, so that the app can be looked at and argued about before the
 * Menu API carries whisky profiles. It is loaded only when the address bar
 * says ?demo=1, it is never loaded when a fetch fails, and the page shouts
 * in gold on every screen while it is in use.
 *
 * The bottles are the ones a Diageo led back bar would plausibly carry, so
 * the shape is realistic. The numbers on them are not. When the real profiles
 * land in the Menu API, delete this file.
 *
 * The payload is shaped exactly like the Menu API response, which is the
 * point. It also carries one beer and one cocktail, because the app has to
 * prove it can tell a whisky from everything else on the card by the data
 * alone and never by the name of a section.
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
      pos_sku: o.sku || '',
      hidden_on_card: false,
      on_printed_menu: o.off !== true,
      popularity_rank: o.rank == null ? 9999 : o.rank,
      whisky: {
        kind: o.kind, kind_en: o.kindEn || o.kind,
        distillery: o.distillery || '',
        origin: o.origin, origin_en: o.originEn || o.origin,
        age_years: o.age == null ? null : o.age,
        abv: o.abv,
        cask: o.cask, cask_en: o.caskEn,
        peat: o.peat,
        notes: o.notes, notes_en: o.notesEn,
        serve: o.serve, serve_en: o.serveEn,
        level: o.level
      }
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

  var WHISKY = [
    bottle({
      name: 'Singleton of Dufftown 12', group: 'Single Malt', group_en: 'Single malt',
      distillery: 'Dufftown', kind: 'Single Malt', origin: 'Speyside', age: 12, abv: 40,
      cask: BOTH, caskEn: BOTH_EN, peat: 0, level: 'einstieg', price: 5.5, rank: 6,
      notes: ['fruchtig', 'honig/vanille', 'malzig'], notesEn: ['fruity', 'honey/vanilla', 'malty'],
      serve: ICE, serveEn: ICE_EN,
      de: 'Weich, süß und ohne jede Kante. Der Whisky, mit dem hier die meisten anfangen.',
      en: 'Soft, sweet and without an edge anywhere. The whisky most people here start with.'
    }),
    bottle({
      name: 'Cardhu 12', group: 'Single Malt', group_en: 'Single malt',
      distillery: 'Cardhu', kind: 'Single Malt', origin: 'Speyside', age: 12, abv: 40,
      cask: BOURBON, caskEn: BOURBON_EN, peat: 0, level: 'einstieg', price: 5.5, rank: 14,
      notes: ['blumig', 'honig/vanille', 'fruchtig'], notesEn: ['floral', 'honey/vanilla', 'fruity'],
      serve: ICE, serveEn: ICE_EN,
      de: 'Leicht und blumig, fast wie Honig auf einem warmen Sommerabend.',
      en: 'Light and floral, almost like honey on a warm summer evening.'
    }),
    bottle({
      name: 'Glenkinchie 12', group: 'Single Malt', group_en: 'Single malt',
      distillery: 'Glenkinchie', kind: 'Single Malt', origin: 'Lowlands', age: 12, abv: 43,
      cask: BOURBON, caskEn: BOURBON_EN, peat: 0, level: 'einstieg', price: 5.9,
      notes: ['blumig', 'zitrus', 'malzig'], notesEn: ['floral', 'citrus', 'malty'],
      serve: ICE, serveEn: ICE_EN,
      de: 'Der Garten von Edinburgh im Glas, grasig und hell und sehr freundlich.',
      en: 'The garden of Edinburgh in a glass, grassy and bright and very friendly.'
    }),
    bottle({
      name: 'Cragganmore 12', group: 'Single Malt', group_en: 'Single malt',
      distillery: 'Cragganmore', kind: 'Single Malt', origin: 'Speyside', age: 12, abv: 40,
      cask: BOTH, caskEn: BOTH_EN, peat: 0, level: 'klassiker', price: 6.5,
      notes: ['malzig', 'nussig', 'fruchtig'], notesEn: ['malty', 'nutty', 'fruity'],
      serve: NEAT, serveEn: NEAT_EN,
      de: 'Komplex ohne laut zu werden. Ein Whisky, der sich Zeit nimmt.',
      en: 'Complex without ever raising its voice. A whisky that takes its time.'
    }),
    bottle({
      name: 'Dalwhinnie 15', group: 'Single Malt', group_en: 'Single malt',
      distillery: 'Dalwhinnie', kind: 'Single Malt', origin: 'Highlands', age: 15, abv: 43,
      cask: BOURBON, caskEn: BOURBON_EN, peat: 0, level: 'kenner', price: 6.9,
      notes: ['honig/vanille', 'blumig', 'malzig'], notesEn: ['honey/vanilla', 'floral', 'malty'],
      serve: NEAT, serveEn: NEAT_EN,
      de: 'Aus der kältesten Destillerie Schottlands und trotzdem der wärmste Honig.',
      en: "From Scotland's coldest distillery and still the warmest honey.",
      noteDe: 'Probier ihn mal ganz leicht gekühlt, das machen sie in Dalwhinnie selbst so.',
      noteEn: 'Try it very lightly chilled, that is how they drink it at Dalwhinnie.'
    }),
    bottle({
      name: 'Clynelish 14', group: 'Single Malt', group_en: 'Single malt',
      distillery: 'Clynelish', kind: 'Single Malt', origin: 'Highlands', age: 14, abv: 46,
      cask: BOURBON, caskEn: BOURBON_EN, peat: 1, level: 'kenner', price: 7.9,
      notes: ['zitrus', 'honig/vanille', 'maritim/salzig'], notesEn: ['citrus', 'honey/vanilla', 'maritime/salty'],
      serve: NEAT, serveEn: NEAT_EN,
      de: 'Wachsig, salzig, mit einer Zitrone irgendwo dahinter. Der Liebling vieler Barleute.',
      en: 'Waxy, salty, with a lemon hiding somewhere behind. A favourite among bar people.'
    }),
    bottle({
      name: 'Oban 14', group: 'Single Malt', group_en: 'Single malt',
      distillery: 'Oban', kind: 'Single Malt', origin: 'Highlands', age: 14, abv: 43,
      cask: BOTH, caskEn: BOTH_EN, peat: 1, level: 'klassiker', price: 7.5, rank: 9,
      notes: ['maritim/salzig', 'fruchtig', 'würzig'], notesEn: ['maritime/salty', 'fruity', 'spicy'],
      serve: NEAT, serveEn: NEAT_EN,
      de: 'Genau zwischen den sanften Speysiders und dem Rauch der Inseln. Ein guter erster Schritt Richtung Westküste.',
      en: 'Right between the gentle Speysiders and the smoke of the islands. A good first step towards the west coast.'
    }),
    bottle({
      name: 'Talisker 10', group: 'Single Malt', group_en: 'Single malt',
      distillery: 'Talisker', kind: 'Single Malt', origin: 'Inseln', originEn: 'The islands',
      age: 10, abv: 45.8, cask: BOURBON, caskEn: BOURBON_EN, peat: 2, level: 'klassiker',
      price: 6.9, rank: 2,
      notes: ['maritim/salzig', 'würzig', 'fruchtig'], notesEn: ['maritime/salty', 'spicy', 'fruity'],
      serve: TALL, serveEn: TALL_EN,
      de: 'Pfeffer, Salz und ein Feuer am Strand. Von Skye und schmeckt auch danach.',
      en: 'Pepper, salt and a fire on the beach. From Skye and it tastes like it.',
      noteDe: 'Wir bauen daraus auch den Talisker Campfire mit warmer Schokolade, frag einfach danach.',
      noteEn: 'We also build the Talisker Campfire from it with warm chocolate, just ask.'
    }),
    bottle({
      name: 'Caol Ila 12', group: 'Single Malt', group_en: 'Single malt',
      distillery: 'Caol Ila', kind: 'Single Malt', origin: 'Islay', age: 12, abv: 43,
      cask: BOURBON, caskEn: BOURBON_EN, peat: 3, level: 'kenner', price: 6.9,
      notes: ['maritim/salzig', 'zitrus', 'würzig'], notesEn: ['maritime/salty', 'citrus', 'spicy'],
      serve: TALL, serveEn: TALL_EN,
      de: 'Rauch, aber schlank und frisch. Der zugänglichste Islay, den wir da stehen haben.',
      en: 'Smoke, but lean and fresh. The most approachable Islay we have on the shelf.'
    }),
    bottle({
      name: 'Lagavulin 16', group: 'Single Malt', group_en: 'Single malt',
      distillery: 'Lagavulin', kind: 'Single Malt', origin: 'Islay', age: 16, abv: 43,
      cask: BOTH, caskEn: BOTH_EN, peat: 4, level: 'rarität', price: 9.5, rank: 12,
      notes: ['dunkle früchte', 'schokolade', 'maritim/salzig'], notesEn: ['dark fruit', 'chocolate', 'maritime/salty'],
      serve: NEAT, serveEn: NEAT_EN,
      de: 'Der lauteste Whisky im Regal und gleichzeitig der eleganteste. Torf, Teer und dunkle Frucht.',
      en: 'The loudest whisky on the shelf and somehow also the most elegant. Peat, tar and dark fruit.'
    }),
    bottle({
      name: 'Mortlach 16', group: 'Single Malt', group_en: 'Single malt',
      distillery: 'Mortlach', kind: 'Single Malt', origin: 'Speyside', age: 16, abv: 43.4,
      cask: SHERRY, caskEn: SHERRY_EN, peat: 0, level: 'rarität', price: 11.5, off: true,
      notes: ['dunkle früchte', 'nussig', 'schokolade'], notesEn: ['dark fruit', 'nutty', 'chocolate'],
      serve: NEAT, serveEn: NEAT_EN,
      de: 'Fleischig, dunkel und sehr alt in der Machart. Wird zweieinhalb Mal gebrannt, was sonst niemand tut.',
      en: 'Meaty, dark and very old fashioned in the making. Distilled two and a half times, which nobody else does.'
    }),
    bottle({
      name: 'Johnnie Walker Black Label 12', group: 'Blend', group_en: 'Blend',
      distillery: 'Johnnie Walker', kind: 'Blended Scotch', origin: 'Schottland', originEn: 'Scotland',
      age: 12, abv: 40, cask: BOTH, caskEn: BOTH_EN, peat: 1, level: 'klassiker',
      price: 5.5, rank: 4,
      notes: ['fruchtig', 'würzig', 'honig/vanille'], notesEn: ['fruity', 'spicy', 'honey/vanilla'],
      serve: LONG, serveEn: LONG_EN,
      de: 'Vierzig Whiskys in einer Flasche und trotzdem immer gleich gut. Der Klassiker hinter jeder Bar.',
      en: 'Forty whiskies in one bottle and reliably good every time. The classic behind every bar.'
    }),
    bottle({
      name: 'Roe & Co', group: 'Irish', group_en: 'Irish',
      distillery: 'Roe & Co', kind: 'Irish Blend', origin: 'Irland', originEn: 'Ireland',
      age: null, abv: 45, cask: BOURBON, caskEn: BOURBON_EN, peat: 0, level: 'einstieg',
      price: 5,
      notes: ['fruchtig', 'honig/vanille', 'cremig'], notesEn: ['fruity', 'honey/vanilla', 'creamy'],
      serve: LONG, serveEn: LONG_EN,
      de: 'Weich und rund, gebaut für lange Gläser. Aus Dublin, direkt neben dem alten Guinness Kraftwerk.',
      en: 'Soft and round, built for long glasses. From Dublin, right next to the old Guinness power station.'
    }),
    bottle({
      name: 'Jameson', group: 'Irish', group_en: 'Irish',
      distillery: 'Jameson', kind: 'Irish Blend', origin: 'Irland', originEn: 'Ireland',
      age: null, abv: 40, cask: BOTH, caskEn: BOTH_EN, peat: 0, level: 'einstieg',
      price: 4.5, rank: 3,
      notes: ['fruchtig', 'nussig', 'honig/vanille'], notesEn: ['fruity', 'nutty', 'honey/vanilla'],
      serve: LONG, serveEn: LONG_EN,
      de: 'Dreifach gebrannt und deshalb so weich. Der freundlichste Weg in den Whisky.',
      en: 'Triple distilled and that is why it is so soft. The friendliest way into whiskey.'
    }),
    bottle({
      name: 'Bulleit Bourbon', group: 'Bourbon', group_en: 'Bourbon',
      distillery: 'Bulleit', kind: 'Bourbon', origin: 'USA', age: null, abv: 45,
      cask: OAK, caskEn: OAK_EN, peat: 0, level: 'klassiker', price: 5.5, rank: 5,
      notes: ['würzig', 'honig/vanille', 'fruchtig'], notesEn: ['spicy', 'honey/vanilla', 'fruity'],
      serve: LONG, serveEn: LONG_EN,
      de: 'Hoher Roggenanteil, deshalb pfeffriger als die meisten Bourbons. Der Whiskey in unserem Mint Julep.',
      en: 'A high rye share, which makes it peppier than most bourbons. The whiskey in our Mint Julep.'
    }),
    bottle({
      name: 'Bulleit Rye', group: 'Rye', group_en: 'Rye',
      distillery: 'Bulleit', kind: 'Rye', origin: 'USA', age: null, abv: 45,
      cask: OAK, caskEn: OAK_EN, peat: 0, level: 'kenner', price: 5.9,
      notes: ['würzig', 'zitrus', 'schokolade'], notesEn: ['spicy', 'citrus', 'chocolate'],
      serve: LONG, serveEn: LONG_EN,
      de: 'Fast nur Roggen. Trocken, scharf und genau richtig für einen Manhattan.',
      en: 'Almost all rye. Dry, sharp and exactly right for a Manhattan.'
    }),
    bottle({
      name: 'Four Roses', group: 'Bourbon', group_en: 'Bourbon',
      distillery: 'Four Roses', kind: 'Bourbon', origin: 'USA', age: null, abv: 40,
      cask: OAK, caskEn: OAK_EN, peat: 0, level: 'klassiker', price: 4.5, rank: 8,
      notes: ['fruchtig', 'honig/vanille', 'blumig'], notesEn: ['fruity', 'honey/vanilla', 'floral'],
      serve: LONG, serveEn: LONG_EN,
      de: 'Weicher Bourbon mit Birne und Vanille. Steht bei uns in fast jedem Old Fashioned.',
      en: 'Soft bourbon with pear and vanilla. It goes into almost every Old Fashioned we build.'
    }),
    bottle({
      name: "Jack Daniel's Old No. 7", group: 'Tennessee', group_en: 'Tennessee',
      distillery: "Jack Daniel's", kind: 'Tennessee Whiskey', origin: 'USA', age: null, abv: 40,
      cask: OAK, caskEn: OAK_EN, peat: 0, level: 'einstieg', price: 4.5, rank: 1,
      notes: ['honig/vanille', 'schokolade', 'malzig'], notesEn: ['honey/vanilla', 'chocolate', 'malty'],
      serve: LONG, serveEn: LONG_EN,
      de: 'Durch Holzkohle gefiltert, deshalb so weich und süß. Der meistbestellte Whiskey der Welt.',
      en: 'Filtered through charcoal, which is why it is so soft and sweet. The most ordered whiskey in the world.'
    }),
    bottle({
      name: 'Nikka From The Barrel', group: 'Japan', group_en: 'Japan',
      distillery: 'Nikka', kind: 'Japanese Blend', origin: 'Japan', age: null, abv: 51.4,
      cask: BOTH, caskEn: BOTH_EN, peat: 1, level: 'kenner', price: 8.5,
      notes: ['dunkle früchte', 'würzig', 'schokolade'], notesEn: ['dark fruit', 'spicy', 'chocolate'],
      serve: ICE, serveEn: ICE_EN,
      de: 'Klein, eckig und überraschend kräftig. Ein Schluck Wasser und er blüht auf.',
      en: 'Small, square and surprisingly powerful. A splash of water and it opens right up.'
    })
  ];

  /* Two rows that are not whisky, so the app has to prove it tells them apart
   * by the data and not by the section they sit in. */
  var OTHER = [
    {
      name: 'Augustiner Helles 0,5l', name_en: 'Augustiner Helles 0,5l',
      group: 'Helles', group_en: 'Lager', price: 4.4, prices: [{ size: '', price: 4.4 }],
      description: 'Münchens Kult-Helles, schlank, malzig, unaufgeregt gut.',
      description_en: "Munich's cult lager, lean, malty, effortlessly good.",
      bartender_note: '', bartender_note_en: '',
      ingredients: [], ingredients_en: [], strength: '',
      allergens: ['Gluten'], allergens_en: ['Gluten'], allergen_codes: [1],
      alcohol_free: false, pos_sku: '', hidden_on_card: false,
      on_printed_menu: true, popularity_rank: 9999
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
      alcohol_free: false, pos_sku: '149', hidden_on_card: false,
      on_printed_menu: false, popularity_rank: 58
    }
  ];

  var MENU = {
    name: 'BrunnenBar VORSCHAU',
    generated: '2026-09-08',
    published_at: '2026-09-08T00:00:00+02:00',
    url: 'preview only, not the Menu API',
    languages: ['de', 'en'],
    allergens: { de: {}, en: {}, intro_de: '', intro_en: '', outro_de: '', outro_en: '' },
    sections: [
      { title: 'Whisky', title_en: 'Whisky', items: WHISKY },
      { title: 'Bier', title_en: 'Beer', items: [OTHER[0]] },
      { title: 'Cocktails', title_en: 'Cocktails', items: [OTHER[1]] }
    ]
  };

  var api = { menu: MENU, WHISKY: WHISKY, OTHER: OTHER };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBWhiskyDemo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
