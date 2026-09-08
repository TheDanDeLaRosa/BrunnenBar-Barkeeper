# Was die App zusätzlich aus dem Menu API braucht

Stand 07.09.2026. Antwort auf das Menu API Brief.

Der Loader ist gebaut und liest die eine Quelle so, wie das Brief es
vorschreibt. Was noch fehlt, sind vier Felder pro Getränk. Ohne sie können drei
der sieben Fragen nichts bewerten, weil die Karte nicht sagt, wonach etwas
schmeckt.

Alle vier Felder gab es im vorherigen BarPatrol Export schon. Die Werte unten
sind exakt die, die dort standen. Es geht also nicht darum, etwas Neues zu
erfinden, sondern darum, Vorhandenes wieder mitzuliefern.

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
Vorschlägen genommen. Grund ist Rosato Spritz aus dem letzten Export, dort
stand `alcohol_free: true` bei Stärke 1 und einem Rezept mit Ramazzotti Rosato,
also rund 15 Prozent. Die sichere Lesart von vielleicht alkoholisch ist
alkoholisch.

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

## Die Werte müssen niemand neu vergeben

Alle vier Felder stehen für alle 148 Getränke schon im letzten BarPatrol
Export. Sie sind auf dem Weg ins Menu API verloren gegangen, nicht nie erhoben
worden. Es ist also kein Taggen von Hand, sondern ein Durchreichen.

`docs/menu-api-feldwerte.json` enthält genau diese Werte, fertig zum Mitgeben.
Die Datei ist nach dem Getränkenamen aufgeschlüsselt und hat pro Getränk nur
die Felder, die dem API noch fehlen.

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

Erzeugt wird sie mit `node tools/export-missing-fields.js`. Drei Sachen werden
dabei repariert und jede einzelne wird beim Lauf gemeldet.

- `Spaeter Abend` wird zu `Später Abend`, betrifft nur Don Julio Anejo
  Manhattan. Ohne den Umlaut war der Drink über die erste Frage gar nicht
  erreichbar.
- `kraeftig` fällt weg, weil die Stärke schon im eigenen Feld steht, und
  `bitter-suess` wird zu `bitter` und `süß`. Betrifft denselben Drink.
- Rosato Spritz wird gemeldet, weil `alcohol_free` true ist bei Stärke 1. Der
  Wert wird nicht angefasst, das gehört in die Karte entschieden.

`holzig` bleibt drin, weil es sinnvoll ist. Wenn Gäste danach fragen können
sollen, sagt Bescheid, dann bekommt es eine eigene Antwortmöglichkeit.

### Zusammenführen, mit menu.json als Wahrheit

`menu.json` ist die genaue Quelle. Namen, Preise, Sektionen, Reihenfolge und
was überhaupt auf der Karte steht, kommt von dort und wird nicht angefasst. Der
alte Export dient nur zum Nachschlagen der vier Werte.

```bash
node tools/merge-fields.js pfad/zu/menu.json menu.merged.json
```

Die Eingabedatei wird nie verändert, das Ergebnis landet in einer neuen Datei,
damit vor dem Veröffentlichen jemand drübersehen kann.

Was das Werkzeug tut und was nicht.

- Es füllt ein Feld nur, wenn es leer ist. Steht im `menu.json` schon ein Wert,
  gilt der und wird gemeldet.
- Es fasst nur Getränke mit Zutatenliste an. Bier und Wein brauchen die Felder
  nicht und tauchen deshalb auch nicht als Lücke auf.
- Es rät nie. Weicht ein Name ab, schlägt es den nächstliegenden vor und lässt
  das Feld leer, bis jemand entschieden hat.

Genau das passiert bei drei Namen, die im alten Export nach Tippfehlern
aussehen. Stehen sie im `menu.json` richtig, findet der Abgleich sie nicht von
allein und meldet sie als Vorschlag.

| Im Export | Auf der Karte vermutlich |
|---|---|
| `Boulvadier` | Boulevardier |
| `Don Julio Reposado Margerita` | Margarita |
| `Gin Tonic - Hendriks` | Hendrick's |

Getränke, die es im Export nicht gab, werden als offen gemeldet. Für die müssen
die vier Werte einmal vergeben werden, alles andere ist ein Durchreichen.

---

Sobald das live ist, sagt Bescheid. Die App zieht die Felder dann ohne weitere
Änderung, und der Loader meldet beim Start, wenn bei einem Getränk etwas fehlt.
