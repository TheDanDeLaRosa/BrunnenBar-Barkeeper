/*
 * BrunnenBar — Whisky recommender, question flow and all interface copy
 * =========================================================================
 * Every answer value here is a literal value from the Menu API, never a
 * translation of one. `Islay` is the string the card carries, the peat
 * numbers are the card's own 0 to 4 scale, the tasting notes are its
 * `whisky.notes` verbatim. No mapping layer means nothing can drift.
 *
 * `needs` names the field on `item.whisky` that a question scores against.
 * A question whose field carries fewer than two different values across the
 * whole shelf is dropped before the guest ever sees it, because it could not
 * tell two bottles apart. That is how this app stays honest while the Menu
 * API is still growing the fields in docs/whisky-api-felder-fuer-die-app.md.
 *
 * Bottle copy is the bar's own German and is never machine translated. The
 * chrome around it is bilingual and falls back to German per field.
 * =========================================================================
 */
(function (root) {
  'use strict';

  var QUESTIONS = [
    {
      id: 'level',
      type: 'single',
      needs: 'level',
      optional: true,
      /* Asking how much someone knows about whisky makes them defensive, and
       * a guest who feels tested orders a beer. So the question asks what the
       * glass is for instead. Same four values, framed as an occasion. */
      title: { de: 'Was soll heute im Glas stehen?', en: 'What are we pouring tonight?' },
      sub: {
        de: 'Bei uns steht von der ersten Flasche bis zur guten hinten alles offen.',
        en: 'Everything from the first bottle to the good stuff at the back is open to you.'
      },
      options: [
        { value: 'einstieg', label: { de: 'Mein erster Whisky', en: 'My first whisky' },
          hint: { de: 'Weich und freundlich, kein Sprung ins kalte Wasser', en: 'Soft and friendly, no deep end' } },
        { value: 'klassiker', label: { de: 'Was Vertrautes', en: 'Something familiar' },
          hint: { de: 'Ein Klassiker, den man kennt', en: 'A classic everyone knows' } },
        { value: 'kenner', label: { de: 'Was Neues', en: 'Something new' },
          hint: { de: 'Ich trinke öfter Whisky und will mal woanders hin', en: 'I drink whisky often and want to go somewhere else' } },
        { value: 'rarität', label: { de: 'Was Besonderes', en: 'Something special' },
          hint: { de: 'Heute darf es die gute Flasche sein', en: 'Tonight it can be the good bottle' } }
      ]
    },
    {
      id: 'peat',
      type: 'scale',
      needs: 'peat',
      /* The one axis that genuinely divides people, so it gets the scale and
       * it gets a hard rule behind it. See assets/engine.js. */
      title: { de: 'Wie viel Rauch darf es sein?', en: 'How much smoke do you want?' },
      sub: {
        de: 'Rauch ist die eine Sache, bei der Whisky die Leute auseinander treibt. Sag ehrlich, wo du stehst.',
        en: 'Smoke is the one thing that splits whisky drinkers. Be honest about where you stand.'
      },
      // Values and labels are the card's own peat scale.
      options: [
        { value: '0', label: { de: 'Kein Rauch', en: 'No smoke' } },
        { value: '1', label: { de: 'Ein Hauch', en: 'A hint' } },
        { value: '2', label: { de: 'Spürbar', en: 'Noticeable' } },
        { value: '3', label: { de: 'Kräftig', en: 'Bold' } },
        { value: '4', label: { de: 'Lagerfeuer', en: 'Campfire' } }
      ]
    },
    {
      id: 'notes',
      type: 'multi',
      needs: 'notes',
      title: { de: 'Wonach soll er schmecken?', en: 'What should it taste like?' },
      sub: {
        de: 'Such dir aus, worauf du Lust hast. Zwei oder drei reichen völlig. Oder du überlässt es uns.',
        en: 'Pick whatever appeals. Two or three is plenty. Or leave it to us.'
      },
      // Values are whisky.notes from the card, unchanged.
      options: [
        { value: 'fruchtig', label: { de: 'Fruchtig', en: 'Fruity' }, hint: { de: 'Apfel, Birne, Orange', en: 'Apple, pear, orange' } },
        { value: 'zitrus', label: { de: 'Zitrus', en: 'Citrus' }, hint: { de: 'Zitrone, hell und wach', en: 'Lemon, bright and awake' } },
        { value: 'honig/vanille', label: { de: 'Honig und Vanille', en: 'Honey and vanilla' }, hint: { de: 'Rund und weich', en: 'Round and soft' } },
        { value: 'malzig', label: { de: 'Malzig', en: 'Malty' }, hint: { de: 'Getreide, Keks, warmes Brot', en: 'Grain, biscuit, warm bread' } },
        { value: 'würzig', label: { de: 'Würzig', en: 'Spicy' }, hint: { de: 'Pfeffer, Zimt, Eichenholz', en: 'Pepper, cinnamon, oak' } },
        { value: 'dunkle früchte', label: { de: 'Dunkle Früchte', en: 'Dark fruit' }, hint: { de: 'Rosine, Dörrobst, Sherry', en: 'Raisin, dried fruit, sherry' } },
        { value: 'schokolade', label: { de: 'Schokolade', en: 'Chocolate' }, hint: { de: 'Dunkel und cremig', en: 'Dark and creamy' } },
        { value: 'maritim/salzig', label: { de: 'Maritim und salzig', en: 'Maritime and salty' }, hint: { de: 'Meer, Salz, nasser Stein', en: 'Sea, salt, wet stone' } },
        { value: 'blumig', label: { de: 'Blumig', en: 'Floral' }, hint: { de: 'Heide und Honigblüte, ganz leicht', en: 'Heather and honeysuckle, very light' } },
        { value: 'nussig', label: { de: 'Nussig', en: 'Nutty' }, hint: { de: 'Mandel, Walnuss, trocken', en: 'Almond, walnut, dry' } },
        { value: 'cremig', label: { de: 'Cremig', en: 'Creamy' }, hint: { de: 'Weich und rund im Mund', en: 'Soft and round in the mouth' } },
        /* The card writes tasting tags into `flavour_tags`, the same field
         * and the same vocabulary the cocktail export uses, so the values
         * below can turn up on a bottle as easily as on a drink. Only the
         * ones a bottle actually carries are ever offered, so listing them
         * here costs nothing and buys each one a hint. */
        { value: 'süß', label: { de: 'Süß', en: 'Sweet' }, hint: { de: 'Rund und weich', en: 'Round and soft' } },
        { value: 'bitter', label: { de: 'Bitter', en: 'Bitter' }, hint: { de: 'Trocken, mit Kante', en: 'Dry, with an edge' } },
        { value: 'sauer/zitrus', label: { de: 'Sauer und Zitrus', en: 'Sour and citrus' }, hint: { de: 'Zitrone, hell und wach', en: 'Lemon, bright and awake' } },
        { value: 'kräuterig/frisch', label: { de: 'Kräuterig und frisch', en: 'Herbal and fresh' }, hint: { de: 'Gras, Heu, Minze', en: 'Grass, hay, mint' } },
        { value: 'holzig', label: { de: 'Holzig', en: 'Woody' }, hint: { de: 'Eiche, trocken, alt', en: 'Oak, dry, old' } },
        { value: 'salzig', label: { de: 'Salzig', en: 'Salty' }, hint: { de: 'Meer und nasser Stein', en: 'Sea and wet stone' } },
        { value: 'scharf', label: { de: 'Scharf', en: 'Fiery' }, hint: { de: 'Pfeffer und Wärme', en: 'Pepper and heat' } },
        { value: 'kaffee', label: { de: 'Kaffee', en: 'Coffee' }, hint: { de: 'Röstig und dunkel', en: 'Roasted and dark' } },
        /* `exclusive` clears every other pick and vice versa. The value is
         * BBWhiskyEngine.NO_PREFERENCE, which the engine reads as free rein
         * rather than as a note to match. */
        {
          value: 'barkeeper', exclusive: true, wide: true,
          label: { de: 'Barkeeper’s Choice', en: 'Bartender’s choice' },
          hint: { de: 'Überrasch mich, ihr kennt die Flaschen besser', en: 'Surprise me, you know the bottles better' }
        }
      ]
    },
    {
      id: 'origin',
      type: 'multi',
      needs: 'origin',
      optional: true,
      title: { de: 'Gibt es eine Ecke, die dich reizt?', en: 'Any corner of the world you fancy?' },
      sub: {
        de: 'Mehrfachauswahl möglich. Wenn dir die Herkunft egal ist, geh einfach weiter.',
        en: 'Pick as many as you like. If you do not care where it comes from, just carry on.'
      },
      // Values are whisky.origin from the card.
      options: [
        { value: 'Speyside', label: { de: 'Speyside', en: 'Speyside' }, hint: { de: 'Weich und fruchtig', en: 'Soft and fruity' } },
        { value: 'Islay', label: { de: 'Islay', en: 'Islay' }, hint: { de: 'Torf und Meer', en: 'Peat and sea' } },
        { value: 'Highlands', label: { de: 'Highlands', en: 'Highlands' }, hint: { de: 'Kräftig und weit', en: 'Bold and wide open' } },
        { value: 'Lowlands', label: { de: 'Lowlands', en: 'Lowlands' }, hint: { de: 'Leicht und sanft', en: 'Light and gentle' } },
        { value: 'Campbeltown', label: { de: 'Campbeltown', en: 'Campbeltown' }, hint: { de: 'Salzig und ölig', en: 'Salty and oily' } },
        { value: 'Inseln', label: { de: 'Die Inseln', en: 'The islands' }, hint: { de: 'Wind, Salz, oft etwas Rauch', en: 'Wind, salt, often a little smoke' } },
        { value: 'Irland', label: { de: 'Irland', en: 'Ireland' }, hint: { de: 'Weich und rund', en: 'Soft and round' } },
        { value: 'USA', label: { de: 'USA', en: 'USA' }, hint: { de: 'Bourbon und Rye, süß vom neuen Fass', en: 'Bourbon and rye, sweet from new oak' } },
        { value: 'Japan', label: { de: 'Japan', en: 'Japan' }, hint: { de: 'Fein und genau gebaut', en: 'Fine and precisely built' } },
        { value: 'Andere', label: { de: 'Woanders her', en: 'Somewhere else' }, hint: { de: 'Der Rest der Welt brennt auch', en: 'The rest of the world distils too' } },

        /* The card spells several of these its own way, Highland rather than
         * Highlands and Kentucky rather than USA. Both spellings live here
         * because only the ones the card actually carries are ever offered,
         * so a duplicate costs nothing and a missing one costs a hint. */
        { value: 'Highland', label: { de: 'Highland', en: 'Highland' }, hint: { de: 'Kräftig und weit', en: 'Bold and wide open' } },
        { value: 'Lowland', label: { de: 'Lowland', en: 'Lowland' }, hint: { de: 'Leicht und sanft', en: 'Light and gentle' } },
        { value: 'Skye', label: { de: 'Skye', en: 'Skye' }, hint: { de: 'Wind, Salz und meistens Rauch', en: 'Wind, salt and usually smoke' } },
        { value: 'Scotland', label: { de: 'Schottland', en: 'Scotland' }, hint: { de: 'Ein Blend aus mehreren Gegenden', en: 'A blend from several regions' } },
        { value: 'Ireland', label: { de: 'Irland', en: 'Ireland' }, hint: { de: 'Weich und rund', en: 'Soft and round' } },
        { value: 'Kentucky', label: { de: 'Kentucky', en: 'Kentucky' }, hint: { de: 'Bourbon und Rye, süß vom neuen Fass', en: 'Bourbon and rye, sweet from new oak' } },
        { value: 'Tennessee', label: { de: 'Tennessee', en: 'Tennessee' }, hint: { de: 'Durch Holzkohle gefiltert, weich', en: 'Charcoal filtered, soft' } },
        { value: 'Island', label: { de: 'Die Inseln', en: 'The islands' }, hint: { de: 'Wind, Salz, oft etwas Rauch', en: 'Wind, salt, often a little smoke' } },
        /* Not a region but a way of building, and it earns a button anyway
         * because a guest who wants a blend knows the word and looks for it. */
        { value: 'Blended', label: { de: 'Ein Blend', en: 'A blend' }, hint: { de: 'Aus mehreren Brennereien zusammengesetzt', en: 'Put together from several distilleries' } }
      ]
    },
    {
      id: 'cask',
      type: 'multi',
      needs: 'cask',
      optional: true,
      title: { de: 'Und aus welchem Fass?', en: 'And out of which cask?' },
      sub: {
        de: 'Das Fass macht am Ende oft mehr aus als die Jahreszahl auf der Flasche.',
        en: 'The cask usually matters more than the number of years on the label.'
      },
      // Values are whisky.cask from the card.
      options: [
        { value: 'Bourbonfass', label: { de: 'Bourbonfass', en: 'Bourbon cask' }, hint: { de: 'Vanille, Honig, hell', en: 'Vanilla, honey, bright' } },
        { value: 'Sherryfass', label: { de: 'Sherryfass', en: 'Sherry cask' }, hint: { de: 'Rosine, Nuss, dunkel', en: 'Raisin, nut, dark' } },
        { value: 'Portfass', label: { de: 'Portfass', en: 'Port cask' }, hint: { de: 'Beere und Süße', en: 'Berry and sweetness' } },
        { value: 'Weinfass', label: { de: 'Weinfass', en: 'Wine cask' }, hint: { de: 'Fruchtig und würzig', en: 'Fruity and spiced' } },
        { value: 'Rumfass', label: { de: 'Rumfass', en: 'Rum cask' }, hint: { de: 'Tropisch und süß', en: 'Tropical and sweet' } },
        { value: 'Neue Eiche', label: { de: 'Neue Eiche', en: 'New oak' }, hint: { de: 'Vanille und Holz, kräftig', en: 'Vanilla and wood, bold' } }
      ]
    },
    {
      id: 'serve',
      type: 'single',
      needs: 'serve',
      optional: true,
      title: { de: 'Wie trinkst du ihn?', en: 'How do you drink it?' },
      sub: {
        de: 'Manche Flaschen wollen einen Schluck Wasser, andere kommen erst im langen Glas in Fahrt.',
        en: 'Some bottles want a splash of water, others only get going in a tall glass.'
      },
      // Values are whisky.serve from the card.
      options: [
        { value: 'pur', label: { de: 'Pur', en: 'Neat' }, hint: { de: 'Nur das Glas und du', en: 'Just the glass and you' } },
        { value: 'mit Wasser', label: { de: 'Mit einem Schluck Wasser', en: 'With a splash of water' }, hint: { de: 'Öffnet den Duft', en: 'Opens up the nose' } },
        { value: 'auf Eis', label: { de: 'Auf Eis', en: 'On ice' }, hint: { de: 'Kühl und langsam', en: 'Cold and slow' } },
        { value: 'Highball', label: { de: 'Als Highball', en: 'As a highball' }, hint: { de: 'Lang, kalt, mit Soda', en: 'Long, cold, with soda' } }
      ]
    },
    {
      id: 'budget',
      type: 'bands',
      needs: 'price',
      optional: true,
      /* The three labels are filled in from the real pour prices on the card
       * at run time. Nothing about money is written into the app. */
      title: { de: 'Was darf das Glas kosten?', en: 'What should the glass cost?' },
      sub: {
        de: 'Wir zeigen dir den Preis sowieso, egal was du hier antippst.',
        en: 'We show you the price either way, whatever you tap here.'
      },
      options: [
        { value: '1', label: { de: 'Bis {x}', en: 'Up to {x}' }, hint: { de: 'Gut und geradeaus', en: 'Good and straightforward' } },
        { value: '2', label: { de: 'Bis {x}', en: 'Up to {x}' }, hint: { de: 'Etwas mehr Spielraum', en: 'A bit more room' } },
        { value: '3', label: { de: 'Preis egal', en: 'Price is no object' }, hint: { de: 'Zeig mir das Beste, was ihr da stehen habt', en: 'Show me the best thing you have' } }
      ]
    }
  ];

  // ---------------------------------------------------------------- copy ---
  var UI = {
    de: {
      title: 'BrunnenBar',
      lede: 'Wir haben eine Wand voller Whisky und keine Lust, dich damit allein zu lassen. Ein paar Fragen und wir haben deine Flasche.',
      start: 'Los geht’s',
      fullCard: 'Zur ganzen Karte',
      back: 'Zurück',
      next: 'Weiter',
      skip: 'Egal, weiter',
      step: 'Frage {n} von {total}',
      loading: 'Wir holen gerade die Karte.',
      results: 'Das würden wir dir einschenken',
      resultsSub: '',
      topPick: 'Unsere Empfehlung',
      alsoGood: 'Passt ebenfalls',
      // Each runner up is labelled by the one thing that separates it.
      contrast: {
        smokier: 'Was Rauchigeres',
        gentler: 'Was Sanfteres',
        origin: 'Was aus {x}',
        cask: 'Was aus dem {x}',
        older: 'Was Älteres',
        younger: 'Was Jüngeres',
        cheaper: 'Was Günstigeres',
        dearer: 'Was aus dem oberen Regal',
        note: 'Was {x}'
      },
      // Written out by hand so every comparative is correct German.
      noteCompare: {
        'fruchtig': 'Fruchtigeres', 'zitrus': 'mit mehr Zitrus', 'honig/vanille': 'Süßeres',
        'malzig': 'Malzigeres', 'würzig': 'Würzigeres', 'dunkle früchte': 'mit dunklen Früchten',
        'schokolade': 'mit Schokolade', 'maritim/salzig': 'Salzigeres', 'blumig': 'Blumigeres',
        'nussig': 'Nussigeres', 'cremig': 'Cremigeres',
        'süß': 'Süßeres', 'bitter': 'Bittereres', 'sauer/zitrus': 'mit mehr Säure',
        'kräuterig/frisch': 'Frischeres', 'holzig': 'Holzigeres', 'salzig': 'Salzigeres',
        'scharf': 'Schärferes', 'kaffee': 'mit Kaffee', 'prickelnd': 'mit Perlage',
        'überraschend': 'Überraschenderes'
      },
      match: '{n}% Übereinstimmung',
      badgeSmoke: 'Rauchig',
      badgeStart: 'Guter Einstieg',
      badgeRare: 'Rarität',
      badgeLoved: 'Wird oft bestellt',
      notOnCard: 'Nicht auf der Karte',
      restart: 'Nochmal von vorn',
      moreOptions: 'Mehr Vorschläge',
      keyOrigin: 'Von',
      keyKind: 'Art',
      keyCask: 'Fass',
      keyAge: 'Alter',
      keyAbv: 'Alkohol',
      keySmoke: 'Rauch',
      keyServe: 'Am liebsten',
      keyPrice: 'Preis',
      ageYears: '{n} Jahre',
      ageNas: 'ohne Altersangabe',
      empty: 'Bei dieser Kombination wird es eng.',
      emptySub: 'Kein Problem. Komm an den Tresen, dann stellen wir dir zwei Gläser hin und du entscheidest.',
      loosenedOrigin: 'Aus deiner Wunschgegend haben wir gerade nichts Passendes, deshalb stehen hier Flaschen von woanders.',
      loosenedLevel: 'Wir haben die Auswahl etwas geöffnet, um dir überhaupt etwas anbieten zu können.',
      smokeGap: 'So genau haben wir deinen Rauch gerade nicht getroffen, das hier kommt am nächsten dran.',
      footer: 'Alle Preise gelten pro Glas. Sag am Tresen Bescheid, wenn du vorher probieren willst.',
      noData: 'Unsere Whiskyauswahl steht noch nicht in der Karte.',
      noDataSub: 'Sobald jede Flasche ihr Profil hat, läuft das hier. Bis dahin fragst du am besten einfach uns.',
      offline: 'Die Karte war gerade nicht erreichbar. Das hier ist der Stand von vor {x}.',
      offlineFail: 'Wir kommen gerade nicht an die Karte. Probier es gleich noch einmal oder frag uns direkt.',
      demo: 'Vorschaumodus mit erfundenen Beispielflaschen. Nichts davon ist unsere echte Karte.',
      ageMinutes: '{n} Minuten', ageHours: '{n} Stunden', ageDays: '{n} Tagen',
      reasons: {
        peat_exact: 'genau so viel Rauch, wie du wolltest',
        peat_near: 'liegt nah an deinem Wunsch beim Rauch',
        peat_none: 'kommt ganz ohne Rauch aus',
        notes: 'schmeckt {x}',
        origin: 'kommt aus {x}',
        cask: 'lag im {x}',
        serve: 'trinkt sich genau so, wie du es magst',
        level: 'passt zu dem, was du heute suchst',
        budget: 'liegt in deinem Rahmen'
      },
      levelNames: {
        'einstieg': 'einem guten Einstieg', 'klassiker': 'einem Klassiker',
        'kenner': 'etwas Neuem', 'rarität': 'etwas Besonderem'
      },
      // Read back as "schmeckt ...", so these have to work as adverbs.
      noteNames: {
        'fruchtig': 'fruchtig', 'zitrus': 'nach Zitrus', 'honig/vanille': 'nach Honig und Vanille',
        'malzig': 'malzig', 'würzig': 'würzig', 'dunkle früchte': 'nach dunklen Früchten',
        'schokolade': 'nach Schokolade', 'maritim/salzig': 'salzig und maritim',
        'blumig': 'blumig', 'nussig': 'nussig', 'cremig': 'cremig',
        'süß': 'süß', 'bitter': 'bitter', 'sauer/zitrus': 'sauer und frisch',
        'kräuterig/frisch': 'kräuterig', 'holzig': 'holzig', 'salzig': 'salzig',
        'scharf': 'scharf', 'kaffee': 'nach Kaffee', 'prickelnd': 'prickelnd',
        'überraschend': 'überraschend'
      },
      peatNames: ['ohne Rauch', 'mit einem Hauch Rauch', 'spürbar rauchig', 'kräftig rauchig', 'wie ein Lagerfeuer']
    },
    en: {
      title: 'BrunnenBar',
      lede: 'We have a wall full of whisky and no intention of leaving you alone with it. A few questions and we will find your bottle.',
      start: 'Start',
      fullCard: 'See the full list',
      back: 'Back',
      next: 'Next',
      skip: 'No preference',
      step: 'Question {n} of {total}',
      loading: 'Fetching the list.',
      results: 'This is what we would pour you',
      resultsSub: 'Bottle descriptions are in German, as they are on our card.',
      topPick: 'Our pick',
      alsoGood: 'Also a good fit',
      contrast: {
        smokier: 'Something smokier',
        gentler: 'Something gentler',
        origin: 'Something from {x}',
        cask: 'Something from a {x}',
        older: 'Something older',
        younger: 'Something younger',
        cheaper: 'Something cheaper',
        dearer: 'Something from the top shelf',
        note: 'Something {x}'
      },
      noteCompare: {
        'fruchtig': 'fruitier', 'zitrus': 'with more citrus', 'honig/vanille': 'sweeter',
        'malzig': 'maltier', 'würzig': 'spicier', 'dunkle früchte': 'with dark fruit',
        'schokolade': 'with chocolate', 'maritim/salzig': 'saltier', 'blumig': 'more floral',
        'nussig': 'nuttier', 'cremig': 'creamier',
        'süß': 'sweeter', 'bitter': 'more bitter', 'sauer/zitrus': 'with more acidity',
        'kräuterig/frisch': 'fresher', 'holzig': 'woodier', 'salzig': 'saltier',
        'scharf': 'fierier', 'kaffee': 'with coffee', 'prickelnd': 'with bubbles',
        'überraschend': 'more surprising'
      },
      match: '{n}% match',
      badgeSmoke: 'Smoky',
      badgeStart: 'Good first whisky',
      badgeRare: 'Rare',
      badgeLoved: 'Ordered a lot',
      notOnCard: 'Off-menu',
      restart: 'Start over',
      moreOptions: 'More suggestions',
      keyOrigin: 'From',
      keyKind: 'Style',
      keyCask: 'Cask',
      keyAge: 'Age',
      keyAbv: 'Alcohol',
      keySmoke: 'Smoke',
      keyServe: 'Best served',
      keyPrice: 'Price',
      ageYears: '{n} years',
      ageNas: 'no age statement',
      empty: 'That combination gets tight.',
      emptySub: 'Not a problem. Come to the bar, we will put two glasses in front of you and let you decide.',
      loosenedOrigin: 'Nothing from the region you asked for fits right now, so these come from elsewhere.',
      loosenedLevel: 'We opened the selection up a little so we could offer you something at all.',
      smokeGap: 'We could not match the smoke you asked for exactly, so this is the closest we have.',
      footer: 'All prices are per glass. Tell us at the bar if you would like a taste first.',
      noData: 'Our whisky shelf is not in the card yet.',
      noDataSub: 'As soon as every bottle carries its profile this will work. Until then just ask us.',
      offline: 'We could not reach the card. This is how it looked {x} ago.',
      offlineFail: 'We cannot reach the card right now. Try again in a moment or just ask us.',
      demo: 'Preview mode with invented example bottles. None of this is our real card.',
      ageMinutes: '{n} minutes', ageHours: '{n} hours', ageDays: '{n} days',
      reasons: {
        peat_exact: 'exactly the smoke you asked for',
        peat_near: 'close to the smoke you asked for',
        peat_none: 'no smoke at all',
        notes: 'tastes {x}',
        origin: 'comes from {x}',
        cask: 'matured in a {x}',
        serve: 'drinks exactly the way you like it',
        level: 'fits what you are after tonight',
        budget: 'sits inside your range'
      },
      levelNames: {
        'einstieg': 'a good place to start', 'klassiker': 'a classic',
        'kenner': 'something new', 'rarität': 'something special'
      },
      noteNames: {
        'fruchtig': 'fruity', 'zitrus': 'of citrus', 'honig/vanille': 'of honey and vanilla',
        'malzig': 'malty', 'würzig': 'spicy', 'dunkle früchte': 'of dark fruit',
        'schokolade': 'of chocolate', 'maritim/salzig': 'salty and maritime',
        'blumig': 'floral', 'nussig': 'nutty', 'cremig': 'creamy',
        'süß': 'sweet', 'bitter': 'bitter', 'sauer/zitrus': 'sour and fresh',
        'kräuterig/frisch': 'herbal', 'holzig': 'woody', 'salzig': 'salty',
        'scharf': 'fiery', 'kaffee': 'of coffee', 'prickelnd': 'sparkling',
        'überraschend': 'surprising'
      },
      peatNames: ['no smoke', 'a hint of smoke', 'noticeably smoky', 'boldly smoky', 'like a campfire']
    }
  };

  /* The English side of a card value, for the values that are proper strings
   * rather than translated copy. Origins and casks are shown as they come
   * from the card, and only these need an English form. */
  var VALUE_EN = {
    'Inseln': 'The islands',
    'Irland': 'Ireland',
    'Andere': 'Elsewhere',
    'Bourbonfass': 'Bourbon cask',
    'Sherryfass': 'Sherry cask',
    'Portfass': 'Port cask',
    'Weinfass': 'Wine cask',
    'Rumfass': 'Rum cask',
    'Neue Eiche': 'New oak',
    'pur': 'neat',
    'mit Wasser': 'with a splash of water',
    'auf Eis': 'on ice',
    'Highball': 'as a highball'
  };

  var api = { QUESTIONS: QUESTIONS, UI: UI, VALUE_EN: VALUE_EN };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBWhiskyQuestions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
