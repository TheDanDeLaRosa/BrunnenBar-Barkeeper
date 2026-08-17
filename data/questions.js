/*
 * BrunnenBar — Question flow + all interface copy (DE / EN)
 * =========================================================================
 * The flow follows the order a bartender actually asks in:
 *   1. What is this drink FOR?      (occasion sets the whole frame)
 *   2. How strong?                  (and is alcohol on the table at all)
 *   3. Any spirit you love / hate?  (skipped entirely if zero-proof)
 *   4. Which way do you lean?       (the real flavour question)
 *   5. Long or short?               (texture — how it arrives)
 *   6. Classic or something new?    (adventure)
 *   7. Anything you avoid?          (allergens — asked last, never skipped)
 *
 * `skipIf` receives the answers collected so far and returns true to hide
 * the question. `optional` questions show a "no preference" path.
 * =========================================================================
 */
(function (root) {
  'use strict';

  var QUESTIONS = [
    {
      id: 'occasion',
      type: 'single',
      title: { de: 'Wobei sollen wir helfen?', en: 'What are we pouring for?' },
      sub: {
        de: 'Der erste Drink des Abends stellt andere Ansprüche als der letzte.',
        en: 'The first drink of the night has a different job than the last one.'
      },
      options: [
        { value: 'aperitif', label: { de: 'Ankommen', en: 'Settling in' }, hint: { de: 'Der Aperitif, der Appetit macht', en: 'An aperitif to open things up' } },
        { value: 'main', label: { de: 'Der Drink für den Abend', en: 'The drink for the evening' }, hint: { de: 'Einer, den man in Ruhe trinkt', en: 'One to sit with for a while' } },
        { value: 'nightcap', label: { de: 'Absacker', en: 'Nightcap' }, hint: { de: 'Kurz, stark, zum Ausklang', en: 'Short, strong, to close' } },
        { value: 'celebration', label: { de: 'Wir feiern was', en: 'We’re celebrating' }, hint: { de: 'Darf gern was hermachen', en: 'Something with presence' } },
        { value: 'shot', label: { de: 'Eine Runde Shots', en: 'A round of shots' }, hint: { de: 'Für den ganzen Tisch', en: 'For the whole table' } }
      ]
    },
    {
      id: 'strength',
      type: 'single',
      title: { de: 'Wie kräftig darf er sein?', en: 'How strong should it be?' },
      sub: {
        de: 'Ehrliche Antwort — wir bauen lieber passend als beeindruckend.',
        en: 'Answer honestly — we would rather build it right than build it impressive.'
      },
      options: [
        { value: '0', label: { de: 'Alkoholfrei', en: 'Zero proof' }, hint: { de: 'Voller Drink, kein Alkohol', en: 'A full drink, no alcohol' } },
        { value: '1', label: { de: 'Leicht & süffig', en: 'Light & easy' }, hint: { de: 'Lang trinkbar', en: 'Made to last' } },
        { value: '2', label: { de: 'Ausgewogen', en: 'Balanced' }, hint: { de: 'Der übliche Cocktail', en: 'A cocktail as you know it' } },
        { value: '3', label: { de: 'Spirituosenbetont', en: 'Spirit-forward' }, hint: { de: 'Kurz, stark, gerührt', en: 'Short, strong, stirred' } }
      ]
    },
    {
      id: 'spirit',
      type: 'multi',
      optional: true,
      skipIf: function (a) { return a.strength === '0'; },
      title: { de: 'Gibt es eine Spirituose, die du magst?', en: 'Any spirit you’re fond of?' },
      sub: {
        de: 'Mehrfachauswahl möglich. Nichts auszuwählen ist auch eine Antwort — dann entscheiden wir.',
        en: 'Pick as many as you like. Picking none is also an answer — then we decide.'
      },
      options: [
        { value: 'gin', label: { de: 'Gin', en: 'Gin' } },
        { value: 'vodka', label: { de: 'Wodka', en: 'Vodka' } },
        { value: 'rum', label: { de: 'Rum', en: 'Rum' } },
        { value: 'cachaca', label: { de: 'Cachaça', en: 'Cachaça' } },
        { value: 'tequila', label: { de: 'Tequila', en: 'Tequila' } },
        { value: 'mezcal', label: { de: 'Mezcal', en: 'Mezcal' } },
        { value: 'whiskey', label: { de: 'Whiskey & Bourbon', en: 'Whiskey & bourbon' } },
        { value: 'pisco', label: { de: 'Pisco', en: 'Pisco' } },
        { value: 'aperitivo', label: { de: 'Aperitivo & Wermut', en: 'Aperitivo & vermouth' } }
      ]
    },
    {
      id: 'avoid',
      type: 'multi',
      optional: true,
      skipIf: function (a) { return a.strength === '0'; },
      title: { de: 'Und eine, die gar nicht geht?', en: 'And one that’s a hard no?' },
      sub: {
        de: 'Was du hier auswählst, kommt garantiert nicht ins Glas.',
        en: 'Anything you pick here will not make it into the glass.'
      },
      options: [
        { value: 'gin', label: { de: 'Kein Gin', en: 'No gin' } },
        { value: 'vodka', label: { de: 'Kein Wodka', en: 'No vodka' } },
        { value: 'rum', label: { de: 'Kein Rum', en: 'No rum' } },
        { value: 'cachaca', label: { de: 'Kein Cachaça', en: 'No cachaça' } },
        { value: 'tequila', label: { de: 'Kein Tequila', en: 'No tequila' } },
        { value: 'mezcal', label: { de: 'Kein Mezcal', en: 'No mezcal' } },
        { value: 'whiskey', label: { de: 'Kein Whiskey', en: 'No whiskey' } },
        { value: 'aperitivo', label: { de: 'Nichts Bitteres', en: 'Nothing bitter' } }
      ]
    },
    {
      id: 'flavour',
      type: 'single',
      title: { de: 'Wohin soll es geschmacklich gehen?', en: 'Which way should it lean?' },
      sub: {
        de: 'Die wichtigste Frage. Alles andere lässt sich drumherum bauen.',
        en: 'The question that matters most. Everything else can be built around it.'
      },
      options: [
        { value: 'citrus', label: { de: 'Zitrus & frisch', en: 'Citrus & fresh' }, hint: { de: 'Limette, Zitrone, wach', en: 'Lime, lemon, wide awake' } },
        { value: 'bitter', label: { de: 'Bitter & komplex', en: 'Bitter & complex' }, hint: { de: 'Campari, Amaro, Wermut', en: 'Campari, amaro, vermouth' } },
        { value: 'herbal', label: { de: 'Kräutrig & grün', en: 'Herbal & green' }, hint: { de: 'Minze, Basilikum, Wacholder', en: 'Mint, basil, juniper' } },
        { value: 'fruity', label: { de: 'Fruchtig & tropisch', en: 'Fruity & tropical' }, hint: { de: 'Maracuja, Beere, Ananas', en: 'Passion fruit, berry, pineapple' } },
        { value: 'rich', label: { de: 'Süß & cremig', en: 'Rich & creamy' }, hint: { de: 'Kaffee, Schokolade, Vanille', en: 'Coffee, chocolate, vanilla' } },
        { value: 'smoky', label: { de: 'Rauchig & würzig', en: 'Smoky & spiced' }, hint: { de: 'Mezcal, Ingwer, Zimt', en: 'Mezcal, ginger, cinnamon' } },
        { value: 'spirit', label: { de: 'Puristisch', en: 'Purist' }, hint: { de: 'Kaum Saft, viel Spirituose', en: 'Barely any juice, mostly spirit' } }
      ]
    },
    {
      id: 'texture',
      type: 'single',
      optional: true,
      title: { de: 'Wie soll er im Glas ankommen?', en: 'How should it turn up?' },
      sub: {
        de: 'Die Form entscheidet mit, wie lange ein Drink hält.',
        en: 'The shape of a drink decides how long it lasts.'
      },
      options: [
        { value: 'long', label: { de: 'Lang & auf Eis', en: 'Long & over ice' }, hint: { de: 'Hält den ganzen Abend', en: 'Lasts the evening' } },
        { value: 'short', label: { de: 'Kurz & klar', en: 'Short & clean' }, hint: { de: 'Gerührt, konzentriert', en: 'Stirred, concentrated' } },
        { value: 'frothy', label: { de: 'Geschüttelt & seidig', en: 'Shaken & silky' }, hint: { de: 'Mit Schaumkrone', en: 'With a head of foam' } },
        { value: 'sparkling', label: { de: 'Mit Perlage', en: 'With bubbles' }, hint: { de: 'Prosecco oder Soda', en: 'Prosecco or soda' } },
        { value: 'hot', label: { de: 'Heiß', en: 'Hot' }, hint: { de: 'Für kalte Abende am Wasser', en: 'For cold nights on the water' } }
      ]
    },
    {
      id: 'adventure',
      type: 'single',
      title: { de: 'Klassiker oder Experiment?', en: 'Classic or experiment?' },
      sub: {
        de: 'Es gibt keine falsche Antwort. Der beste Drink ist der, den du wirklich willst.',
        en: 'There is no wrong answer here. The best drink is the one you actually want.'
      },
      options: [
        { value: '0', label: { de: 'Gib mir einen Klassiker', en: 'Give me a classic' }, hint: { de: 'Etwas, das ich kenne', en: 'Something I already know' } },
        { value: '2', label: { de: 'Zeig mir was Neues', en: 'Show me something new' }, hint: { de: 'Gern eine Hauskreation', en: 'A house creation, ideally' } },
        { value: '3', label: { de: 'Überrasch mich', en: 'Surprise me' }, hint: { de: 'Barkeeper entscheidet', en: 'Bartender’s call' } }
      ]
    },
    {
      id: 'avoidFlags',
      type: 'multi',
      optional: true,
      title: { de: 'Sollen wir etwas weglassen?', en: 'Anything we should leave out?' },
      sub: {
        de: 'Wichtig: Bitte sag uns Allergien immer auch direkt am Tresen.',
        en: 'Important: please also tell us about allergies in person at the bar.'
      },
      options: [
        { value: 'egg', label: { de: 'Kein Eiweiß', en: 'No egg white' }, hint: { de: 'Wir schäumen pflanzlich', en: 'We foam plant-based instead' } },
        { value: 'dairy', label: { de: 'Keine Milchprodukte', en: 'No dairy' } },
        { value: 'nuts', label: { de: 'Keine Nüsse', en: 'No nuts' }, hint: { de: 'Amaretto, Frangelico, Mandel', en: 'Amaretto, Frangelico, almond' } },
        { value: 'coffee', label: { de: 'Kein Koffein', en: 'No caffeine' } }
      ]
    }
  ];

  // ---------------------------------------------------------------- copy ---
  var UI = {
    de: {
      kicker: 'BrunnenBar Augsburg',
      title: 'Der digitale Barkeeper',
      lede: 'Ein paar kurze Fragen — dieselben, die wir am Tresen stellen würden. Am Ende stehen drei Drinks von unserer Karte, die zu dir passen.',
      start: 'Los geht’s',
      fullCard: 'Zur ganzen Cocktailkarte',
      back: 'Zurück',
      next: 'Weiter',
      skip: 'Egal / überspringen',
      step: 'Frage {n} von {total}',
      results: 'Das würden wir dir einschenken',
      resultsSub: 'Zeig dieses Ergebnis gern einfach dem Team am Tresen.',
      topPick: 'Unsere Empfehlung',
      alsoGood: 'Passt ebenfalls',
      match: '{n}% Übereinstimmung',
      why: 'Warum dieser Drink',
      house: 'Hauskreation',
      zeroProof: 'Alkoholfrei',
      naAvailable: 'Gibt’s auch alkoholfrei',
      restart: 'Nochmal von vorn',
      moreOptions: 'Weitere Vorschläge zeigen',
      ingredients: 'Drin ist',
      served: 'Serviert im',
      empty: 'Bei dieser Kombination wird es eng.',
      emptySub: 'Das ist kein Problem — komm einfach an den Tresen, dann bauen wir dir etwas Eigenes.',
      loosened: 'Wir haben eine Vorgabe gelockert, um dir trotzdem etwas anbieten zu können.',
      langLabel: 'Sprache',
      footer: 'Alle Drinks werden frisch gebaut. Allergien bitte immer direkt beim Team melden.',
      reasons: {
        occasion: 'passt zu diesem Moment im Abend',
        strength_exact: 'trifft genau deine gewünschte Stärke',
        strength_near: 'liegt nah an deiner gewünschten Stärke',
        spirit: 'basiert auf {x}',
        flavour: 'geht klar in Richtung {x}',
        texture: 'kommt so ins Glas, wie du es wolltest',
        classic: 'ein Klassiker, den viele kennen',
        newish: 'weniger bekannt, dafür spannend',
        house: 'eine Kreation aus unserem Haus',
        zero: 'komplett alkoholfrei gebaut',
        safe: 'ohne die Zutaten, die du ausgeschlossen hast'
      },
      spiritNames: {
        gin: 'Gin', vodka: 'Wodka', rum: 'Rum', cachaca: 'Cachaça', tequila: 'Tequila',
        mezcal: 'Mezcal', whiskey: 'Whiskey', pisco: 'Pisco', aperitivo: 'Aperitivo', none: 'alkoholfreien Zutaten'
      },
      flavourNames: {
        citrus: 'Zitrus', bitter: 'bitter', herbal: 'kräutrig', fruity: 'fruchtig',
        rich: 'süß & cremig', smoky: 'rauchig', spirit: 'puristisch'
      }
    },
    en: {
      kicker: 'BrunnenBar Augsburg',
      title: 'The digital bartender',
      lede: 'A few short questions — the same ones we would ask across the bar. At the end you get three drinks from our card that suit you.',
      start: 'Start',
      fullCard: 'See the full cocktail list',
      back: 'Back',
      next: 'Next',
      skip: 'No preference / skip',
      step: 'Question {n} of {total}',
      results: 'This is what we’d pour you',
      resultsSub: 'Feel free to just show this screen to the team at the bar.',
      topPick: 'Our recommendation',
      alsoGood: 'Also a good fit',
      match: '{n}% match',
      why: 'Why this one',
      house: 'House creation',
      zeroProof: 'Zero proof',
      naAvailable: 'Available alcohol-free',
      restart: 'Start over',
      moreOptions: 'Show more suggestions',
      ingredients: 'What’s in it',
      served: 'Served in',
      empty: 'That combination gets tight.',
      emptySub: 'Not a problem — come to the bar and we’ll build you something off-menu.',
      loosened: 'We relaxed one preference so we could still offer you something.',
      langLabel: 'Language',
      footer: 'Every drink is built to order. Please always tell the team about allergies in person.',
      reasons: {
        occasion: 'fits this point in the evening',
        strength_exact: 'hits exactly the strength you asked for',
        strength_near: 'sits close to the strength you asked for',
        spirit: 'built on {x}',
        flavour: 'leans clearly {x}',
        texture: 'arrives the way you wanted it',
        classic: 'a classic most people know',
        newish: 'less familiar, more interesting',
        house: 'one of our own creations',
        zero: 'built completely alcohol-free',
        safe: 'free of everything you ruled out'
      },
      spiritNames: {
        gin: 'gin', vodka: 'vodka', rum: 'rum', cachaca: 'cachaça', tequila: 'tequila',
        mezcal: 'mezcal', whiskey: 'whiskey', pisco: 'pisco', aperitivo: 'aperitivo', none: 'alcohol-free ingredients'
      },
      flavourNames: {
        citrus: 'citrus-forward', bitter: 'bitter', herbal: 'herbal', fruity: 'fruity',
        rich: 'rich and creamy', smoky: 'smoky', spirit: 'purist'
      }
    }
  };

  var api = { QUESTIONS: QUESTIONS, UI: UI };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBQuestions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
