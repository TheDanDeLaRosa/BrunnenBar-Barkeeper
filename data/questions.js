/*
 * BrunnenBar — Question flow + all interface copy
 * =========================================================================
 * Every answer value here is a literal value from data/cocktails.json, not
 * a translation of one. "Mittendrin" is the string in the export; the
 * strength numbers are the export's own 0 to 5 scale; the flavour values
 * are its flavour_tags verbatim. That means no mapping layer can drift.
 *
 * Drink copy (taglines, bartender notes, ingredients) is the bar's own
 * German and is never translated. The interface chrome around it is
 * bilingual for guests who need it.
 *
 * `skipIf` receives the answers so far and returns true to hide a question.
 * `optional` questions offer a "no preference" path.
 * =========================================================================
 */
(function (root) {
  'use strict';

  var QUESTIONS = [
    {
      id: 'moment',
      type: 'single',
      /* The export's `moment` field says WHEN in the evening a drink fits.
       * Asking a guest to locate themselves on that timeline reads like a
       * survey, so the question asks what the drink has to DO instead. Same
       * four values, framed as a job rather than a position. */
      title: { de: 'Was soll der Drink können?', en: 'What should the drink do?' },
      sub: {
        de: 'Ein Drink macht Appetit, der nächste macht Schluss. Sag uns, welcher heute dran ist.',
        en: 'One drink opens an evening, another closes it. Tell us which one you need.'
      },
      options: [
        { value: 'Auftakt', label: { de: 'Appetit machen', en: 'Whet the appetite' }, hint: { de: 'Wir fangen gerade an', en: 'We are just getting started' } },
        { value: 'Mittendrin', label: { de: 'Den Abend tragen', en: 'Carry the evening' }, hint: { de: 'Der Drink für die nächste Stunde', en: 'The drink for the next hour' } },
        { value: 'Später Abend', label: { de: 'Den Abend abrunden', en: 'Round the evening off' }, hint: { de: 'Danach gehen wir', en: 'We head off after this' } },
        { value: 'shots', label: { de: 'Eine Runde Shots', en: 'A round of shots' }, hint: { de: 'Für den ganzen Tisch', en: 'For the whole table' } }
      ]
    },
    {
      id: 'strength',
      type: 'scale',
      title: { de: 'Wie kräftig darf er sein?', en: 'How strong should it be?' },
      sub: {
        de: 'Ehrliche Antwort. Wir bauen lieber passend als beeindruckend.',
        en: 'Answer honestly. We would rather build it right than build it impressive.'
      },
      // Values and labels are the export's own strength scale.
      options: [
        { value: '0', label: { de: 'Alkoholfrei', en: 'Zero proof' } },
        { value: '1', label: { de: 'Leicht', en: 'Light' } },
        { value: '2', label: { de: 'Mild', en: 'Mild' } },
        { value: '3', label: { de: 'Mittel', en: 'Medium' } },
        { value: '4', label: { de: 'Kräftig', en: 'Strong' } },
        { value: '5', label: { de: 'Stark', en: 'Very strong' } }
      ]
    },
    {
      id: 'spirit',
      type: 'multi',
      optional: true,
      skipIf: function (a) { return a.strength === '0'; },
      title: { de: 'Gibt es was, das du gern trinkst?', en: 'Anything you like drinking?' },
      sub: {
        de: 'Mehrfachauswahl möglich. Nichts auszuwählen ist auch eine Antwort, dann entscheiden wir.',
        en: 'Pick as many as you like. Picking none is also an answer, then we decide.'
      },
      options: [
        { value: 'gin', label: { de: 'Gin', en: 'Gin' } },
        { value: 'vodka', label: { de: 'Wodka', en: 'Vodka' } },
        { value: 'rum', label: { de: 'Rum', en: 'Rum' } },
        { value: 'cachaca', label: { de: 'Cachaça', en: 'Cachaça' } },
        { value: 'tequila', label: { de: 'Tequila', en: 'Tequila' } },
        { value: 'mezcal', label: { de: 'Mezcal', en: 'Mezcal' } },
        { value: 'whiskey', label: { de: 'Whiskey', en: 'Whiskey' } },
        { value: 'pisco', label: { de: 'Pisco', en: 'Pisco' } },
        { value: 'aperitivo', label: { de: 'Aperitivo & Wermut', en: 'Aperitivo & vermouth' } },
        { value: 'likoer', label: { de: 'Likör', en: 'Liqueur' } },
        { value: 'sekt', label: { de: 'Prosecco', en: 'Prosecco' } }
      ]
    },
    {
      id: 'avoid',
      type: 'multi',
      optional: true,
      skipIf: function (a) { return a.strength === '0'; },
      title: { de: 'Und was soll gar nicht ins Glas?', en: 'And what should stay out of the glass?' },
      sub: {
        de: 'Was du hier auswählst, kommt garantiert nicht vor.',
        en: 'Anything you pick here will not turn up.'
      },
      options: [
        { value: 'gin', label: { de: 'Kein Gin', en: 'No gin' } },
        { value: 'vodka', label: { de: 'Kein Wodka', en: 'No vodka' } },
        { value: 'rum', label: { de: 'Kein Rum', en: 'No rum' } },
        { value: 'cachaca', label: { de: 'Kein Cachaça', en: 'No cachaça' } },
        { value: 'tequila', label: { de: 'Kein Tequila', en: 'No tequila' } },
        { value: 'mezcal', label: { de: 'Kein Mezcal', en: 'No mezcal' } },
        { value: 'whiskey', label: { de: 'Kein Whiskey', en: 'No whiskey' } },
        { value: 'aperitivo', label: { de: 'Nichts Bitteres', en: 'Nothing bitter' } },
        { value: 'likoer', label: { de: 'Keinen Likör', en: 'No liqueur' } }
      ]
    },
    {
      id: 'flavours',
      type: 'multi',
      title: { de: 'Wonach soll er schmecken?', en: 'What should it taste like?' },
      sub: {
        de: 'Such dir aus, worauf du Lust hast. Zwei oder drei reichen völlig. Oder du überlässt es uns.',
        en: 'Pick whatever appeals. Two or three is plenty. Or leave it to us.'
      },
      // Values are flavour_tags from the export, unchanged.
      options: [
        { value: 'sauer/zitrus', label: { de: 'Sauer & Zitrus', en: 'Sour & citrus' }, hint: { de: 'Limette, Zitrone, wach', en: 'Lime, lemon, wide awake' } },
        { value: 'fruchtig', label: { de: 'Fruchtig', en: 'Fruity' }, hint: { de: 'Maracuja, Beere, Ananas', en: 'Passion fruit, berry, pineapple' } },
        { value: 'bitter', label: { de: 'Bitter', en: 'Bitter' }, hint: { de: 'Campari, Aperol, Wermut', en: 'Campari, Aperol, vermouth' } },
        { value: 'kräuterig/frisch', label: { de: 'Kräuterig & frisch', en: 'Herbal & fresh' }, hint: { de: 'Minze, Basilikum, Wacholder', en: 'Mint, basil, juniper' } },
        { value: 'süß', label: { de: 'Süß', en: 'Sweet' }, hint: { de: 'Rund und weich', en: 'Round and soft' } },
        { value: 'cremig', label: { de: 'Cremig', en: 'Creamy' }, hint: { de: 'Mit Schaum oder Sahne', en: 'With foam or cream' } },
        { value: 'prickelnd', label: { de: 'Prickelnd', en: 'Sparkling' }, hint: { de: 'Soda, Tonic, Prosecco', en: 'Soda, tonic, prosecco' } },
        { value: 'kaffee', label: { de: 'Kaffee', en: 'Coffee' }, hint: { de: 'Espresso im Glas', en: 'Espresso in the glass' } },
        { value: 'rauchig', label: { de: 'Rauchig', en: 'Smoky' }, hint: { de: 'Mezcal, Talisker', en: 'Mezcal, Talisker' } },
        // `exclusive` clears every other pick, and vice versa. The value is
        // BBEngine.NO_PREFERENCE, which the engine reads as "free rein"
        // rather than as a flavour tag to match.
        {
          value: 'barkeeper', exclusive: true, wide: true,
          label: { de: 'Barkeeper’s Choice', en: 'Bartender’s choice' },
          hint: { de: 'Überrasch mich, ihr kennt die Karte besser', en: 'Surprise me, you know the card better' }
        }
      ]
    },
    {
      id: 'serve',
      type: 'single',
      optional: true,
      title: { de: 'Wie soll er ankommen?', en: 'How should it turn up?' },
      sub: {
        de: 'Die Form entscheidet mit, wie lange ein Drink hält.',
        en: 'The shape of a drink decides how long it lasts.'
      },
      options: [
        { value: 'lang', label: { de: 'Lang & auf Eis', en: 'Long & over ice' }, hint: { de: 'Hält den ganzen Abend', en: 'Lasts the evening' } },
        { value: 'kurz', label: { de: 'Kurz & gerührt', en: 'Short & stirred' }, hint: { de: 'Konzentriert, kein Saft', en: 'Concentrated, no juice' } },
        { value: 'schaum', label: { de: 'Geschüttelt & seidig', en: 'Shaken & silky' }, hint: { de: 'Sour, mit Schaumkrone', en: 'A sour, with a head of foam' } },
        { value: 'spritzig', label: { de: 'Spritz', en: 'Spritz' }, hint: { de: 'Im Weinglas, mit Perlage', en: 'Wine glass, with bubbles' } }
        // Frozen and Hot are deliberately not offered as choices. Those drinks
        // are still on the menu and can still be recommended, there is just no
        // way to ask for them by name here.
      ]
    },
    {
      id: 'allergens',
      type: 'multi',
      optional: true,
      title: { de: 'Sollen wir etwas weglassen?', en: 'Anything we should leave out?' },
      sub: {
        de: 'Wichtig. Sag uns Allergien bitte immer auch direkt am Tresen.',
        en: 'Important. Please also tell us about allergies in person at the bar.'
      },
      // Values are the export's allergen strings.
      options: [
        { value: 'Ei', label: { de: 'Kein Eiweiß', en: 'No egg white' } },
        { value: 'Milch', label: { de: 'Keine Milchprodukte', en: 'No dairy' } },
        { value: 'Nüsse', label: { de: 'Keine Nüsse', en: 'No nuts' } }
      ]
    }
  ];

  // ---------------------------------------------------------------- copy ---
  var UI = {
    de: {
      title: 'BrunnenBar',
      lede: 'Lass uns kurz gemeinsam überlegen, worauf du heute Lust hast. Ein paar Fragen und wir haben deinen Drink.',
      start: 'Los geht’s',
      fullCard: 'Zur ganzen Cocktailkarte',
      back: 'Zurück',
      next: 'Weiter',
      skip: 'Egal, weiter',
      step: 'Frage {n} von {total}',
      results: 'Unsere Empfehlungen',
      resultsSub: '',
      topPick: 'Unser Favorit',
      alsoGood: 'Passt ebenfalls',
      // Each runner-up is labelled by how it differs from the favourite.
      contrast: {
        ingredient: 'Was mit {x}',
        stronger: 'Was Kräftigeres',
        lighter: 'Was Leichteres',
        longer: 'Was Längeres',
        shorter: 'Was Kürzeres',
        sparkling: 'Was mit Perlage',
        shaken: 'Was Geschütteltes',
        flavour: 'Was {x}'
      },
      // Written out by hand so every comparative is correct German.
      flavourCompare: {
        'sauer/zitrus': 'mit mehr Säure', 'fruchtig': 'Fruchtigeres', 'bitter': 'Bittereres',
        'kräuterig/frisch': 'Frischeres', 'süß': 'Süßeres', 'cremig': 'Cremigeres',
        'prickelnd': 'mit Perlage', 'kaffee': 'mit Kaffee', 'rauchig': 'Rauchigeres',
        'scharf': 'Schärferes', 'salzig': 'Salzigeres', 'überraschend': 'Überraschenderes',
        'kraeftig': 'Kräftigeres', 'holzig': 'Holzigeres', 'bitter-suess': 'Bittersüßeres'
      },
      match: '{n}% Übereinstimmung',
      house: 'Signature',
      zeroProof: 'Alkoholfrei',
      bestseller: 'Bestseller',
      notOnCard: 'Nicht auf der Karte',
      restart: 'Nochmal von vorn',
      moreOptions: 'Mehr Vorschläge',
      ingredients: 'Drin ist',
      served: 'Serviert im',
      priceLabel: 'Preis',
      empty: 'Bei dieser Kombination wird es eng.',
      emptySub: 'Kein Problem. Komm an den Tresen, dann bauen wir dir was Eigenes.',
      loosened: 'Wir haben eine Vorgabe gelockert, um dir trotzdem etwas anbieten zu können.',
      footer: 'Alle Drinks werden frisch gebaut. Allergien bitte immer direkt beim Team melden.',
      reasons: {
        moment: 'passt zu diesem Moment im Abend',
        strength_exact: 'genau die Stärke, die du wolltest',
        strength_near: 'liegt nah an deiner Wunschstärke',
        zero: 'komplett alkoholfrei gebaut',
        spirit: 'basiert auf {x}',
        flavour: 'schmeckt {x}',
        serve: 'kommt so ins Glas, wie du es wolltest',
        safe: 'ohne alles, was du ausgeschlossen hast'
      },
      spiritNames: {
        gin: 'Gin', vodka: 'Wodka', rum: 'Rum', cachaca: 'Cachaça', tequila: 'Tequila',
        mezcal: 'Mezcal', whiskey: 'Whiskey', pisco: 'Pisco', aperitivo: 'Aperitivo',
        likoer: 'Likör', sekt: 'Prosecco', other: 'Bartender’s Choice', none: 'alkoholfreien Zutaten'
      },
      momentNames: {
        'Auftakt': 'Auftakt', 'Mittendrin': 'Mittendrin', 'Später Abend': 'später Abend'
      },
      // Read back as "schmeckt ...", so these have to work as adverbs.
      flavourNames: {
        'sauer/zitrus': 'sauer und frisch', 'fruchtig': 'fruchtig', 'bitter': 'bitter',
        'kräuterig/frisch': 'kräuterig', 'süß': 'süß', 'cremig': 'cremig',
        'prickelnd': 'prickelnd', 'kaffee': 'nach Kaffee', 'rauchig': 'rauchig',
        'scharf': 'scharf', 'salzig': 'salzig', 'überraschend': 'überraschend',
        // Ad-hoc tags that arrived on one drink in export v3. See the README.
        'kraeftig': 'kräftig', 'holzig': 'holzig', 'bitter-suess': 'bittersüß'
      }
    },
    en: {
      title: 'BrunnenBar',
      lede: 'Let’s work out what you feel like tonight. A few quick questions and we’ll find your drink.',
      start: 'Start',
      fullCard: 'See the full cocktail list',
      back: 'Back',
      next: 'Next',
      skip: 'No preference',
      step: 'Question {n} of {total}',
      results: 'Our recommendations',
      resultsSub: 'Drink descriptions are in German, as they are on our card.',
      topPick: 'Our pick',
      alsoGood: 'Also a good fit',
      contrast: {
        ingredient: 'Something with {x}',
        stronger: 'Something stronger',
        lighter: 'Something lighter',
        longer: 'Something longer',
        shorter: 'Something shorter',
        sparkling: 'Something with bubbles',
        shaken: 'Something shaken',
        flavour: 'Something {x}'
      },
      flavourCompare: {
        'sauer/zitrus': 'with more acidity', 'fruchtig': 'fruitier', 'bitter': 'more bitter',
        'kräuterig/frisch': 'fresher', 'süß': 'sweeter', 'cremig': 'creamier',
        'prickelnd': 'with bubbles', 'kaffee': 'with coffee', 'rauchig': 'smokier',
        'scharf': 'spicier', 'salzig': 'saltier', 'überraschend': 'more surprising',
        'kraeftig': 'bolder', 'holzig': 'woodier', 'bitter-suess': 'more bittersweet'
      },
      match: '{n}% match',
      house: 'Signature',
      zeroProof: 'Zero proof',
      bestseller: 'Bestseller',
      notOnCard: 'Off-menu',
      restart: 'Start over',
      moreOptions: 'More suggestions',
      ingredients: 'What’s in it',
      served: 'Served in',
      priceLabel: 'Price',
      empty: 'That combination gets tight.',
      emptySub: 'Not a problem. Come to the bar and we’ll build you something off-menu.',
      loosened: 'We relaxed one preference so we could still offer you something.',
      footer: 'Every drink is built to order. Please always tell the team about allergies in person.',
      reasons: {
        moment: 'fits this point in the evening',
        strength_exact: 'exactly the strength you asked for',
        strength_near: 'close to the strength you asked for',
        zero: 'built completely alcohol-free',
        spirit: 'built on {x}',
        flavour: 'tastes {x}',
        serve: 'arrives the way you wanted it',
        safe: 'free of everything you ruled out'
      },
      spiritNames: {
        gin: 'gin', vodka: 'vodka', rum: 'rum', cachaca: 'cachaça', tequila: 'tequila',
        mezcal: 'mezcal', whiskey: 'whiskey', pisco: 'pisco', aperitivo: 'aperitivo',
        likoer: 'liqueur', sekt: 'prosecco', other: 'bartender’s choice', none: 'alcohol-free ingredients'
      },
      momentNames: {
        'Auftakt': 'the start of the evening', 'Mittendrin': 'mid-evening', 'Später Abend': 'late'
      },
      // Read back as "tastes ...", so these have to work as adverbs.
      flavourNames: {
        'sauer/zitrus': 'sour and fresh', 'fruchtig': 'fruity', 'bitter': 'bitter',
        'kräuterig/frisch': 'herbal', 'süß': 'sweet', 'cremig': 'creamy',
        'prickelnd': 'sparkling', 'kaffee': 'of coffee', 'rauchig': 'smoky',
        'scharf': 'spicy', 'salzig': 'salty', 'überraschend': 'surprising',
        'kraeftig': 'bold', 'holzig': 'woody', 'bitter-suess': 'bittersweet'
      }
    }
  };

  var api = { QUESTIONS: QUESTIONS, UI: UI };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBQuestions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
