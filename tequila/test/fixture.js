/*
 * A Menu API payload, shaped exactly like the documented WordPress response.
 * =========================================================================
 * TEST DATA, NOT A COPY OF THE CARD. Every item here is invented to exercise
 * one rule, the prices are round numbers nobody would charge, and nothing in
 * the app can reach this file. The brief forbids shipping a bundled menu and
 * that stays true.
 *
 * The live endpoint is unreachable from the build environment, so this is
 * how the derivation and the engine get tested at all.
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
    on_printed_menu: true, popularity_rank: 9999
  }, over);
}

function priced(n) { return [{ size: '', price: n }]; }

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
        name: 'Gin Sour', name_en: 'Gin Sour', group: '', group_en: '',
        price: 9, prices: priced(9),
        ingredients: ['Tanqueray', 'Zitrone', 'Agave', 'Eiweiss'],
        ingredients_en: ['Tanqueray', 'Lemon', 'Agave', 'Egg white'],
        strength: 'mittel',
        allergens: ['Ei'], allergens_en: ['Egg'], allergen_codes: [3]
      })
    ]
  },
  {
    title: 'Tequila pur', title_en: 'Tequila neat', items: [
      item({
        name: 'Don Julio Blanco', name_en: 'Don Julio Blanco',
        group: 'Tequila', group_en: 'Tequila',
        price: 9.5, prices: [{ size: '2 cl', price: 9.5 }, { size: '4 cl', price: 17 }],
        description: 'Pfeffrig und klar.', description_en: 'Peppery and clear.',
        bartender_note: 'Die Agave ganz vorn.', bartender_note_en: 'Agave right up front.',
        strength: 'stark', popularity_rank: 12, pos_sku: 'T1'
      }),
      item({
        name: 'Don Julio Reposado', name_en: 'Don Julio Reposado',
        group: 'Tequila', group_en: 'Tequila',
        price: 10, prices: priced(10),
        strength: 'stark', popularity_rank: 20, pos_sku: 'T2'
      }),
      item({
        name: 'Don Julio Añejo', name_en: 'Don Julio Anejo',
        group: 'Tequila', group_en: 'Tequila',
        price: 13, prices: priced(13),
        strength: 'stark', popularity_rank: 30, on_printed_menu: false, pos_sku: 'T3'
      }),
      item({
        // No brand in the list, so only the group word carries it.
        name: 'Ocho Plata', name_en: 'Ocho Plata',
        group: 'Tequila', group_en: 'Tequila',
        price: 11, prices: priced(11),
        strength: '', pos_sku: 'T4'          // strength the card does not record
      }),
      item({
        name: 'Casamigos Mezcal', name_en: 'Casamigos Mezcal',
        group: 'Mezcal', group_en: 'Mezcal',
        price: 12, prices: priced(12),
        strength: 'stark', popularity_rank: 40, pos_sku: 'T5'
      })
    ]
  },
  {
    title: 'Agave Cocktails', title_en: 'Agave Cocktails', items: [
      item({
        name: 'Margarita', name_en: 'Margarita',
        price: 9, prices: priced(9),
        description: 'Der Massstab.', description_en: 'The benchmark.',
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
  url: 'https://brunnenbar.com/wp-json/wp/v2/pages/217?_fields=content',
  languages: ['de', 'en'],
  allergens: {
    de: { '1': 'Glutenhaltige Getreide', '3': 'Eier', '8': 'Schalenfrüchte' },
    en: { '1': 'Cereals containing gluten', '3': 'Eggs', '8': 'Nuts' },
    intro_de: 'i', intro_en: 'i', outro_de: 'o', outro_en: 'o'
  },
  sections: SECTIONS
};

module.exports = { MENU: MENU, item: item, priced: priced };
