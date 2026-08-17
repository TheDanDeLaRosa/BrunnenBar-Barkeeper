/*
 * BrunnenBar — Cocktail data
 * =========================================================================
 * THIS IS THE ONLY FILE YOU NEED TO EDIT WHEN THE CARD CHANGES.
 *
 * Source: "Cocktail Recipes.xlsx" — All Recipes / Print Out sheets.
 * Guest-facing ingredient lists deliberately omit pour sizes; the exact
 * specs stay in the bar's spreadsheet, not on the public website.
 *
 * FIELD REFERENCE
 * ---------------------------------------------------------------------
 * id          unique slug, never reuse
 * name        printed on the card (same in both languages)
 * house       true  = BrunnenBar original / house twist
 * base        primary spirit family, one of BASES below
 * also        supporting spirits (used for "avoid this spirit" filtering)
 * strength    0 alkoholfrei · 1 leicht · 2 ausgewogen · 3 spirituosenbetont
 * texture     'long' | 'short' | 'frothy' | 'sparkling' | 'hot' | 'shot'
 * adventure   0 everyone knows it … 3 for the curious drinker
 * occasion    array of 'aperitif' | 'main' | 'nightcap' | 'celebration' | 'shot'
 * flags       'egg' | 'dairy' | 'nuts' | 'coffee'  (allergen / no-go filters)
 * profile     each 0–4. Keep them honest — the whole engine rests on these.
 *             sour sweet bitter herbal fruity boozy creamy smoky spicy fresh
 * naOf        id of the full-strength drink this is the zero-proof build of
 * hasNA       id of the zero-proof build of this drink
 * =========================================================================
 */
(function (root) {
  'use strict';

  var BASES = ['gin', 'vodka', 'rum', 'cachaca', 'tequila', 'mezcal', 'whiskey', 'pisco', 'aperitivo', 'none'];

  // Shorthand so the profiles stay readable: p(sour,sweet,bitter,herbal,fruity,boozy,creamy,smoky,spicy,fresh)
  function p(sour, sweet, bitter, herbal, fruity, boozy, creamy, smoky, spicy, fresh) {
    return {
      sour: sour, sweet: sweet, bitter: bitter, herbal: herbal, fruity: fruity,
      boozy: boozy, creamy: creamy, smoky: smoky, spicy: spicy, fresh: fresh
    };
  }

  var COCKTAILS = [
    {
      id: 'amaretto-sour', name: 'Amaretto Sour',
      base: 'whiskey', also: [], strength: 2, texture: 'frothy', adventure: 1,
      occasion: ['main', 'nightcap'], flags: ['egg', 'nuts'],
      profile: p(3, 3, 0, 0, 2, 2, 2, 0, 1, 2),
      glass: { de: 'Tumbler', en: 'Rocks glass' },
      ing: {
        de: ['Amaretto', 'Bourbon', 'Zitrone', 'Orange', 'Rohrzucker', 'Eiweiß'],
        en: ['Amaretto', 'Bourbon', 'Lemon', 'Orange', 'Cane sugar', 'Egg white']
      },
      note: {
        de: 'Marzipan-weich, aber der Bourbon hält dagegen. Der Einstieg für alle, die Sours bisher zu sauer fanden.',
        en: 'Soft as marzipan, with the bourbon holding the line. The way in for anyone who found sours too sharp.'
      }
    },
    {
      id: 'aperol-sour', name: 'Aperol Sour',
      base: 'aperitivo', also: [], strength: 1, texture: 'frothy', adventure: 1,
      occasion: ['aperitif', 'main'], flags: [],
      profile: p(3, 2, 2, 1, 3, 1, 1, 0, 0, 3),
      glass: { de: 'Tumbler', en: 'Rocks glass' },
      ing: {
        de: ['Aperol', 'Zitrone', 'Orange', 'Rohrzucker'],
        en: ['Aperol', 'Lemon', 'Orange', 'Cane sugar']
      },
      note: {
        de: 'Der Spritz für alle, die es ernster mögen: gleiche Bitterorange, ohne die Blasen, dafür mit Säure.',
        en: 'The spritz for people who want it a bit more serious — same bitter orange, no bubbles, real acidity.'
      }
    },
    {
      id: 'augsburg-blume', name: 'Augsburg Blume', house: true,
      base: 'cachaca', also: ['aperitivo'], strength: 3, texture: 'short', adventure: 2,
      occasion: ['aperitif', 'main'], flags: [],
      profile: p(0, 3, 2, 2, 3, 3, 0, 0, 0, 1),
      glass: { de: 'Tumbler auf großem Eis', en: 'Rocks glass, big ice' },
      ing: {
        de: ['Cachaça', 'Aperol', 'St. Germain Holunderblüte'],
        en: ['Cachaça', 'Aperol', 'St. Germain elderflower']
      },
      note: {
        de: 'Unser Haus-Drink. Drei Zutaten, kein Saft — Holunderblüte über Bitterorange, brasilianisch unterlegt.',
        en: 'Our house drink. Three ingredients, no juice — elderflower over bitter orange on a Brazilian base.'
      }
    },
    {
      id: 'augsburg-sour', name: 'Augsburg Sour', house: true,
      base: 'vodka', also: [], strength: 2, texture: 'frothy', adventure: 1,
      occasion: ['main', 'celebration'], flags: [],
      profile: p(3, 3, 0, 0, 4, 2, 2, 0, 0, 2),
      glass: { de: 'Coupette', en: 'Coupe' },
      ing: {
        de: ['City Wodka', 'Chambord Brombeerlikör', 'Zitrone', 'Orange', 'Rohrzucker'],
        en: ['City vodka', 'Chambord blackberry liqueur', 'Lemon', 'Orange', 'Cane sugar']
      },
      note: {
        de: 'Mit Augsburger Wodka gebaut. Tiefdunkle Beere, samtige Schaumkrone — und rein pflanzlich geschäumt.',
        en: 'Built on Augsburg vodka. Deep berry, a velvet head of foam — and the foam is plant-based.'
      }
    },
    {
      id: 'boulevardier', name: 'Boulevardier',
      base: 'whiskey', also: ['aperitivo'], strength: 3, texture: 'short', adventure: 2,
      occasion: ['aperitif', 'nightcap'], flags: [],
      profile: p(0, 2, 4, 3, 1, 4, 0, 0, 0, 0),
      glass: { de: 'Tumbler auf großem Eis', en: 'Rocks glass, big ice' },
      ing: {
        de: ['Bourbon', 'Campari', 'Roter Wermut'],
        en: ['Bourbon', 'Campari', 'Sweet vermouth']
      },
      note: {
        de: 'Der Negroni im Wintermantel. Wer Bitterkeit mag und Wärme dazu will, bestellt hier.',
        en: 'The Negroni in a winter coat. If you like bitter but want warmth with it, order this.'
      }
    },
    {
      id: 'caipirinha', name: 'Caipirinha',
      base: 'cachaca', also: [], strength: 3, texture: 'long', adventure: 0,
      occasion: ['main'], flags: [],
      profile: p(4, 2, 0, 0, 1, 3, 0, 0, 0, 4),
      glass: { de: 'Tumbler auf Crushed Ice', en: 'Rocks glass, crushed ice' },
      ing: {
        de: ['Cachaça', 'Limette', 'Rohrzucker'],
        en: ['Cachaça', 'Lime', 'Cane sugar']
      },
      note: {
        de: 'Limette, Zucker, Cachaça. Nichts dahinter zu verstecken — deshalb muss die Limette frisch sein.',
        en: 'Lime, sugar, cachaça. Nowhere to hide, which is why the lime has to be fresh.'
      }
    },
    {
      id: 'campfire-hot-chocolate', name: 'Campfire Hot Chocolate', house: true,
      base: 'whiskey', also: [], strength: 2, texture: 'hot', adventure: 2,
      occasion: ['nightcap'], flags: ['dairy'],
      profile: p(0, 3, 0, 0, 0, 2, 4, 4, 0, 0),
      glass: { de: 'Henkelglas', en: 'Mug' },
      ing: {
        de: ['Talisker Whisky', 'Milch', 'Kakao'],
        en: ['Talisker whisky', 'Milk', 'Cocoa']
      },
      note: {
        de: 'Heiß, rauchig, für draußen am Wasser im Winter. Der Talisker macht aus Kakao ein Lagerfeuer.',
        en: 'Hot, smoky, made for the waterfront in winter. The Talisker turns cocoa into a campfire.'
      }
    },
    {
      id: 'cinnamon-toast-crunch', name: 'Cinnamon Toast Crunch Shot',
      base: 'rum', also: ['whiskey'], strength: 2, texture: 'shot', adventure: 1,
      occasion: ['shot', 'celebration'], flags: ['dairy'],
      profile: p(0, 4, 0, 0, 0, 2, 4, 0, 3, 0),
      glass: { de: 'Shotglas', en: 'Shot glass' },
      ing: {
        de: ['RumChata', 'Zimt-Whiskey'],
        en: ['RumChata', 'Cinnamon whiskey']
      },
      note: {
        de: 'Schmeckt tatsächlich nach der Milch am Boden der Zimt-Cerealien. Für die Runde, nicht zum Nippen.',
        en: 'Genuinely tastes like the milk at the bottom of the cinnamon cereal bowl. For the round, not for sipping.'
      }
    },
    {
      id: 'clover-club', name: 'Clover Club',
      base: 'gin', also: [], strength: 2, texture: 'frothy', adventure: 2,
      occasion: ['aperitif', 'main'], flags: [],
      profile: p(3, 3, 0, 1, 4, 2, 2, 0, 0, 2),
      glass: { de: 'Coupette', en: 'Coupe' },
      ing: {
        de: ['Tanqueray Gin', 'Zitrone', 'Himbeersirup'],
        en: ['Tanqueray gin', 'Lemon', 'Raspberry syrup']
      },
      note: {
        de: 'Älter als die meisten Klassiker und rosa ohne Entschuldigung. Himbeere und Wacholder passen erstaunlich gut.',
        en: 'Older than most classics and pink without apology. Raspberry and juniper get on remarkably well.'
      }
    },
    {
      id: 'cosmopolitan', name: 'Cosmopolitan',
      base: 'vodka', also: [], strength: 2, texture: 'short', adventure: 0,
      occasion: ['main', 'celebration'], flags: [],
      profile: p(3, 2, 0, 0, 3, 2, 0, 0, 0, 3),
      glass: { de: 'Coupette', en: 'Coupe' },
      ing: {
        de: ['Absolut Wodka', 'Cointreau', 'Cranberry', 'Limette'],
        en: ['Absolut vodka', 'Cointreau', 'Cranberry', 'Lime']
      },
      note: {
        de: 'Zu Unrecht belächelt: richtig gebaut ist der Cosmo trocken, scharf und alles andere als süß.',
        en: 'Unfairly mocked. Built properly a Cosmo is dry, sharp and nothing like sweet.'
      }
    },
    {
      id: 'dirty-martini', name: 'Dirty Martini',
      base: 'vodka', also: [], strength: 3, texture: 'short', adventure: 2,
      occasion: ['aperitif', 'nightcap'], flags: [],
      profile: p(0, 0, 1, 2, 0, 4, 0, 0, 0, 1),
      glass: { de: 'Martiniglas, eiskalt', en: 'Martini glass, ice cold' },
      ing: {
        de: ['Absolut Wodka', 'Noilly Prat Dry', 'Olivenlake', 'Oliven'],
        en: ['Absolut vodka', 'Noilly Prat dry vermouth', 'Olive brine', 'Olives']
      },
      note: {
        de: 'Kalt, salzig, kompromisslos. Kein Zucker, keine Frucht — im Grunde eine Vorspeise im Glas.',
        en: 'Cold, salty, uncompromising. No sugar, no fruit — essentially a starter in a glass.'
      }
    },
    {
      id: 'espresso-martini', name: 'Espresso Martini',
      base: 'vodka', also: [], strength: 3, texture: 'frothy', adventure: 0,
      occasion: ['nightcap', 'celebration'], flags: ['coffee'],
      profile: p(0, 3, 3, 0, 0, 3, 3, 0, 0, 0),
      glass: { de: 'Coupette', en: 'Coupe' },
      ing: {
        de: ['Absolut Wodka', 'Kahlúa', 'Frischer Espresso', 'Rohrzucker'],
        en: ['Absolut vodka', 'Kahlúa', 'Fresh espresso', 'Cane sugar']
      },
      note: {
        de: 'Der Drink, der den Abend verlängert. Espresso frisch gezogen — anders geht die Crema nicht.',
        en: 'The drink that extends the evening. Espresso pulled fresh — no other way to get that crema.'
      }
    },
    {
      id: 'frangelico-sour', name: 'Frangelico Sour',
      base: 'vodka', also: [], strength: 2, texture: 'frothy', adventure: 2,
      occasion: ['nightcap', 'main'], flags: ['egg', 'nuts'],
      profile: p(3, 3, 0, 0, 1, 2, 2, 0, 0, 2),
      glass: { de: 'Tumbler', en: 'Rocks glass' },
      ing: {
        de: ['Frangelico Haselnusslikör', 'Wodka', 'Zitrone', 'Limette', 'Rohrzucker', 'Eiweiß'],
        en: ['Frangelico hazelnut liqueur', 'Vodka', 'Lemon', 'Lime', 'Cane sugar', 'Egg white']
      },
      note: {
        de: 'Haselnuss und Zitrus — klingt seltsam, funktioniert. Wie Nussschokolade, nur wach.',
        en: 'Hazelnut against citrus — sounds odd, works. Like nut chocolate, but awake.'
      }
    },
    {
      id: 'gin-basil-smash', name: 'Gin Basil Smash',
      base: 'gin', also: [], strength: 2, texture: 'short', adventure: 1,
      occasion: ['aperitif', 'main'], flags: [],
      profile: p(3, 2, 0, 4, 1, 2, 0, 0, 0, 4),
      glass: { de: 'Tumbler auf Eis', en: 'Rocks glass' },
      ing: {
        de: ['Tanqueray Gin', 'Zitrone', 'Rohrzucker', 'Frisches Basilikum'],
        en: ['Tanqueray gin', 'Lemon', 'Cane sugar', 'Fresh basil']
      },
      note: {
        de: 'In Hamburg erfunden, längst überall. Knallgrün, krautig, und die Säure hält alles wach.',
        en: 'Invented in Hamburg, everywhere by now. Bright green, herbal, and the acidity keeps it awake.'
      }
    },
    {
      id: 'green-tea-shot', name: 'Green Tea Shot',
      base: 'whiskey', also: [], strength: 2, texture: 'shot', adventure: 1,
      occasion: ['shot', 'celebration'], flags: [],
      profile: p(2, 3, 0, 0, 3, 2, 0, 0, 0, 2),
      glass: { de: 'Shotglas', en: 'Shot glass' },
      ing: {
        de: ['Jameson', 'Pfirsichlikör', 'Lemon Squash', 'Sprite'],
        en: ['Jameson', 'Peach liqueur', 'Lemon squash', 'Sprite']
      },
      note: {
        de: 'Kein Tee drin. Schmeckt trotzdem so — und ist der freundlichste Whiskey-Shot, den es gibt.',
        en: 'No tea in it. Tastes like it anyway — and it is the friendliest whiskey shot there is.'
      }
    },
    {
      id: 'isar-morning', name: 'Isar Morning', house: true,
      base: 'cachaca', also: [], strength: 2, texture: 'long', adventure: 2,
      occasion: ['main', 'aperitif'], flags: [],
      profile: p(3, 2, 0, 3, 3, 2, 0, 0, 0, 4),
      glass: { de: 'Longdrinkglas', en: 'Highball' },
      ing: {
        de: ['Cachaça', 'Limette', 'Erdbeeren', 'Basilikum', 'Rohrzucker', 'Soda'],
        en: ['Cachaça', 'Lime', 'Strawberries', 'Basil', 'Cane sugar', 'Soda']
      },
      note: {
        de: 'Erdbeere und Basilikum, lang aufgegossen. Unser Sommerdrink für die Plätze direkt am Wasser.',
        en: 'Strawberry and basil, lengthened with soda. Our summer drink for the seats right on the water.'
      }
    },
    {
      id: 'italian-stallion', name: 'Italian Stallion', house: true, hasNA: 'italian-stallion-na',
      base: 'vodka', also: [], strength: 2, texture: 'long', adventure: 1,
      occasion: ['main', 'celebration'], flags: [],
      profile: p(2, 4, 0, 0, 4, 2, 0, 0, 0, 2),
      glass: { de: 'Longdrinkglas', en: 'Highball' },
      ing: {
        de: ['Absolut Wodka', 'Aprikosenbrand', 'Maracuja', 'Ananas', 'Grenadine', 'Limette'],
        en: ['Absolut vodka', 'Apricot brandy', 'Passion fruit', 'Pineapple', 'Grenadine', 'Lime']
      },
      note: {
        de: 'Unser meistbestellter Fruchtdrink. Maracuja vorne, Aprikose hinten, Limette hält es zusammen.',
        en: 'Our most-ordered fruit drink. Passion fruit up front, apricot behind it, lime holding it together.'
      }
    },
    {
      // Zero-proof builds keep the parent's name — the "Zero proof" badge says
      // the rest, and the gate means the two can never appear side by side.
      id: 'italian-stallion-na', name: 'Italian Stallion', naOf: 'italian-stallion',
      base: 'none', also: [], strength: 0, texture: 'long', adventure: 1,
      occasion: ['main', 'celebration'], flags: [],
      profile: p(2, 4, 0, 0, 4, 0, 0, 0, 0, 2),
      glass: { de: 'Longdrinkglas', en: 'Highball' },
      ing: {
        de: ['Maracuja', 'Ananas', 'Grenadine', 'Limette'],
        en: ['Passion fruit', 'Pineapple', 'Grenadine', 'Lime']
      },
      note: {
        de: 'Derselbe Drink, nur ohne Alkohol — und ohne dass jemand am Tisch merkt, dass etwas fehlt.',
        en: 'The same drink without the alcohol — and nobody at the table notices anything is missing.'
      }
    },
    {
      id: 'la-rosa', name: 'La Rosa', house: true,
      base: 'cachaca', also: [], strength: 2, texture: 'long', adventure: 1,
      occasion: ['main', 'aperitif'], flags: [],
      profile: p(2, 3, 0, 0, 4, 2, 0, 0, 0, 3),
      glass: { de: 'Longdrinkglas', en: 'Highball' },
      ing: {
        de: ['Cachaça', 'Ananas', 'Zitrone', 'Grenadine', 'Soda'],
        en: ['Cachaça', 'Pineapple', 'Lemon', 'Grenadine', 'Soda']
      },
      note: {
        de: 'Rosa, lang, unkompliziert. Der Drink, den man bestellt, wenn man sich nicht entscheiden will.',
        en: 'Pink, long, uncomplicated. The one you order when you would rather not decide.'
      }
    },
    {
      id: 'lemon-drop-shot', name: 'Lemon Drop Shot',
      base: 'vodka', also: [], strength: 2, texture: 'shot', adventure: 0,
      occasion: ['shot', 'celebration'], flags: [],
      profile: p(4, 3, 0, 0, 1, 2, 0, 0, 0, 3),
      glass: { de: 'Shotglas', en: 'Shot glass' },
      ing: {
        de: ['Absolut Wodka', 'Zitrone', 'Rohrzucker'],
        en: ['Absolut vodka', 'Lemon', 'Cane sugar']
      },
      note: {
        de: 'Sauer, kalt, vorbei. Der Shot für Leute, die keine süßen Shots mögen.',
        en: 'Sour, cold, done. The shot for people who do not like sweet shots.'
      }
    },
    {
      id: 'london-mule', name: 'London Mule',
      base: 'gin', also: [], strength: 2, texture: 'long', adventure: 1,
      occasion: ['main', 'aperitif'], flags: [],
      profile: p(3, 2, 0, 2, 1, 2, 0, 0, 3, 4),
      glass: { de: 'Kupferbecher', en: 'Copper mug' },
      ing: {
        de: ['Tanqueray Gin', 'Limette', 'Spicy Ginger', 'Angostura'],
        en: ['Tanqueray gin', 'Lime', 'Spicy ginger beer', 'Angostura']
      },
      note: {
        de: 'Der Mule mit Wacholder statt Wodka. Ingwer und Gin schärfen sich gegenseitig.',
        en: 'The mule with juniper instead of vodka. Ginger and gin sharpen each other.'
      }
    },
    {
      id: 'manhattan', name: 'Manhattan',
      base: 'whiskey', also: [], strength: 3, texture: 'short', adventure: 1,
      occasion: ['nightcap', 'aperitif'], flags: [],
      profile: p(0, 2, 2, 3, 1, 4, 0, 0, 0, 0),
      glass: { de: 'Coupette', en: 'Coupe' },
      ing: {
        de: ['Bourbon', 'Roter Wermut', 'Angostura'],
        en: ['Bourbon', 'Sweet vermouth', 'Angostura']
      },
      note: {
        de: 'Gerührt, nie geschüttelt. Kein Eis im Glas, damit der letzte Schluck so schmeckt wie der erste.',
        en: 'Stirred, never shaken. No ice in the glass, so the last sip tastes like the first.'
      }
    },
    {
      id: 'maple-old-fashioned', name: 'Maple Old Fashioned', house: true,
      base: 'whiskey', also: [], strength: 3, texture: 'short', adventure: 1,
      occasion: ['nightcap', 'main'], flags: [],
      profile: p(0, 3, 1, 0, 0, 4, 0, 1, 0, 0),
      glass: { de: 'Tumbler auf großem Eis', en: 'Rocks glass, big ice' },
      ing: {
        de: ['Bourbon', 'Ahornsirup', 'Angostura'],
        en: ['Bourbon', 'Maple syrup', 'Angostura']
      },
      note: {
        de: 'Ahornsirup statt Zucker — runder, holziger, ein bisschen herbstlicher als das Original.',
        en: 'Maple instead of sugar — rounder, woodier, a little more autumnal than the original.'
      }
    },
    {
      id: 'margarita', name: 'Margarita',
      base: 'tequila', also: [], strength: 3, texture: 'short', adventure: 0,
      occasion: ['aperitif', 'main'], flags: [],
      profile: p(4, 2, 0, 0, 1, 3, 0, 0, 0, 3),
      glass: { de: 'Coupette, Salzrand', en: 'Coupe, salt rim' },
      ing: {
        de: ['Jose Cuervo Silver', 'Limette', 'Cointreau', 'Agavendicksaft'],
        en: ['Jose Cuervo Silver', 'Lime', 'Cointreau', 'Agave nectar']
      },
      note: {
        de: 'Der Maßstab für jede Bar. Limette frisch gepresst, Salzrand nur halb — dann hast du die Wahl.',
        en: 'The benchmark for any bar. Lime pressed fresh, salt on half the rim — so you get the choice.'
      }
    },
    {
      id: 'margarita-rojas', name: 'Margarita Rojas', house: true,
      base: 'mezcal', also: [], strength: 3, texture: 'short', adventure: 3,
      occasion: ['aperitif', 'main'], flags: [],
      profile: p(4, 2, 0, 0, 1, 3, 0, 4, 0, 3),
      glass: { de: 'Coupette, Salzrand', en: 'Coupe, salt rim' },
      ing: {
        de: ['Mezcal', 'Limette', 'Cointreau', 'Agavendicksaft'],
        en: ['Mezcal', 'Lime', 'Cointreau', 'Agave nectar']
      },
      note: {
        de: 'Margarita auf Mezcal. Der Rauch kommt erst nach der Säure — der spannendste Drink auf der Karte.',
        en: 'A Margarita on mezcal. The smoke arrives after the acidity — the most interesting drink on the card.'
      }
    },
    {
      id: 'mermaids-melody', name: 'Mermaid’s Melody', house: true,
      base: 'rum', also: [], strength: 2, texture: 'long', adventure: 2,
      occasion: ['celebration', 'main'], flags: [],
      profile: p(2, 4, 0, 0, 3, 2, 1, 0, 0, 3),
      glass: { de: 'Longdrinkglas', en: 'Highball' },
      ing: {
        de: ['Weißer Rum', 'Blue Curaçao', 'Kokossirup', 'Limette', 'Soda'],
        en: ['White rum', 'Blue curaçao', 'Coconut syrup', 'Lime', 'Soda']
      },
      note: {
        de: 'Ja, er ist blau. Kokos und Limette darunter, und am Wasser sitzend ergibt die Farbe plötzlich Sinn.',
        en: 'Yes, it is blue. Coconut and lime underneath, and sitting by the water the colour suddenly makes sense.'
      }
    },
    {
      id: 'mexico-mule', name: 'Mexico Mule',
      base: 'tequila', also: [], strength: 2, texture: 'long', adventure: 1,
      occasion: ['main', 'aperitif'], flags: [],
      profile: p(3, 2, 0, 0, 1, 2, 0, 0, 3, 4),
      glass: { de: 'Kupferbecher', en: 'Copper mug' },
      ing: {
        de: ['Don Julio Blanco', 'Limette', 'Spicy Ginger', 'Angostura'],
        en: ['Don Julio Blanco', 'Lime', 'Spicy ginger beer', 'Angostura']
      },
      note: {
        de: 'Agave trifft Ingwer. Von allen Mules der mit dem meisten Charakter.',
        en: 'Agave meets ginger. Of all the mules, the one with the most character.'
      }
    },
    {
      id: 'mikki', name: 'Mikki', house: true,
      base: 'tequila', also: [], strength: 3, texture: 'short', adventure: 3,
      occasion: ['nightcap', 'aperitif'], flags: ['nuts'],
      profile: p(0, 2, 1, 1, 0, 4, 0, 1, 0, 0),
      glass: { de: 'Tumbler auf großem Eis', en: 'Rocks glass, big ice' },
      ing: {
        de: ['Don Julio Reposado', 'Amaretto', 'Agavendicksaft', 'Orange Bitters'],
        en: ['Don Julio Reposado', 'Amaretto', 'Agave nectar', 'Orange bitters']
      },
      note: {
        de: 'Old Fashioned auf Agave. Klein, stark, kein Saft — für Gäste, die den Barkeeper testen wollen.',
        en: 'An Old Fashioned built on agave. Small, strong, no juice — for guests who want to test the bartender.'
      }
    },
    {
      id: 'mint-julep', name: 'Mint Julep',
      base: 'whiskey', also: [], strength: 3, texture: 'long', adventure: 2,
      occasion: ['main'], flags: [],
      profile: p(0, 2, 0, 3, 0, 4, 0, 0, 0, 3),
      glass: { de: 'Becher auf Crushed Ice', en: 'Julep cup, crushed ice' },
      ing: {
        de: ['Bourbon', 'Frische Minze', 'Rohrzucker', 'Angostura'],
        en: ['Bourbon', 'Fresh mint', 'Cane sugar', 'Angostura']
      },
      note: {
        de: 'Viel Bourbon, viel Minze, viel Crushed Ice. Trinkt sich leichter als er ist — Vorsicht.',
        en: 'A lot of bourbon, a lot of mint, a lot of crushed ice. Drinks easier than it is — careful.'
      }
    },
    {
      id: 'mojito', name: 'Mojito',
      base: 'rum', also: [], strength: 2, texture: 'long', adventure: 0,
      occasion: ['main', 'aperitif'], flags: [],
      profile: p(3, 2, 0, 3, 1, 2, 0, 0, 0, 4),
      glass: { de: 'Longdrinkglas', en: 'Highball' },
      ing: {
        de: ['Weißer Rum', 'Limette', 'Frische Minze', 'Rohrzucker', 'Soda'],
        en: ['White rum', 'Lime', 'Fresh mint', 'Cane sugar', 'Soda']
      },
      note: {
        de: 'Minze wird gedrückt, nicht zerschlagen — sonst wird er bitter. Der Klassiker für heiße Abende.',
        en: 'The mint gets pressed, not pulverised — otherwise it turns bitter. The classic for warm evenings.'
      }
    },
    {
      id: 'moscow-mule', name: 'Moscow Mule',
      base: 'vodka', also: [], strength: 2, texture: 'long', adventure: 0,
      occasion: ['main', 'aperitif'], flags: [],
      profile: p(3, 2, 0, 0, 1, 2, 0, 0, 3, 4),
      glass: { de: 'Kupferbecher', en: 'Copper mug' },
      ing: {
        de: ['Absolut Wodka', 'Limette', 'Spicy Ginger'],
        en: ['Absolut vodka', 'Lime', 'Spicy ginger beer']
      },
      note: {
        de: 'Der zuverlässigste Longdrink der Welt. Im Kupferbecher, weil er dadurch tatsächlich kälter bleibt.',
        en: 'The most reliable highball in the world. In copper, because it genuinely does stay colder.'
      }
    },
    {
      id: 'naughty-or-nice', name: 'Naughty or Nice', house: true,
      base: 'gin', also: ['aperitivo'], strength: 2, texture: 'short', adventure: 2,
      occasion: ['aperitif', 'main'], flags: [],
      profile: p(3, 2, 3, 2, 2, 2, 0, 0, 0, 2),
      glass: { de: 'Coupette', en: 'Coupe' },
      ing: {
        de: ['Tanqueray Gin', 'Campari', 'Zitrone', 'Rohrzucker', 'Frische Trauben'],
        en: ['Tanqueray gin', 'Campari', 'Lemon', 'Cane sugar', 'Fresh grapes']
      },
      note: {
        de: 'Bitter und Frucht gleichzeitig. Frische Trauben nehmen dem Campari die Kanten, ohne ihn zu zähmen.',
        en: 'Bitter and fruit at once. Fresh grapes take the edges off the Campari without taming it.'
      }
    },
    {
      id: 'negroni', name: 'Negroni',
      base: 'gin', also: ['aperitivo'], strength: 3, texture: 'short', adventure: 1,
      occasion: ['aperitif', 'nightcap'], flags: [],
      profile: p(0, 2, 4, 3, 1, 4, 0, 0, 0, 0),
      glass: { de: 'Tumbler auf großem Eis', en: 'Rocks glass, big ice' },
      ing: {
        de: ['Tanqueray Gin', 'Campari', 'Roter Wermut'],
        en: ['Tanqueray gin', 'Campari', 'Sweet vermouth']
      },
      note: {
        de: 'Drei gleiche Teile, seit über hundert Jahren unverändert. Wenn du Bitter magst, fängst du hier an.',
        en: 'Three equal parts, unchanged for over a century. If you like bitter, you start here.'
      }
    },
    {
      id: 'negroni-sbagliato', name: 'Negroni Sbagliato',
      base: 'aperitivo', also: [], strength: 1, texture: 'sparkling', adventure: 1,
      occasion: ['aperitif', 'celebration'], flags: [],
      profile: p(1, 2, 3, 2, 1, 1, 0, 0, 0, 3),
      glass: { de: 'Weinglas', en: 'Wine glass' },
      ing: {
        de: ['Campari', 'Roter Wermut', 'Prosecco'],
        en: ['Campari', 'Sweet vermouth', 'Prosecco']
      },
      note: {
        de: '„Sbagliato" heißt verwechselt — jemand griff zum Prosecco statt zum Gin. Der beste Fehler der Barhistorie.',
        en: '"Sbagliato" means mistaken — someone reached for prosecco instead of gin. The best error in bar history.'
      }
    },
    {
      id: 'old-fashioned', name: 'Old Fashioned',
      base: 'whiskey', also: [], strength: 3, texture: 'short', adventure: 0,
      occasion: ['nightcap', 'aperitif'], flags: [],
      profile: p(0, 2, 2, 0, 0, 4, 0, 1, 0, 0),
      glass: { de: 'Tumbler auf großem Eis', en: 'Rocks glass, big ice' },
      ing: {
        de: ['Bourbon', 'Rohrzucker', 'Angostura'],
        en: ['Bourbon', 'Cane sugar', 'Angostura']
      },
      note: {
        de: 'Der älteste Cocktail überhaupt: Spirituose, Zucker, Bitter, Eis. Mehr braucht es nie gebraucht.',
        en: 'The oldest cocktail there is: spirit, sugar, bitters, ice. It never needed anything else.'
      }
    },
    {
      id: 'paloma', name: 'Paloma',
      base: 'tequila', also: [], strength: 2, texture: 'long', adventure: 1,
      occasion: ['aperitif', 'main'], flags: [],
      profile: p(3, 2, 2, 0, 3, 2, 0, 0, 0, 4),
      glass: { de: 'Longdrinkglas', en: 'Highball' },
      ing: {
        de: ['Don Julio Blanco', 'Grapefruit', 'Limette', 'Agavendicksaft', 'Soda'],
        en: ['Don Julio Blanco', 'Grapefruit', 'Lime', 'Agave nectar', 'Soda']
      },
      note: {
        de: 'In Mexiko trinkt man das, nicht Margarita. Grapefruit macht ihn bitter genug, um lange zu funktionieren.',
        en: 'In Mexico this is what people actually drink, not Margaritas. Grapefruit keeps it bitter enough to last.'
      }
    },
    {
      id: 'paper-plane', name: 'Paper Plane',
      base: 'whiskey', also: ['aperitivo'], strength: 3, texture: 'short', adventure: 2,
      occasion: ['aperitif', 'main'], flags: [],
      profile: p(3, 2, 3, 3, 2, 3, 0, 0, 0, 2),
      glass: { de: 'Coupette', en: 'Coupe' },
      ing: {
        de: ['Bourbon', 'Averna Amaro', 'Aperol', 'Zitrone'],
        en: ['Bourbon', 'Averna amaro', 'Aperol', 'Lemon']
      },
      note: {
        de: 'Vier gleiche Teile, moderner Klassiker. Bitter, sauer und süß halten sich exakt die Waage.',
        en: 'Four equal parts, a modern classic. Bitter, sour and sweet held in exact balance.'
      }
    },
    {
      id: 'pisco-sour', name: 'Pisco Sour',
      base: 'pisco', also: [], strength: 3, texture: 'frothy', adventure: 1,
      occasion: ['aperitif', 'main'], flags: ['egg'],
      profile: p(4, 2, 0, 0, 1, 3, 2, 0, 0, 3),
      glass: { de: 'Coupette', en: 'Coupe' },
      ing: {
        de: ['Pisco', 'Limette', 'Rohrzucker', 'Eiweiß', 'Angostura'],
        en: ['Pisco', 'Lime', 'Cane sugar', 'Egg white', 'Angostura']
      },
      note: {
        de: 'Trocken geschüttelt, dann auf Eis. Die Angostura kommt auf den Schaum, nicht hinein.',
        en: 'Dry-shaken, then shaken on ice. The Angostura goes on the foam, not into it.'
      }
    },
    {
      id: 'pornstar-martini', name: 'Pornstar Martini', hasNA: 'pornstar-martini-na',
      base: 'vodka', also: [], strength: 2, texture: 'frothy', adventure: 0,
      occasion: ['celebration', 'main'], flags: [],
      profile: p(3, 4, 0, 0, 4, 2, 2, 0, 0, 2),
      glass: { de: 'Coupette, Prosecco separat', en: 'Coupe, prosecco on the side' },
      ing: {
        de: ['Absolut Wodka', 'Galliano Vanille', 'Maracuja', 'Zitrone', 'Prosecco separat'],
        en: ['Absolut vodka', 'Galliano vanilla', 'Passion fruit', 'Lemon', 'Prosecco on the side']
      },
      note: {
        de: 'Der Prosecco kommt im eigenen Glas daneben. Abwechselnd trinken — dafür ist er gebaut.',
        en: 'The prosecco comes alongside in its own glass. Alternate between them — that is the point.'
      }
    },
    {
      id: 'pornstar-martini-na', name: 'Pornstar Martini', naOf: 'pornstar-martini',
      base: 'none', also: [], strength: 0, texture: 'frothy', adventure: 0,
      occasion: ['celebration', 'main'], flags: [],
      profile: p(3, 4, 0, 0, 4, 0, 2, 0, 0, 2),
      glass: { de: 'Coupette', en: 'Coupe' },
      ing: {
        de: ['Maracuja', 'Zitrone', 'Vanillesirup'],
        en: ['Passion fruit', 'Lemon', 'Vanilla syrup']
      },
      note: {
        de: 'Vanillesirup übernimmt die Rolle des Galliano. Gleiche Schaumkrone, gleiche Maracuja.',
        en: 'Vanilla syrup takes over from the Galliano. Same head of foam, same passion fruit.'
      }
    },
    {
      id: 'raspberry-mule', name: 'Raspberry Mule',
      base: 'vodka', also: [], strength: 2, texture: 'long', adventure: 1,
      occasion: ['main', 'aperitif'], flags: [],
      profile: p(3, 2, 0, 0, 3, 2, 0, 0, 3, 4),
      glass: { de: 'Kupferbecher', en: 'Copper mug' },
      ing: {
        de: ['Absolut Wodka', 'Frische Himbeeren', 'Limette', 'Spicy Ginger'],
        en: ['Absolut vodka', 'Fresh raspberries', 'Lime', 'Spicy ginger beer']
      },
      note: {
        de: 'Frische Himbeeren, keine Sirupfarbe. Ingwer und Beere sind ein besseres Paar als man denkt.',
        en: 'Fresh raspberries, not syrup colouring. Ginger and berry make a better pair than you would expect.'
      }
    },
    {
      id: 'ricky-ricky', name: 'Ricky Ricky', house: true,
      base: 'gin', also: [], strength: 3, texture: 'short', adventure: 2,
      occasion: ['aperitif', 'main'], flags: [],
      profile: p(3, 2, 0, 3, 1, 3, 0, 0, 0, 4),
      glass: { de: 'Tumbler auf Eis', en: 'Rocks glass' },
      ing: {
        de: ['Tanqueray Gin', 'Limette', 'Frische Minze', 'Rohrzucker', 'Spritzer Soda'],
        en: ['Tanqueray gin', 'Lime', 'Fresh mint', 'Cane sugar', 'Splash of soda']
      },
      note: {
        de: 'Unser Gin Rickey mit Minze — kurz gebaut statt lang. Trocken, kalt, sehr aufgeräumt.',
        en: 'Our Gin Rickey with mint — built short instead of long. Dry, cold, very clean.'
      }
    },
    {
      id: 'singapore-sling', name: 'Singapore Sling', hasNA: 'singapore-sling-na',
      base: 'gin', also: [], strength: 2, texture: 'long', adventure: 2,
      occasion: ['main', 'celebration'], flags: [],
      profile: p(2, 3, 1, 2, 4, 2, 0, 0, 0, 2),
      glass: { de: 'Longdrinkglas', en: 'Highball' },
      ing: {
        de: ['Tanqueray Gin', 'Kirschlikör', 'Bénédictine', 'Cointreau', 'Ananas', 'Grenadine', 'Angostura'],
        en: ['Tanqueray gin', 'Cherry liqueur', 'Bénédictine', 'Cointreau', 'Pineapple', 'Grenadine', 'Angostura']
      },
      note: {
        de: 'Acht Zutaten, alle nötig. Wir setzen ihn auf Premix an, damit er jedes Mal identisch schmeckt.',
        en: 'Eight ingredients, all of them necessary. We batch the base so it tastes identical every time.'
      }
    },
    {
      id: 'singapore-sling-na', name: 'Singapore Sling', naOf: 'singapore-sling',
      base: 'none', also: [], strength: 0, texture: 'long', adventure: 2,
      occasion: ['main', 'celebration'], flags: [],
      profile: p(2, 3, 1, 2, 4, 0, 0, 0, 0, 2),
      glass: { de: 'Longdrinkglas', en: 'Highball' },
      ing: {
        de: ['Tanqueray 0,0', 'Kirschsirup', 'Chai-Tee-Sirup', 'Ananas', 'Orange', 'Limette', 'Grenadine'],
        en: ['Tanqueray 0.0', 'Cherry syrup', 'Chai tea syrup', 'Pineapple', 'Orange', 'Lime', 'Grenadine']
      },
      note: {
        de: 'Chai-Tee-Sirup ersetzt den Bénédictine — dieselbe Würze, kein Alkohol. Unsere aufwendigste alkoholfreie Rezeptur.',
        en: 'Chai tea syrup stands in for the Bénédictine — same spice, no alcohol. Our most involved zero-proof build.'
      }
    },
    {
      id: 'take-it-easy', name: 'Take-It-Easy', house: true,
      base: 'tequila', also: ['aperitivo'], strength: 3, texture: 'short', adventure: 3,
      occasion: ['aperitif', 'main'], flags: ['nuts'],
      profile: p(3, 2, 2, 0, 3, 3, 0, 0, 0, 3),
      glass: { de: 'Coupette', en: 'Coupe' },
      ing: {
        de: ['Don Julio Blanco', 'Aperol', 'Limette', 'Mandelsirup'],
        en: ['Don Julio Blanco', 'Aperol', 'Lime', 'Almond syrup']
      },
      note: {
        de: 'Tequila, Bitterorange und Mandel. Klingt nach zu viel, ist aber der eleganteste Drink im Haus.',
        en: 'Tequila, bitter orange and almond. Sounds like too much, is quietly the most elegant thing we make.'
      }
    },
    {
      id: 'whisky-sour', name: 'Whisky Sour',
      base: 'whiskey', also: [], strength: 3, texture: 'frothy', adventure: 0,
      occasion: ['main', 'nightcap'], flags: ['egg'],
      profile: p(4, 2, 0, 0, 1, 3, 2, 0, 0, 2),
      glass: { de: 'Tumbler', en: 'Rocks glass' },
      ing: {
        de: ['Bourbon', 'Zitrone', 'Rohrzucker', 'Eiweiß', 'Angostura'],
        en: ['Bourbon', 'Lemon', 'Cane sugar', 'Egg white', 'Angostura']
      },
      note: {
        de: 'Der Sour, an dem alle anderen gemessen werden. Eiweiß macht ihn seidig, nicht süß.',
        en: 'The sour every other sour is measured against. Egg white makes it silky, not sweet.'
      }
    }
  ];

  var api = { COCKTAILS: COCKTAILS, BASES: BASES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
