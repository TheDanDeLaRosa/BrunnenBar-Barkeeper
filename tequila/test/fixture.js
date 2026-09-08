/*
 * A Menu API payload, shaped exactly like the documented WordPress response.
 * =========================================================================
 * TEST DATA, NOT A COPY OF THE CARD. The bottles are the ones the bar
 * actually lists, because the point of a fixture is to catch the cases that
 * really occur, but the prices are round numbers nobody would charge and
 * nothing in the app can reach this file. The brief forbids shipping a
 * bundled menu and that stays true.
 *
 * The live endpoint is unreachable from the build environment, so this is how
 * the derivation and the engine get tested at all.
 *
 * Two shapes are exported.
 *
 *   MENU             the 08.09.2026 card, with agave_kind, agave_expression,
 *                    brand, agave_region and additive_free filled in
 *   beforePublish()  the same card with those five fields stripped
 *
 * The second one is not hypothetical. The fields live in menu.json and reach
 * page 217 only when the website seat republishes, so a browser will see the
 * older shape in between and the app has to stay useful through it.
 * =========================================================================
 */
'use strict';

function item(over) {
  return Object.assign({
    name: '', name_en: '', group: '', group_en: '',
    price: null, prices: [],
    description: '', description_en: '',
    bartender_note: '', bartender_note_en: '',
    ingredients: [], ingredients_en: [],
    strength: '',
    allergens: [], allergens_en: [], allergen_codes: [],
    alcohol_free: false, pos_sku: '', hidden_on_card: false,
    on_printed_menu: true, popularity_rank: 9999,
    image: null, recommended: false, menu_class: 'dog'
  }, over);
}

function priced(n) { return [{ size: '', price: n }]; }

/* A neat pour as the card carries it now. Every one of these is 38 to 40 per
 * cent, which is why they all read `stark`. */
function pour(over) {
  return item(Object.assign({
    group: 'Tequila & Mezcal Neat', group_en: 'Tequila & Mezcal Neat',
    strength: 'stark', agave_kind: 'Tequila', brand: 'Don Julio',
    agave_region: 'Highland', additive_free: false
  }, over));
}

var SECTIONS = [
  {
    title: 'Bier', title_en: 'Beer', items: [
      item({
        name: 'Helles 0,5l', name_en: 'Lager 0,5l', group: 'Helles', group_en: 'Lager',
        price: 4, prices: priced(4),
        description: 'Schlank und malzig.', description_en: 'Lean and malty.',
        allergens: ['Gluten'], allergens_en: ['Gluten'], allergen_codes: [1],
        popularity_rank: 3
      })
    ]
  },
  {
    title: 'Wein', title_en: 'Wine', items: [
      item({
        name: 'Riesling', name_en: 'Riesling', group: 'Weisswein', group_en: 'White wine',
        price: 6, prices: [{ size: '0,2 l', price: 6 }, { size: '0,5 l', price: 14 }],
        allergens: ['Sulfite'], allergens_en: ['Sulphites'], allergen_codes: [12]
      })
    ]
  },
  {
    // The trap. Agave syrup in a drink with no agave spirit anywhere near it.
    title: 'Gin', title_en: 'Gin', items: [
      item({
        name: 'Gin Sour', name_en: 'Gin Sour',
        price: 9, prices: priced(9),
        ingredients: ['Tanqueray', 'Zitrone', 'Agave', 'Eiweiss'],
        ingredients_en: ['Tanqueray', 'Lemon', 'Agave', 'Egg white'],
        strength: 'mittel',
        allergens: ['Ei'], allergens_en: ['Egg'], allergen_codes: [3]
      })
    ]
  },
  {
    // The neighbouring neat section. Same shape, no agave, must stay out.
    title: 'Whisk(e)y Neat', title_en: 'Whisk(e)y Neat', items: [
      item({
        name: 'Talisker 10', name_en: 'Talisker 10',
        group: 'Whisky', group_en: 'Whisky',
        price: 11, prices: priced(11), strength: 'stark'
      }),
      item({
        name: 'Four Roses', name_en: 'Four Roses',
        group: 'Bourbon', group_en: 'Bourbon',
        price: 9, prices: priced(9), strength: 'stark'
      })
    ]
  },
  {
    title: 'Tequila & Mezcal Neat', title_en: 'Tequila & Mezcal Neat', items: [
      pour({
        name: 'Don Julio Blanco', name_en: 'Don Julio Blanco',
        agave_expression: 'Blanco', recommended: true, menu_class: 'star',
        image: 'https://brunnenbar.com/wp-content/uploads/don-julio-blanco.jpg',
        price: 9.5, prices: [{ size: '2 cl', price: 9.5 }, { size: '4 cl', price: 17 }],
        description: 'Pfeffrig und klar.', description_en: 'Peppery and clear.',
        bartender_note: 'Die Agave ganz vorn.', bartender_note_en: 'Agave right up front.',
        popularity_rank: 12, pos_sku: 'T1'
      }),
      pour({
        name: 'Don Julio Reposado', name_en: 'Don Julio Reposado',
        agave_expression: 'Reposado',
        price: 11, prices: priced(11), popularity_rank: 20, pos_sku: 'T2'
      }),
      pour({
        name: 'Don Julio Añejo', name_en: 'Don Julio Anejo',
        agave_expression: 'Añejo',
        price: 14, prices: priced(14), popularity_rank: 30, pos_sku: 'T3'
      }),
      pour({
        // Rosado is a reposado finished in port casks, and its own answer.
        name: 'Don Julio Rosado', name_en: 'Don Julio Rosado',
        agave_expression: 'Rosado',
        price: 15, prices: priced(15), pos_sku: 'T4'
      }),
      pour({
        /* The whole reason agave_expression exists. Nothing in this name says
         * anejo, so before the field landed the app could not place it. */
        name: 'Don Julio 1942', name_en: 'Don Julio 1942',
        agave_expression: 'Añejo',
        price: 29, prices: priced(29), on_printed_menu: false, pos_sku: 'T5'
      }),
      pour({
        name: 'Nuestra Soledad Mezcal', name_en: 'Nuestra Soledad Mezcal',
        brand: 'Nuestra Soledad', agave_kind: 'Mezcal', agave_expression: '',
        agave_region: 'Oaxaca / Valles', additive_free: true,
        price: 13, prices: priced(13), popularity_rank: 40, pos_sku: 'T6'
      }),
      item({
        /* A bottle on the card before the seat filled the fields in. Carries
         * neither the new fields nor a strength, so it exercises the name
         * fallback and the neutral scoring in one item. */
        name: 'Ocho Plata', name_en: 'Ocho Plata',
        group: 'Tequila & Mezcal Neat', group_en: 'Tequila & Mezcal Neat',
        price: 12, prices: priced(12), pos_sku: 'T7'
      }),
      pour({
        /* A till article. Carried in the payload, never shown to a guest.
         * If this ever turns up in a result the source stopped filtering. */
        name: 'Don Julio Blanco Flasche', name_en: 'Don Julio Blanco bottle',
        agave_expression: 'Blanco', hidden_on_card: true,
        price: 220, prices: priced(220), pos_sku: 'T99'
      })
    ]
  },
  {
    /* The section the data spec assigns this app alongside the neat shelf.
     * Its one item names no agave anywhere, which is the case only the
     * section can vouch for. */
    title: 'Tequila Cocktails', title_en: 'Tequila Cocktails', items: [
      item({
        name: 'El Jefe', name_en: 'El Jefe',
        price: 10, prices: priced(10),
        ingredients: ['Hausmischung', 'Limette', 'Soda'],
        ingredients_en: ['House mix', 'Lime', 'Soda'],
        strength: 'mittel', recommended: true, menu_class: 'puzzle', pos_sku: 'C0'
      })
    ]
  },
  {
    title: 'Agave Cocktails', title_en: 'Agave Cocktails', items: [
      // Cocktails carry none of the new fields, and are not expected to.
      item({
        name: 'Margarita', name_en: 'Margarita',
        price: 9, prices: priced(9),
        description: 'Der Massstab.', description_en: 'The benchmark.',
        recommended: true, menu_class: 'plowhorse',
        image: 'https://brunnenbar.com/wp-content/uploads/margarita.jpg',
        ingredients: ['Tequila', 'Limette', 'Cointreau', 'Salz'],
        ingredients_en: ['Tequila', 'Lime', 'Cointreau', 'Salt'],
        strength: 'stark', popularity_rank: 5, pos_sku: 'C1'
      }),
      item({
        name: 'Paloma', name_en: 'Paloma',
        price: 9, prices: priced(9),
        ingredients: ['El Destilador Blanco', 'Grapefruit', 'Limette', 'Agave'],
        ingredients_en: ['El Destilador Blanco', 'Grapefruit', 'Lime', 'Agave'],
        strength: 'mild', popularity_rank: 2, pos_sku: 'C2'
      }),
      item({
        name: 'Margarita Rojas', name_en: 'Margarita Rojas',
        price: 13, prices: priced(13),
        ingredients: ['Mezcal', 'Limette', 'Cointreau', 'Tajín'],
        ingredients_en: ['Mezcal', 'Lime', 'Cointreau', 'Tajín'],
        strength: 'stark', popularity_rank: 25, pos_sku: 'C3'
      }),
      item({
        name: 'Dama Elena', name_en: 'Dama Elena',
        price: 9, prices: priced(9),
        ingredients: ['Don Julio Blanco', 'Cointreau', 'Zitrone', 'Eiweiss'],
        ingredients_en: ['Don Julio Blanco', 'Cointreau', 'Lemon', 'Egg white'],
        strength: 'mittel',
        allergens: ['Ei'], allergens_en: ['Egg'], allergen_codes: [3],
        on_printed_menu: false, pos_sku: 'C4'
      }),
      item({
        name: 'Mikki', name_en: 'Mikki',
        price: 9, prices: priced(9),
        ingredients: ['Don Julio Reposado', 'Amaretto', 'Agave', 'Orange Bitters'],
        ingredients_en: ['Don Julio Reposado', 'Amaretto', 'Agave', 'Orange bitters'],
        strength: 'stark',
        allergens: ['Nüsse'], allergens_en: ['Nuts'], allergen_codes: [8],
        on_printed_menu: false, pos_sku: 'C5'
      }),
      item({
        name: 'Ranch Water', name_en: 'Ranch Water',
        price: 9, prices: priced(9),
        ingredients: ['Don Julio Blanco', 'Limette', 'Mineralwasser'],
        ingredients_en: ['Don Julio Blanco', 'Lime', 'Mineral water'],
        strength: 'mild', popularity_rank: 60, pos_sku: 'C6'
      }),
      item({
        name: 'Picante', name_en: 'Picante',
        price: 12, prices: priced(12),
        ingredients: ['Don Julio Reposado', 'Limette', 'Agave', 'Chili', 'Koriander'],
        ingredients_en: ['Don Julio Reposado', 'Lime', 'Agave', 'Chili', 'Coriander'],
        strength: 'stark', pos_sku: 'C7'
      })
    ]
  }
];

var MENU = {
  name: 'BrunnenBar',
  generated: '2026-09-08',
  published_at: '2026-09-08T10:00:00+02:00',
  content_hash: 'fa59f27a2a8dc192',
  url: 'https://brunnenbar.com/wp-json/wp/v2/pages/217?_fields=content',
  languages: ['de', 'en'],
  allergens: {
    de: { '1': 'Glutenhaltige Getreide', '3': 'Eier', '8': 'Schalenfrüchte' },
    en: { '1': 'Cereals containing gluten', '3': 'Eggs', '8': 'Nuts' },
    intro_de: 'i', intro_en: 'i', outro_de: 'o', outro_en: 'o'
  },
  sections: SECTIONS
};

/* The same card as page 217 serves it until the website seat republishes. */
var NEW_FIELDS = ['agave_kind', 'agave_expression', 'brand', 'agave_region', 'additive_free'];

function beforePublish() {
  var copy = JSON.parse(JSON.stringify(MENU));
  copy.sections.forEach(function (s) {
    s.items.forEach(function (i) {
      NEW_FIELDS.forEach(function (f) { delete i[f]; });
    });
  });
  return copy;
}

module.exports = {
  MENU: MENU, item: item, priced: priced,
  beforePublish: beforePublish, NEW_FIELDS: NEW_FIELDS
};
