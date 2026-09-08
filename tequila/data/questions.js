/*
 * BrunnenBar Tequila — question flow and all interface copy
 * =========================================================================
 * Every answer value here is something the data can actually answer.
 *
 *   agave      expressions and mezcal, read off the bottle name by
 *              assets/agave.js
 *   serve      a pour or something built, read off the ingredient list
 *   strength   the Menu API's own strength word, folded onto three stops
 *   character  the cocktail card's own flavour vocabulary, derived from
 *              ingredients until the Menu API carries flavour_tags
 *   budget     derived from what the card actually costs, never typed here
 *   exclude    allergens as the card spells them, plus smoke
 *
 * There is no question about region, still, additive policy, age in months
 * or NOM number, because the source carries none of that. See
 * docs/menu-api-felder-tequila.md, which asks for it.
 *
 * A question may carry `options` or `optionsFrom(items, lang)`, and
 * `skipIf(answers, items)` hides it. Guest copy follows the house voice, so
 * no hyphens, no dashes, no colons, no semicolons and no lists.
 * =========================================================================
 */
(function (root) {
  'use strict';

  /* Every expression assets/agave.js can read off a bottle name, with the
   * copy that explains it. The question offers the ones the card carries
   * today and nothing else, so it can never invite a guest to ask for a
   * bottle the bar does not have. */
  var AGAVE_CHOICES = [
    {
      value: 'blanco',
      label: { de: 'Blanco', en: 'Blanco' },
      hint: { de: 'Ungereift und pfeffrig, die Agave ganz vorn', en: 'Unaged and peppery, the agave right up front' }
    },
    {
      value: 'joven',
      label: { de: 'Joven', en: 'Joven' },
      hint: { de: 'Ungereift, meist beim Mezcal so genannt', en: 'Unaged, the usual word for a mezcal' }
    },
    {
      value: 'reposado',
      label: { de: 'Reposado', en: 'Reposado' },
      hint: { de: 'Ein paar Monate im Fass, weicher und warm', en: 'A few months in oak, softer and warm' }
    },
    {
      value: 'rosado',
      label: { de: 'Rosado', en: 'Rosado' },
      hint: { de: 'Im Weinfass nachgereift, beerig und weich', en: 'Finished in wine casks, berried and soft' }
    },
    {
      value: 'anejo',
      label: { de: 'Añejo', en: 'Añejo' },
      hint: { de: 'Über ein Jahr im Fass, holzig fast wie ein Whiskey', en: 'Over a year in oak, woody almost like a whiskey' }
    },
    {
      value: 'extra-anejo',
      label: { de: 'Extra Añejo', en: 'Extra Añejo' },
      hint: { de: 'Drei Jahre und mehr, tief und ruhig', en: 'Three years and more, deep and quiet' }
    },
    {
      value: 'cristalino',
      label: { de: 'Cristalino', en: 'Cristalino' },
      hint: { de: 'Gereift und dann klar gefiltert, weich ohne Farbe', en: 'Aged then filtered clear, soft with no colour' }
    },
    {
      value: 'mezcal',
      label: { de: 'Mezcal', en: 'Mezcal' },
      hint: { de: 'Agave über Feuer geröstet, deutlich rauchig', en: 'Agave roasted over fire, properly smoky' }
    }
  ];

  /* Every flavour the app has a word for, in the order a guest reads them.
   * The first block is the cocktail card's own vocabulary, the second is what
   * the neat pours carry. One list, because a guest asking for citrus should
   * match the Margarita and the Blanco alike. */
  var CHARACTER_CHOICES = [
    { value: 'sauer/zitrus', label: { de: 'Sauer & Zitrus', en: 'Sour & citrus' }, hint: { de: 'Limette, Grapefruit, wach', en: 'Lime, grapefruit, wide awake' } },
    { value: 'rauchig', label: { de: 'Rauchig', en: 'Smoky' }, hint: { de: 'Mezcal und Lagerfeuer', en: 'Mezcal and campfire' } },
    { value: 'süß', label: { de: 'Süß', en: 'Sweet' }, hint: { de: 'Agavendicksaft, Cointreau, rund', en: 'Agave syrup, Cointreau, round' } },
    { value: 'bitter', label: { de: 'Bitter', en: 'Bitter' }, hint: { de: 'Campari, Wermut, Bitters', en: 'Campari, vermouth, bitters' } },
    { value: 'prickelnd', label: { de: 'Prickelnd', en: 'Sparkling' }, hint: { de: 'Soda, Tonic, Grapefruit', en: 'Soda, tonic, grapefruit' } },
    { value: 'fruchtig', label: { de: 'Fruchtig', en: 'Fruity' }, hint: { de: 'Kirsche, Ananas, Beere', en: 'Cherry, pineapple, berry' } },
    { value: 'scharf', label: { de: 'Scharf', en: 'Spicy' }, hint: { de: 'Chili und Tajín am Rand', en: 'Chili and Tajín on the rim' } },
    { value: 'kräuterig/frisch', label: { de: 'Kräuterig & frisch', en: 'Herbal & fresh' }, hint: { de: 'Koriander, Minze, Gurke', en: 'Coriander, mint, cucumber' } },
    { value: 'cremig', label: { de: 'Cremig', en: 'Creamy' }, hint: { de: 'Mit Schaumkrone', en: 'With a head of foam' } },
    { value: 'salzig', label: { de: 'Salzig', en: 'Salty' }, hint: { de: 'Salz am Rand', en: 'Salt on the rim' } },

    { value: 'agave', label: { de: 'Agave', en: 'Agave' }, hint: { de: 'Die Pflanze selbst, grün und süsslich', en: 'The plant itself, green and faintly sweet' } },
    { value: 'pfeffrig', label: { de: 'Pfeffrig', en: 'Peppery' }, hint: { de: 'Weisser Pfeffer und ein bisschen Biss', en: 'White pepper and a bit of bite' } },
    { value: 'vegetal', label: { de: 'Vegetal', en: 'Vegetal' }, hint: { de: 'Grün und pflanzlich', en: 'Green and planty' } },
    { value: 'mineralisch', label: { de: 'Mineralisch', en: 'Mineral' }, hint: { de: 'Stein und Salz', en: 'Stone and salt' } },
    { value: 'vanille', label: { de: 'Vanille', en: 'Vanilla' }, hint: { de: 'Weich und süsslich aus dem Fass', en: 'Soft and sweet from the barrel' } },
    { value: 'karamell', label: { de: 'Karamell', en: 'Caramel' }, hint: { de: 'Gebrannter Zucker', en: 'Burnt sugar' } },
    { value: 'schokolade', label: { de: 'Schokolade', en: 'Chocolate' }, hint: { de: 'Dunkel und rund', en: 'Dark and round' } },
    { value: 'eiche', label: { de: 'Eiche', en: 'Oak' }, hint: { de: 'Das Fass schmeckt deutlich durch', en: 'The barrel comes right through' } },
    { value: 'holzig', label: { de: 'Holzig', en: 'Woody' }, hint: { de: 'Lange gelegen', en: 'A long time resting' } },
    /* House vocabulary the cocktail card uses and an agave drink may pick up.
     * They cost nothing while nothing carries them, because the question
     * builds itself from what is actually on the card. `würzig` arrived with
     * the bar's own flavour cleanup. */
    { value: 'würzig', label: { de: 'Würzig', en: 'Spiced' }, hint: { de: 'Pfeffer, Zimt, warme Gewürze', en: 'Pepper, cinnamon, warm spice' } },
    { value: 'kaffee', label: { de: 'Kaffee', en: 'Coffee' }, hint: { de: 'Espresso im Glas', en: 'Espresso in the glass' } },
    { value: 'überraschend', label: { de: 'Überraschend', en: 'Surprising' }, hint: { de: 'Etwas, das du nicht erwartest', en: 'Something you would not expect' } }
  ];

  /* Clears every other pick, and is cleared by them. The value is
   * BBTequilaEngine.NO_PREFERENCE, which the engine reads as free rein rather
   * than as a character to match. Always offered, so a guest can always hand
   * the choice back however short the card is. */
  var FREE_REIN = {
    value: 'barkeeper', exclusive: true, wide: true,
    label: { de: 'Barkeeper’s Choice', en: 'Bartender’s choice' },
    hint: { de: 'Überrasch mich, ihr kennt die Flaschen besser', en: 'Surprise me, you know the bottles better' }
  };

  function characterOptions(items) {
    var present = {};
    items.forEach(function (d) {
      d.tags.forEach(function (t) { present[t] = true; });
    });
    return CHARACTER_CHOICES.filter(function (o) { return present[o.value]; }).concat([FREE_REIN]);
  }

  function agaveOptions(items) {
    return AGAVE_CHOICES.filter(function (opt) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].expression === opt.value || items[i].kind === opt.value) return true;
      }
      return false;
    });
  }

  var QUESTIONS = [
    {
      id: 'serve',
      type: 'single',
      optional: true,
      title: { de: 'Wie willst du ihn trinken?', en: 'How do you want to drink it?' },
      sub: {
        de: 'Das ist die grösste Weiche des Abends. Alles danach ist Feinschliff.',
        en: 'This is the big fork in the road. Everything after it is fine tuning.'
      },
      options: [
        {
          value: 'pur',
          label: { de: 'Pur im Glas', en: 'Neat in the glass' },
          hint: { de: 'Nur der Brand und Zeit zum Nippen', en: 'Just the spirit and time to sip it' }
        },
        {
          value: 'cocktail',
          label: { de: 'Gemixt', en: 'Mixed' },
          hint: { de: 'Als Cocktail gebaut', en: 'Built into a cocktail' }
        }
      ]
    },
    {
      id: 'agave',
      type: 'multi',
      optional: true,
      title: { de: 'Welche Agave darf es sein?', en: 'Which agave would you like?' },
      sub: {
        de: 'Der Unterschied liegt im Fass und im Feuer. Such dir aus was dich reizt, mehrere gehen auch.',
        en: 'The difference is the barrel and the fire. Pick whatever appeals, several is fine.'
      },
      /* Only what is behind the bar today. See AGAVE_CHOICES above. */
      optionsFrom: function (items) { return agaveOptions(items); },
      skipIf: function (a, items) { return !items || agaveOptions(items).length < 2; }
    },
    {
      id: 'strength',
      type: 'scale',
      optional: true,
      title: { de: 'Wie kräftig darf er sein?', en: 'How strong should it be?' },
      sub: {
        de: 'Ehrliche Antwort. Wir bauen lieber passend als beeindruckend.',
        en: 'Answer honestly. We would rather build it right than build it impressive.'
      },
      // The Menu API's own three strength words and nothing invented between
      // them. An item the card gives no strength scores neutral here.
      options: [
        // The card's own words as of the 08.09.2026 spec, which are leicht,
        // mittel and stark. agave.js still reads the older "mild" too.
        { value: '1', label: { de: 'Leicht', en: 'Light' } },
        { value: '2', label: { de: 'Mittel', en: 'Medium' } },
        { value: '3', label: { de: 'Stark', en: 'Strong' } }
      ]
    },
    {
      id: 'character',
      type: 'multi',
      title: { de: 'Wonach soll es schmecken?', en: 'What should it taste like?' },
      sub: {
        de: 'Zwei oder drei reichen völlig. Oder du überlässt es uns.',
        en: 'Two or three is plenty. Or you leave it to us.'
      },
      /* Only what is on the card today. See CHARACTER_CHOICES above. A pour
       * carries the bar's own flavour_tags, a cocktail has its ingredients
       * read, and either way the guest is never offered a taste nothing on
       * the card has. */
      optionsFrom: function (items) { return characterOptions(items); },
      skipIf: function (a, items) { return !items || characterOptions(items).length < 2; }
    },
    {
      id: 'budget',
      type: 'single',
      optional: true,
      title: { de: 'Wo soll der Preis landen?', en: 'Where should the price land?' },
      sub: {
        de: 'Was du hier sagst halten wir ein. Wir zeigen dir nichts Teureres und reden es dir auch nicht schön.',
        en: 'We hold to whatever you say here. Nothing pricier turns up and nothing gets talked up.'
      },
      /* Built from what the card actually costs. No number in this file is a
       * price, and none goes stale when the card changes. */
      optionsFrom: function (items, lang) {
        return root.BBAgave.budgetStops(items).map(function (v) {
          return {
            value: String(v),
            label: lang === 'en' ? 'Up to ' + v + ' €' : 'Bis ' + v + ' €'
          };
        });
      },
      skipIf: function (a, items) {
        return !items || root.BBAgave.budgetStops(items).length < 2;
      }
    },
    {
      id: 'exclude',
      type: 'multi',
      optional: true,
      title: { de: 'Soll etwas draussen bleiben?', en: 'Anything that should stay out?' },
      sub: {
        de: 'Was du hier wählst taucht garantiert nicht auf. Allergien sag uns bitte immer auch direkt am Tresen.',
        en: 'Whatever you pick here will not turn up. Please also tell us about allergies in person at the bar.'
      },
      /* Mixed on purpose. Neither smoke nor additives are allergies but both
       * are the same guest intent, so they ride in the same answer and the
       * engine splits them back out on BBTequilaEngine.NOT_ALLERGENS. The
       * rest are the allergen strings the card itself uses. */
      options: [
        { value: 'rauch', label: { de: 'Keinen Rauch', en: 'No smoke' }, hint: { de: 'Dann ohne Mezcal', en: 'Then no mezcal' } },
        /* The card records this per bottle and records nothing for a mixed
         * drink, so this answer narrows a guest to the bottles the bar has
         * actually checked. The hint says so rather than letting it look
         * like a filter that happens to return very little. */
        { value: 'zusaetze', label: { de: 'Nur ohne Zusätze', en: 'Additive free only' },
          hint: { de: 'Nur Flaschen, bei denen wir es sicher wissen', en: 'Only bottles we know for certain about' } },
        { value: 'Ei', label: { de: 'Kein Eiweiß', en: 'No egg white' } },
        { value: 'Nüsse', label: { de: 'Keine Nüsse', en: 'No nuts' } },
        { value: 'Milch', label: { de: 'Keine Milchprodukte', en: 'No dairy' } }
      ]
    }
  ];

  // ---------------------------------------------------------------- copy ---

  var UI = {
    de: {
      title: 'Agave',
      lede: 'Von Blanco bis Añejo und einmal quer durch den Rauch. Sag uns kurz worauf du Lust hast, den Rest machen wir.',
      start: 'Los geht’s',
      fullCard: 'Zur ganzen Karte',
      back: 'Zurück',
      next: 'Weiter',
      skip: 'Egal, weiter',
      step: 'Frage {n} von {total}',

      loading: 'Wir holen gerade die Karte.',
      errorTitle: 'Die Karte kommt gerade nicht durch.',
      errorSub: 'Komm einfach an den Tresen, dann sagen wir dir was heute offen steht.',
      retry: 'Nochmal versuchen',
      stale: 'Das ist die Karte, die dieses Gerät zuletzt bekommen hat, {age} alt. Preise können sich inzwischen geändert haben.',
      ageJustNow: 'ein paar Minuten',
      ageMinutes: '{n} Minuten',
      ageHours: '{n} Stunden',
      ageDays: '{n} Tage',
      nothingAgave: 'Auf der Karte steht heute nichts mit Agave.',
      nothingAgaveSub: 'Frag am Tresen, wir haben fast immer etwas offen.',

      results: 'Unsere Empfehlungen',
      resultsSub: '',
      topPick: 'Unser Favorit',
      alsoGood: 'Passt ebenfalls',
      /* Each runner up is labelled by the one thing that separates it from
       * the favourite, and every one of these is a claim a test checks. */
      contrast: {
        smoky: 'Was Rauchiges',
        unsmoked: 'Was ohne Rauch',
        expression: 'Ein {x}',
        older: 'Was länger Gereiftes',
        younger: 'Was Jüngeres',
        region: 'Was aus {x}',
        neat: 'Das Gleiche pur',
        mixed: 'Was Gemixtes',
        stronger: 'Was Kräftigeres',
        lighter: 'Was Leichteres',
        ingredient: 'Was mit {x}',
        cheaper: 'Was Günstigeres',
        character: 'Was {x}'
      },
      // Written out by hand so every comparative is correct German.
      /* Every value here has to be distinct, or two runner ups can differ in
       * the data and read identically on screen. There is a test. */
      characterCompare: {
        'sauer/zitrus': 'mit mehr Säure', 'rauchig': 'Rauchigeres', 'süß': 'Süßeres',
        'bitter': 'Bittereres', 'prickelnd': 'mit Perlage', 'fruchtig': 'Fruchtigeres',
        'scharf': 'Schärferes', 'kräuterig/frisch': 'Frischeres', 'cremig': 'Cremigeres',
        'salzig': 'Salzigeres',
        'agave': 'mit mehr Agave', 'pfeffrig': 'Pfeffrigeres', 'vegetal': 'mit mehr Grün',
        'mineralisch': 'Mineralischeres', 'vanille': 'mit Vanille', 'karamell': 'mit Karamell',
        'schokolade': 'mit Schokolade', 'eiche': 'aus dem Fass', 'holzig': 'Holzigeres',
        'würzig': 'Würzigeres', 'kaffee': 'mit Kaffee', 'überraschend': 'Überraschenderes'
      },

      match: '{n}% Übereinstimmung',
      bestseller: 'Bestseller',
      neatBadge: 'Pur',
      smokyBadge: 'Rauchig',
      cleanBadge: 'Ohne Zusätze',
      // The card's own leader for its section, the gold star on the website.
      leaderBadge: 'Unsere Wahl',
      notOnCard: 'Nicht auf der Karte',

      restart: 'Nochmal von vorn',
      moreOptions: 'Mehr Vorschläge',
      ingredients: 'Drin ist',
      priceLabel: 'Preis',
      styleLabel: 'Stil',
      regionLabel: 'Herkunft',

      empty: 'Bei dieser Kombination wird es eng.',
      emptySub: 'Kein Problem. Komm an den Tresen, dann suchen wir dir gemeinsam eine Flasche.',
      loosened: 'Pur ist bei diesen Vorgaben gerade nichts dabei, deshalb stehen hier gemixte Drinks.',
      footer: 'Alle Preise kommen direkt von unserer Karte. Allergien bitte immer auch direkt beim Team melden.',

      reasons: {
        kind: 'ist ein {x}',
        expression: 'ist ein {x}',
        character: 'schmeckt {x}',
        characterFrom: 'schmeckt {x} durch {from}',
        strength_exact: 'genau die Stärke, die du wolltest',
        strength_near: 'liegt nah an deiner Wunschstärke',
        safe: 'ohne alles, was du ausgeschlossen hast',
        budget: 'liegt in deinem Rahmen'
      },
      kindNames: {
        tequila: 'Tequila', mezcal: 'Mezcal', sotol: 'Sotol',
        raicilla: 'Raicilla', bacanora: 'Bacanora', agave: 'Agavenbrand'
      },
      expressionNames: {
        blanco: 'Blanco', joven: 'Joven', reposado: 'Reposado', rosado: 'Rosado',
        anejo: 'Añejo', 'extra-anejo': 'Extra Añejo', cristalino: 'Cristalino'
      },
      agedLabel: 'Im Fass',
      abvLabel: 'Alkohol',
      agedMonths: '{n} Monate',
      agedYears: '{n} Jahre',
      /* The card writes the region freely, so only the two everyday cases get
       * a German word. Anything else is shown exactly as the card writes it.
       * regionContrast carries the whole phrase rather than a preposition and
       * a slot, because "Was aus dem Oaxaca / Valles" is not German. */
      regionNames: { highland: 'Hochland', lowland: 'Tiefland' },
      regionContrast: { highland: 'Was aus dem Hochland', lowland: 'Was aus dem Tiefland' },
      // Read back as "schmeckt ...", so these have to work as adverbs.
      characterNames: {
        'sauer/zitrus': 'sauer und frisch', 'rauchig': 'rauchig', 'süß': 'süß',
        'bitter': 'bitter', 'prickelnd': 'prickelnd', 'fruchtig': 'fruchtig',
        'scharf': 'scharf', 'kräuterig/frisch': 'kräuterig', 'cremig': 'cremig',
        'salzig': 'salzig',
        'agave': 'nach Agave', 'pfeffrig': 'pfeffrig', 'vegetal': 'vegetal',
        'mineralisch': 'mineralisch', 'vanille': 'nach Vanille', 'karamell': 'nach Karamell',
        'schokolade': 'nach Schokolade', 'eiche': 'nach Eiche', 'holzig': 'holzig',
        'würzig': 'würzig', 'kaffee': 'nach Kaffee', 'überraschend': 'überraschend'
      },
      and: ' und '
    },

    en: {
      title: 'Agave',
      lede: 'From blanco to añejo and all the way through the smoke. Tell us what you feel like and we will take it from there.',
      start: 'Start',
      fullCard: 'See the full list',
      back: 'Back',
      next: 'Next',
      skip: 'No preference',
      step: 'Question {n} of {total}',

      loading: 'Fetching the card.',
      errorTitle: 'The card is not coming through right now.',
      errorSub: 'Come to the bar and we will tell you what is open today.',
      retry: 'Try again',
      stale: 'This is the card this device received last, {age} old. Prices may have changed since.',
      ageJustNow: 'a few minutes',
      ageMinutes: '{n} minutes',
      ageHours: '{n} hours',
      ageDays: '{n} days',
      nothingAgave: 'There is nothing with agave on the card today.',
      nothingAgaveSub: 'Ask at the bar, we almost always have something open.',

      results: 'Our recommendations',
      resultsSub: 'Drink descriptions come straight from our card.',
      topPick: 'Our pick',
      alsoGood: 'Also a good fit',
      contrast: {
        smoky: 'Something smoky',
        unsmoked: 'Something without smoke',
        expression: '{x} instead',
        older: 'Something aged longer',
        younger: 'Something younger',
        region: 'Something from {x}',
        neat: 'The same thing neat',
        mixed: 'Something mixed',
        stronger: 'Something stronger',
        lighter: 'Something lighter',
        ingredient: 'Something with {x}',
        cheaper: 'Something cheaper',
        character: 'Something {x}'
      },
      characterCompare: {
        'sauer/zitrus': 'with more acidity', 'rauchig': 'smokier', 'süß': 'sweeter',
        'bitter': 'more bitter', 'prickelnd': 'with bubbles', 'fruchtig': 'fruitier',
        'scharf': 'spicier', 'kräuterig/frisch': 'fresher', 'cremig': 'creamier',
        'salzig': 'saltier',
        'agave': 'with more agave', 'pfeffrig': 'peppery', 'vegetal': 'greener',
        'mineralisch': 'more mineral', 'vanille': 'with vanilla', 'karamell': 'with caramel',
        'schokolade': 'with chocolate', 'eiche': 'straight from the barrel', 'holzig': 'woodier',
        'würzig': 'more spiced', 'kaffee': 'with coffee', 'überraschend': 'more surprising'
      },

      match: '{n}% match',
      bestseller: 'Bestseller',
      neatBadge: 'Neat',
      smokyBadge: 'Smoky',
      cleanBadge: 'Additive free',
      leaderBadge: 'Our choice',
      notOnCard: 'Off menu',

      restart: 'Start over',
      moreOptions: 'More suggestions',
      ingredients: 'What is in it',
      priceLabel: 'Price',
      styleLabel: 'Style',
      regionLabel: 'Origin',

      empty: 'That combination gets tight.',
      emptySub: 'Not a problem. Come to the bar and we will find you a bottle together.',
      loosened: 'Nothing neat fits what you asked for, so these are mixed drinks instead.',
      footer: 'Every price comes straight from our card. Please always tell the team about allergies in person.',

      reasons: {
        kind: 'is a {x}',
        expression: 'is a {x}',
        character: 'tastes {x}',
        characterFrom: 'tastes {x} thanks to {from}',
        strength_exact: 'exactly the strength you asked for',
        strength_near: 'close to the strength you asked for',
        safe: 'free of everything you ruled out',
        budget: 'sits inside your range'
      },
      kindNames: {
        tequila: 'tequila', mezcal: 'mezcal', sotol: 'sotol',
        raicilla: 'raicilla', bacanora: 'bacanora', agave: 'agave spirit'
      },
      expressionNames: {
        blanco: 'Blanco', joven: 'Joven', reposado: 'Reposado', rosado: 'Rosado',
        anejo: 'Añejo', 'extra-anejo': 'Extra Añejo', cristalino: 'Cristalino'
      },
      agedLabel: 'In oak',
      abvLabel: 'Alcohol',
      agedMonths: '{n} months',
      agedYears: '{n} years',
      regionNames: { highland: 'Highlands', lowland: 'Lowlands' },
      regionContrast: { highland: 'Something from the highlands', lowland: 'Something from the lowlands' },
      characterNames: {
        'sauer/zitrus': 'sour and fresh', 'rauchig': 'smoky', 'süß': 'sweet',
        'bitter': 'bitter', 'prickelnd': 'sparkling', 'fruchtig': 'fruity',
        'scharf': 'spicy', 'kräuterig/frisch': 'herbal', 'cremig': 'creamy',
        'salzig': 'salty',
        'agave': 'of agave', 'pfeffrig': 'peppery', 'vegetal': 'vegetal',
        'mineralisch': 'mineral', 'vanille': 'of vanilla', 'karamell': 'of caramel',
        'schokolade': 'of chocolate', 'eiche': 'of oak', 'holzig': 'woody',
        'würzig': 'spiced', 'kaffee': 'of coffee', 'überraschend': 'surprising'
      },
      and: ' and '
    }
  };

  var api = {
    QUESTIONS: QUESTIONS, UI: UI,
    AGAVE_CHOICES: AGAVE_CHOICES, agaveOptions: agaveOptions,
    CHARACTER_CHOICES: CHARACTER_CHOICES, characterOptions: characterOptions,
    FREE_REIN: FREE_REIN
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBTequilaQuestions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
