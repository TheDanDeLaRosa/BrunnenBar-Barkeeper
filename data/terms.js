/*
 * BrunnenBar — English terms for the parts of the card that are not voice
 * =========================================================================
 * The export is German only. Two kinds of German text reach a guest:
 *
 *   1. THE BAR'S VOICE  — taglines and bartender notes. These are written
 *      by the house and are NOT translated here. If English versions are
 *      wanted they have to be written by someone in the house voice; add
 *      `tagline_en` / `bartender_note_en` to the export and the build picks
 *      them up automatically.
 *
 *   2. PLAIN NOUNS      — ingredients and glassware. "Zitrone" is a lemon in
 *      any voice, so translating these is safe and is what this file does.
 *
 * Brand and product names are deliberately absent: Aperol is Aperol, and a
 * term with no entry here falls through unchanged. The build reports any
 * ingredient or glass it cannot account for, so a new export cannot quietly
 * put German back in front of an English-speaking guest.
 * =========================================================================
 */
(function (root) {
  'use strict';

  // Ingredients. Only the German common nouns need entries.
  var ING_EN = {
    'Agave': 'Agave',
    'Ahornsirup': 'Maple syrup',
    'Ananas': 'Pineapple',
    'Apfel': 'Apple',
    'Aprikose': 'Apricot',
    'Basilikum': 'Basil',
    'Cranberry': 'Cranberry',
    'Eiweiss': 'Egg white',
    'Erdbeere': 'Strawberry',
    'Gin oder Wodka': 'Gin or vodka',
    'Granatapfel': 'Pomegranate',
    'Grapefruit': 'Grapefruit',
    'Gurke': 'Cucumber',
    'Haselnusslikör': 'Hazelnut liqueur',
    'Heidelbeeren': 'Blueberries',
    'Himbeere': 'Raspberry',
    'Himbeeren': 'Raspberries',
    'Holunderblüte': 'Elderflower',
    'Johannisbeere': 'Blackcurrant',
    'Kakao': 'Cocoa',
    'Kirsche': 'Cherry',
    'Kirschen': 'Cherries',
    'Kokos': 'Coconut',
    'Limette': 'Lime',
    'Mandelsirup': 'Almond syrup',
    'Maracuja': 'Passion fruit',
    'Marillenschnaps': 'Apricot schnapps',
    'Milch': 'Milk',
    'Mineralwasser': 'Sparkling water',
    'Minze': 'Mint',
    'Oliven': 'Olives',
    'Orange': 'Orange',
    'Orangensaft': 'Orange juice',
    'Pfirsichlikör': 'Peach liqueur',
    'Rhabarber': 'Rhubarb',
    'Roter Wermut': 'Sweet vermouth',
    'Sahne': 'Cream',
    'Salz': 'Salt',
    'Soda': 'Soda',
    'Trauben': 'Grapes',
    'Vanille': 'Vanilla',
    'Wodka': 'Vodka',
    'Zimt': 'Cinnamon',
    'Zitrone': 'Lemon',
    'Zucker': 'Sugar',
    'Zuckerwatte': 'Candy floss',
    'alkoholfreie Cachaça': 'Alcohol-free cachaça',
    'alkoholfreier Gin': 'Alcohol-free gin',
    'alkoholfreier Rum': 'Alcohol-free rum',
    'alkoholfreier Sekt': 'Alcohol-free sparkling wine',
    'alkoholfreier Wodka': 'Alcohol-free vodka',
    'frischer Espresso': 'Fresh espresso',
    'nach Absprache': 'However you like it',
    'roter Wermut': 'Sweet vermouth',
    'trockener Wermut': 'Dry vermouth'
  };

  // Glassware.
  var GLASS_EN = {
    'Ballonglas': 'Balloon glass',
    'Becher': 'Julep cup',
    'Coupe': 'Coupe',
    'Coupe mit Prosecco Sidecar': 'Coupe with a prosecco sidecar',
    'Coupe mit Sidecar': 'Coupe with a sidecar',
    'Henkelglas': 'Mug',
    'Highball': 'Highball',
    'Hurricane': 'Hurricane glass',
    'Kupferbecher': 'Copper mug',
    'Shotglas': 'Shot glass',
    'Tumbler': 'Tumbler',
    'Weinglas': 'Wine glass',
    'je nach Drink': 'Depends on the drink'
  };

  /* Brand and product names, listed so the build can tell "deliberately not
   * translated" apart from "nobody has looked at this yet". */
  var PASSTHROUGH = [
    'Absolut', 'Amaretto', 'Amaro', 'Angostura', 'Aperol', 'Asbach Uralt',
    'Augsburg City Wodka', 'August Gin', 'Bacardi', 'Baileys', 'Berliner Luft',
    'Blue Curaçao', 'Bombay Sapphire', 'Bourbon', 'Bulleit Bourbon', 'Bénédictine',
    'Cachaça', 'Campari', 'Club Mate', 'Cointreau', 'Cola', 'Crème de Mûre',
    'Don Julio Anejo', 'Don Julio Añejo', 'Don Julio Blanco', 'Don Julio Reposado',
    'El Destilador Blanco', 'Ficken Likör', 'Four Roses', 'Frangelico',
    'Freixenet 0,0', 'Fresco Aperitivo', 'Fugger Gin', 'Gin', 'Grand Marnier',
    'Havana Club', "Hendrick's", 'Irish Whiskey', "Jack Daniel's",
    'Johnnie Walker Black', 'Jägermeister', 'Kahlúa', 'Ketel One', 'Lillet',
    'Lillet Blanc', 'Limoncello', 'Malibu', 'Martini Floreale', 'Martini Vibrante',
    'Mezcal', 'Orange Bitters', 'Orgeat', 'Pfeffi', 'Pisco', 'Prosecco',
    'Red Bull', 'Rosato Aperitivo', 'Rum', 'RumChata', 'Sambuca', 'Sarti Rosa',
    'Schweppes Berry', 'Schweppes White Peach', 'Sprite', 'St. Germain', 'Tajín',
    'Talisker', 'Tanqueray', 'Tanqueray 0.0', 'Tanqueray No. Ten', 'Tequila',
    'Thomas Henry Cherry Blossom', 'Thomas Henry Pink Grapefruit',
    'Thomas Henry Spicy Ginger', 'Tonic Water', 'Vodka', 'Whiskey', 'Zacapa 23'
  ];

  function ingredient(term, lang) {
    return lang === 'en' && ING_EN[term] ? ING_EN[term] : term;
  }
  function glass(term, lang) {
    return lang === 'en' && GLASS_EN[term] ? GLASS_EN[term] : term;
  }

  var api = {
    ING_EN: ING_EN, GLASS_EN: GLASS_EN, PASSTHROUGH: PASSTHROUGH,
    ingredient: ingredient, glass: glass
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBTerms = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
