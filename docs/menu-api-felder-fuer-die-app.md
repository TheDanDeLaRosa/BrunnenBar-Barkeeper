# Was die App zusätzlich aus dem Menu API braucht

Stand 08.09.2026. Antwort auf das zweite Menu API Brief vom Website Seat.

Der Loader liest die eine Quelle so, wie das Brief es vorschreibt. Stündlich
höchstens, Abgleich über `content_hash`, `hidden_on_card` bleibt beim Gast
draußen, `menu_class` und `pos_sku` sind intern, `image` kann `null` sein. Das
ist alles eingebaut und getestet.

Was weiterhin fehlt, sind vier Felder pro Getränk. Sie standen nicht in der
ersten Feldliste und stehen auch nicht in der zweiten. Ohne sie können drei der
sieben Fragen nichts bewerten, weil die Karte nicht sagt, wonach etwas schmeckt,
wie es serviert wird und wann am Abend es passt.

Alle vier gab es im BarPatrol Export schon. Die Werte unten sind exakt die, die
dort standen. Es geht also nicht darum, etwas Neues zu erfinden, sondern darum,
Vorhandenes wieder mitzuliefern.

Die Felder gehören an die Quelle, nicht in eine App. Dann haben die Cocktail
App, die Tequila App und die Whiskey App sie gleichzeitig.

---

## 1. `flavour_tags` und `flavour_tags_en`

Typ `string[]`. Ohne dieses Feld hat die Frage "Wonach soll er schmecken"
nichts zum Abgleichen.

Erlaubtes Vokabular, deutsch und englisch in gleicher Reihenfolge:

| de | en |
|---|---|
| `süß` | `sweet` |
| `prickelnd` | `sparkling` |
| `fruchtig` | `fruity` |
| `sauer/zitrus` | `sour/citrus` |
| `bitter` | `bitter` |
| `kräuterig/frisch` | `herbal/fresh` |
| `cremig` | `creamy` |
| `kaffee` | `coffee` |
| `rauchig` | `smoky` |
| `salzig` | `salty` |
| `scharf` | `spicy` |
| `überraschend` | `surprising` |

Wichtig, mit Umlauten schreiben. Im letzten Export tauchten bei einem einzigen
Drink `kraeftig`, `holzig` und `bitter-suess` auf. Die passen zu nichts und
gehören zusammengeführt.

- `kraeftig` fällt weg, die Stärke steht schon im Stärkefeld
- `bitter-suess` wird zu `bitter` und `süß`
- `holzig` ist neu und sinnvoll. Wenn es bleiben soll, sag Bescheid, dann
  bekommt es eine eigene Antwortmöglichkeit in der App

## 2. `serve_style` und `serve_style_en`

Typ `string`. Ohne dieses Feld hat die Frage "Wie soll er ankommen" nichts zum
Abgleichen.

Erlaubte Werte, wie im alten Export:

`Highball`, `Sour`, `Spritz`, `Shot`, `Shaken`, `Stirred`, `Frozen`,
`Muddled`, `Built`, `Sling`, `Fizz`, `Hot`, `Julep`, `Bartender's Choice`

## 3. `moment` und `moment_en`

Typ `string[]`, ein Getränk kann zu mehreren Momenten passen. Ohne dieses Feld
hat die erste Frage nichts zum Abgleichen.

| de | en |
|---|---|
| `Auftakt` | `Opener` |
| `Mittendrin` | `Midway` |
| `Später Abend` | `Late night` |
| `Ganzer Abend` | `All evening` |

`Später Abend` mit Umlaut. Im letzten Export stand bei einem Drink
`Spaeter Abend`, dadurch war er über die Frage gar nicht erreichbar.

## 4. `strength_level`

Typ `number`, 0 bis 5. Das jetzige `strength` mit `mild`, `mittel`, `stark`
reicht nicht, weil der Regler in der App sechs Stufen hat und `alcohol_free`
allein den Unterschied zwischen leicht und alkoholfrei nicht abbildet.

| level | label |
|---|---|
| 0 | alkoholfrei |
| 1 | leicht |
| 2 | mild |
| 3 | mittel |
| 4 | kräftig |
| 5 | stark |

Das bisherige `strength` kann bleiben, es stört nicht.

**Regel, die die App durchsetzt.** Ein Getränk gilt nur dann als alkoholfrei,
wenn `alcohol_free` true ist **und** `strength_level` 0 ist. Widersprechen sich
die beiden, wird es als alkoholhaltig behandelt und aus den alkoholfreien
Vorschlägen genommen. Die sichere Lesart von vielleicht alkoholisch ist
alkoholisch.

### Was auf der Karte fehlt, wenn es das gibt

**Alkoholfreie Shots.** Auf der Karte steht kein einziger. Wer in der App eine
Runde Shots und alkoholfrei antippt, bekommt deshalb alkoholfreie Longdrinks
angeboten, mit einem Hinweis, dass wir alkoholfreie Shots gerade nicht haben.

Tanqueray 0.0 und alkoholfreie Cachaça sind in den Rezepten längst drin, es
gibt sie also im Haus. Wenn ein 2cl Tanqueray 0.0 und ein 2cl Pitú 0.0
bestellbar sind, gehören sie als eigene Positionen auf die Karte, mit
`serve_style` auf `Shot`, `alcohol_free` auf true und `strength_level` auf 0.

Dann fällt der Hinweis in der App von allein weg und die beiden werden ganz
normal empfohlen. In der App ist dafür nichts zu ändern.

### Eine Änderung, die an die Quelle gehört

**Rosato Spritz bekommt `alcohol_free: false`.** Entschieden von Dan am
08.09.2026. Der Drink stand mit `alcohol_free: true` bei Stärke 1 in der Karte,
im Rezept steckt aber Ramazzotti Rosato mit rund 15 Prozent. Er ist also nicht
alkoholfrei und darf niemandem angeboten werden, der genau danach fragt.

Die App schreibt nichts zurück, deshalb muss das im Generator passieren. Bis es
dort steht, behandelt die App ihn ohnehin als alkoholhaltig, die Regel oben
greift. Danach greift sie nicht mehr, weil es keinen Widerspruch mehr gibt.

`strength_level` bleibt bei 1, das stimmt.

---

## Optional, aber die Ergebniskarte zeigt es

`glass` und `glass_en`, Typ `string`. Zum Beispiel `Coupe`, `Tumbler`,
`Kupferbecher`, `Weinglas`. Gab es im alten Export, fehlt jetzt. Ohne das Feld
lässt die App die Zeile "Serviert im" einfach weg.

---

## Was die App nicht braucht

Kein Filtern nach Verfügbarkeit, das Brief sagt klar, dass alles in der Datei
bestellbar ist.

Keine Sektionsnamen im Code. Ob ein Eintrag ein Cocktail ist, entscheidet die
App daran, ob `ingredients` gefüllt ist. Bier und Wein haben dort eine leere
Liste und werden deshalb nie als Empfehlung ausgegeben, bleiben aber in den
Daten. Wenn ihr Sektionen umbenennt oder neue anlegt, muss dafür nichts
angepasst werden.

---

## Zum Nachprüfen

Wenn die Felder drin sind, reicht ein Blick auf einen Cocktail. So sieht ein
vollständiger Eintrag aus:

```json
{
  "name": "Whiskey Sour",
  "name_en": "Whiskey Sour",
  "ingredients": ["Four Roses", "Zitrone", "Zucker", "Eiweiss"],
  "ingredients_en": ["Four Roses", "Lemon", "Sugar", "Egg white"],

  "flavour_tags": ["sauer/zitrus", "cremig"],
  "flavour_tags_en": ["sour/citrus", "creamy"],
  "serve_style": "Sour",
  "serve_style_en": "Sour",
  "moment": ["Mittendrin"],
  "moment_en": ["Midway"],
  "strength_level": 4,
  "glass": "Tumbler",
  "glass_en": "Tumbler",

  "strength": "stark",
  "alcohol_free": false,
  "allergens": ["Ei"],
  "allergens_en": ["Egg"],
  "allergen_codes": [3]
}
```

---

## Die Werte muss niemand neu vergeben

Alle vier Felder stehen für alle 148 Getränke schon im letzten BarPatrol
Export. Sie sind auf dem Weg ins Menu API verloren gegangen, nicht nie erhoben
worden. Es ist also kein Taggen von Hand, sondern ein Durchreichen.

`docs/menu-api-feldwerte.json` enthält genau diese Werte, nach Getränkenamen
aufgeschlüsselt, mit nur den Feldern, die dem API fehlen.

```json
"Whiskey Sour": {
  "flavour_tags": ["sauer/zitrus", "cremig"],
  "flavour_tags_en": ["sour/citrus", "creamy"],
  "serve_style": "Sour",
  "serve_style_en": "Sour",
  "moment": ["Mittendrin"],
  "moment_en": ["Midway"],
  "strength_level": 4,
  "glass": "Tumbler",
  "glass_en": "Tumbler"
}
```

Das ist eine Vorlage für den Generator, keine Datei, die irgendwohin
hochgeladen wird. Das Brief ist da eindeutig, es gibt genau eine Quelle und
keinen Upload. `node tools/merge-fields.js menu.json` dient nur zum Nachsehen,
was nach dem Ergänzen noch offen wäre, und schreibt in eine neue Datei.

Drei Sachen sind beim Erzeugen repariert worden und werden bei jedem Lauf
gemeldet.

- `Spaeter Abend` wird zu `Später Abend`. Ohne den Umlaut war Don Julio Anejo
  Manhattan über die erste Frage gar nicht erreichbar.
- `kraeftig` fällt weg, weil die Stärke ihr eigenes Feld hat, und
  `bitter-suess` wird zu `bitter` und `süß`. Betrifft denselben Drink.
- Rosato Spritz wurde gemeldet, weil `alcohol_free` true stand bei Stärke 1 mit
  Ramazzotti Rosato im Rezept. Das ist inzwischen entschieden, der Wert kommt
  weg, siehe oben.

`holzig` bleibt drin, weil es sinnvoll ist. Wenn Gäste danach fragen können
sollen, sagt Bescheid, dann bekommt es eine eigene Antwortmöglichkeit.

### Namen, die beim Abgleich auffallen

Drei Namen sehen im alten Export nach Tippfehlern aus. Wenn sie im Menu API
richtig stehen, findet ein Abgleich über den Namen sie nicht von allein.

| Im Export | Auf der Karte vermutlich |
|---|---|
| `Boulvadier` | Boulevardier |
| `Don Julio Reposado Margerita` | Margarita |
| `Gin Tonic - Hendriks` | Hendrick's |

Der Export hatte 148 Einträge, das Menu API führt 193 Positionen. Für alles, was
im Export nicht vorkam, müssen die vier Werte einmal vergeben werden.

---

Sobald das live ist, sagt Bescheid. Die App zieht die Felder dann ohne weitere
Änderung, und der Loader meldet beim Start, wenn bei einem Getränk etwas fehlt.
