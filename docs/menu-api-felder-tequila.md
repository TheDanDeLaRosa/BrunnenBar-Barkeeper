# Was die Agave App zusätzlich aus dem Menu API braucht

Stand 08.09.2026. Gegenstück zu `menu-api-felder-fuer-die-app.md`, für den
Tequila und Mezcal Empfehler unter `/tequila/`.

Die App liest ausschliesslich die eine Quelle und ist damit fertig gebaut. Sie
läuft auch ohne die Felder unten, sie kann dann nur weniger. Was sie heute
schon kann, leitet sie aus `name`, `group` und den `ingredients` Listen ab.
Das funktioniert, solange die Flaschen so heissen wie sie heissen, und genau
das ist die Schwäche.

**Wichtig vorab.** Gebaut wurde gegen das dokumentierte Schema, nicht gegen die
echte Antwort. Aus der Build Umgebung ist `brunnenbar.com` gesperrt. Der erste
Lauf gegen die Live Daten gehört angeschaut, Abschnitt "Zum Nachprüfen" sagt
worauf.

---

## Teil 1, drei Felder die Fragen freischalten

### 1. `strength` auch bei den puren Flaschen

Typ `string`, Werte `mild`, `mittel`, `stark`.

Bei Cocktails ist das Feld gefüllt. Bei einer puren Flasche vermutlich nicht,
und dann bewertet die Stärkefrage ausgerechnet die Positionen nicht, für die
es die App gibt. Die App rät nichts und bestraft nichts, die Flasche taucht
weiter auf, sie lässt sich über die Frage nur nicht sortieren.

Für einen puren Brand ist `stark` fast immer richtig, aber das ist eine
Entscheidung der Bar und keine der App.

### 2. `flavour_tags` und `flavour_tags_en`

Typ `string[]`. Dasselbe Feld, das die Cocktail App schon angefragt hat, und
aus demselben Grund. Ohne das Feld hat die Frage "Wonach soll es schmecken"
nichts Verlässliches.

Was die App bis dahin tut, steht in `tequila/assets/agave.js`. Sie liest
`Limette` als sauer und `Campari` als bitter, aus einer offenen Wortliste, und
nennt auf der Ergebniskarte immer die Zutat mit, aus der sie das gelesen hat.
Prüfbar für den Gast, aber eben abgeleitet.

**Bei puren Flaschen bringt die Ableitung nichts.** Keine Zutatenliste, kein
Geschmack. Ein Blanco und ein Añejo schmecken für die App heute gleich, und
das ist der eigentliche Verlust.

Vokabular wie bei den Cocktails, deutsch mit Umlauten:
`süß`, `prickelnd`, `fruchtig`, `sauer/zitrus`, `bitter`, `kräuterig/frisch`,
`cremig`, `rauchig`, `salzig`, `scharf`, `überraschend`.

Für Agave zusätzlich sinnvoll und heute nicht abbildbar:
`pfeffrig`, `vegetal`, `mineralisch`, `holzig`, `vanille`, `karamell`.

### 3. `abv`

Typ `number`, Volumenprozent, zum Beispiel `38`.

Drei Stärkeworte beschreiben einen Cocktail. Bei einer puren Flasche will ein
Gast eine Zahl, und die steht ohnehin auf der Flasche.

---

## Teil 2, drei Felder die aus der App einen Kenner machen

Die App liest das heute aus dem Flaschennamen. Das geht gut, solange
`Don Julio Reposado` so heisst. Es geht schief bei `Don Julio 1942`, bei
`Casa Dragones Joven` und bei jeder Flasche, deren Name den Stil nicht
ausspricht.

### 4. `agave_expression`

Typ `string`, leer erlaubt. Werte `blanco`, `reposado`, `anejo`,
`extra-anejo`, `cristalino`.

Ohne Umlaut und ohne Tilde, als Schlüssel. Die App zeigt dem Gast
`Añejo` mit Tilde, das ist Anzeigetext und steht in der App.

### 5. `agave_kind`

Typ `string`. Werte `tequila`, `mezcal`, `sotol`, `raicilla`, `bacanora`.

### 6. `brand`

Typ `string`, zum Beispiel `Don Julio`. Heute rät die App das aus dem Namen
und trifft damit die Marken, die sie kennt. Eine neue Marke kennt sie erst,
wenn jemand sie in `tequila/assets/agave.js` einträgt.

Wenn ihr die drei Felder liefert, verschwindet die Ratearbeit vollständig und
die App liest sie einfach.

---

## Teil 3, was einen Tequila Empfehler richtig gut machen würde

Nichts davon ist heute in der Quelle und nichts davon blockiert etwas. In der
Reihenfolge, in der ein Gast danach fragt.

| Feld | Typ | Warum |
|---|---|---|
| `agave_region` | `string` | `Los Altos` oder `Valles`. Hochland ist fruchtiger, Tiefland erdiger. Der erste Unterschied, den ein Gast schmeckt |
| `aged_months` | `number` | Reposado und Añejo sind Spannen, keine Punkte. Acht Monate und vierzehn Monate sind zwei verschiedene Flaschen |
| `additive_free` | `boolean` | Die Frage, die Tequila Trinker seit zwei Jahren zuerst stellen |
| `nom` | `string` | Die Destillerienummer. Sagt, welche Flaschen aus demselben Haus kommen |
| `still` | `string` | `Kupfer`, `Edelstahl`, `Tahona`. Für die Neugierigen |

Mein Vorschlag: `agave_region` und `additive_free` zuerst. Die beiden
beantworten zusammen die häufigste Frage am Tresen und sind pro Flasche in
einer Minute nachgeschlagen.

---

## Was gut ist wie es ist

`prices` mit Grössen deckt 2 cl und 4 cl sauber ab, die App zeigt beide.
`allergens` und `allergen_codes` reichen für die harte Regel. `popularity_rank`
reicht für den Bestseller Hinweis. Die Reihenfolge der Sektionen wird nicht
angefasst.

Sektionsnamen braucht die App nicht und nutzt sie nicht. Ob etwas Agave ist
entscheidet sie an Spirituosen und Markennamen in `name`, `group` und
`ingredients`. Ihr könnt Sektionen umbenennen, zusammenlegen oder neu anlegen,
ohne dass an der App etwas angepasst werden muss. Ein Test benennt in der
Testkarte jede Sektion um und prüft, dass sich nichts ändert.

---

## Zum Nachprüfen

Beim ersten Lauf gegen die echten Daten sind das die vier Dinge, die auffallen
würden.

1. **Stehen die puren Flaschen überhaupt in der Karte.** Wenn es keine Sektion
   mit puren Agavenbränden gibt, empfiehlt die App nur die Agave Cocktails.
   Sie funktioniert, aber sie kann dann die Hälfte von dem nicht, wofür sie
   gebaut ist.
2. **Ist `strength` bei den puren Flaschen leer.** Siehe Feld 1.
3. **Schreibt die Karte `Añejo` oder `Anejo`.** Beides wird erkannt, die App
   normalisiert Tilde und Umlaut. Im letzten Cocktail Export standen beide
   Schreibweisen nebeneinander, einheitlich wäre trotzdem besser.
4. **Taucht `&amp;` irgendwo auf.** Dann ist die Publishing Pipeline kaputt.
   Der Loader meldet das und repariert bewusst nichts.

So sähe eine vollständige pure Flasche aus.

```json
{
  "name": "Don Julio Reposado",
  "name_en": "Don Julio Reposado",
  "group": "Tequila",
  "group_en": "Tequila",
  "price": 9.5,
  "prices": [{ "size": "2 cl", "price": 9.5 }, { "size": "4 cl", "price": 17.0 }],
  "description": "Acht Monate im Fass, weich und warm.",
  "description_en": "Eight months in oak, soft and warm.",
  "ingredients": [],
  "ingredients_en": [],

  "strength": "stark",
  "abv": 38,
  "flavour_tags": ["süß", "holzig", "vanille"],
  "flavour_tags_en": ["sweet", "woody", "vanilla"],
  "agave_kind": "tequila",
  "agave_expression": "reposado",
  "brand": "Don Julio",

  "allergens": [],
  "allergens_en": [],
  "allergen_codes": [],
  "alcohol_free": false,
  "pos_sku": "T2",
  "hidden_on_card": false,
  "on_printed_menu": true,
  "popularity_rank": 20
}
```

Sobald etwas davon live ist, sagt Bescheid. Die App zieht die Felder ohne
weitere Änderung, `agave.js` bevorzugt jedes echte Feld gegenüber der eigenen
Ableitung.
