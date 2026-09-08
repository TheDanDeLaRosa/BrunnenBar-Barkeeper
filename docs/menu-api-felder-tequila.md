# Was die Agave App aus dem Menu API braucht

Stand 08.09.2026, zweite Fassung. Gegenstück zu
`menu-api-felder-fuer-die-app.md`, für den Tequila und Mezcal Empfehler unter
`/tequila/`.

**Die grosse Hälfte ist erledigt.** Der Neat Abschnitt steht in der Karte, die
puren Flaschen tragen `strength`, und `brand`, `agave_kind`,
`agave_expression`, `agave_region` und `additive_free` sind echte Felder. Die
App liest alle davon direkt und rät nichts mehr, wo ein Feld steht.

**Zwei Dinge vorab.**

Gebaut wurde weiterhin gegen das dokumentierte Schema, nicht gegen die echte
Antwort. Aus der Build Umgebung ist `brunnenbar.com` gesperrt. Der erste Lauf
gegen die Live Daten gehört angeschaut, Abschnitt "Zum Nachprüfen" sagt worauf.

Die Felder liegen in `menu.json` und stehen auf Seite 217 erst, wenn der
Website Seat neu veröffentlicht. Bis dahin sieht ein Browser die ältere Form.
Die App fällt dann pro Feld auf die Namensableitung zurück und verliert genau
eine Sache, nämlich dass Don Julio 1942 ein Añejo ist. Alles andere bleibt, und
beide Formen werden getestet.

---

## Geklärt am 08.09.2026

`agave_kind` ist die Gattung, `agave_expression` ist die Reifung. Also
`agave_kind: "Tequila"` und `agave_expression: "Añejo"`. Das Beispiel stimmte,
die Feldtabelle in der Datenspezifikation stand andersherum und wird
korrigiert.

Der Notbehelf in `agave.js`, der beide Werte danach gelesen hat, was sie sagen,
ist raus. Die App liest die zwei Enums jetzt direkt, und ein Test hält die
Richtung fest.

`Joven` ist als eigener Wert in der Auspraegung angekommen und bekommt auch
eine eigene Antwort in der App. Es wird nicht stillschweigend zu Blanco
zusammengefasst, weil ein Gast das Wort sehen soll, das auf der Karte steht.

---

## Teil 1, erledigt

| Feld | Stand |
|---|---|
| Neat Abschnitt in der Karte | da, sechs pure Flaschen |
| `strength` bei den puren Flaschen | da, alle `stark` |
| `brand` | da, die App rät nicht mehr aus dem Namen |
| `agave_kind` | da |
| `agave_expression` | da, damit ist Don Julio 1942 als Añejo erkennbar |
| `agave_region` | da |
| `additive_free` | da, `false` bei Don Julio, `true` bei Nuestra Soledad |
| `flavour_tags` bei den puren Flaschen | da, Blanco und Añejo schmecken jetzt verschieden |
| `aged_months` | da, Añejo 18 und 1942 30 |

Was die App daraus macht. Die Frage nach der Agave zeigt nur noch die
Auspraegungen, die heute hinter der Bar stehen, also Blanco, Joven, Reposado,
Rosado, Añejo und Mezcal. Rosado ist eine eigene Antwort und wird nicht in
Reposado eingerechnet. Die Herkunft steht auf der Ergebniskarte und
unterscheidet zwei Vorschläge, die sich sonst durch nichts unterscheiden.
`additive_free` ist eine eigene Antwort in der Frage "Soll etwas draussen
bleiben", als harte Regel. Unbekannt zählt dort nicht als ja, und die Frage
sagt das auch.

Die Geschmacksfrage baut sich jetzt genauso aus der Karte. Sie zeigt nur
Geschmäcker, die heute wirklich vorkommen, und sie zeigt nach der ersten Frage
nur noch die, die zur Antwort passen. Wer pur sagt, sieht Agave, Pfeffrig,
Vanille, Karamell, Schokolade und Eiche. Wer gemixt sagt, sieht Süß, Bitter,
Prickelnd, Cremig und Salzig. Das sind zwölf statt achtzehn Knöpfe.

`aged_months` macht genau das, wofür es gedacht war. Don Julio Añejo und Don
Julio 1942 sind sonst in jedem Feld gleich. Auf der Karte steht jetzt "Was
länger Gereiftes" statt "Passt ebenfalls", und "Im Fass 30 Monate".

---

## Teil 2, was noch fehlt

### 1. Eine Schreibweise für den Geschmack, nicht zwei

Kein neues Feld, sondern ein Aufräumen. Die zwei Hälften der Karte schreiben
denselben Geschmack unterschiedlich.

| Cocktails | Pure Flaschen |
|---|---|
| `sauer/zitrus` | `zitrus` |
| `kräuterig/frisch` | `frisch` |

Die App gleicht das intern ab, sonst würde ein Gast, der nach Zitrus fragt, die
Margarita treffen und den Blanco nicht. Das ist ein Pflaster. Sauberer wäre
eine Liste, und dann fällt die Abgleichtabelle weg.

Mein Vorschlag ist, die längere Schreibweise zu nehmen, weil sie schon in der
Cocktailkarte steht. Also `sauer/zitrus` und `kräuterig/frisch` auch bei den
puren Flaschen. Wenn ihr lieber die kurze wollt, geht das auch, dann bitte
überall.

Die Wörter, die nur bei den puren Flaschen vorkommen, sind unstrittig und
bleiben wie sie sind. `agave`, `pfeffrig`, `vanille`, `karamell`,
`schokolade`, `eiche`, `vegetal`, `mineralisch`, `holzig`.

### 2. `abv`

Typ `number`, zum Beispiel `38`. Drei Stärkeworte beschreiben einen Cocktail.
Bei einer puren Flasche will ein Gast eine Zahl, und die steht ohnehin auf der
Flasche. Das einzige Feld aus der ursprünglichen Liste, das noch offen ist.

---

## Teil 3, für später

Nichts davon blockiert etwas. In der Reihenfolge, in der ein Gast danach fragt.

| Feld | Typ | Warum |
|---|---|---|
| `nom` | `string` | Die Destilleriennummer. Sagt, welche Flaschen aus demselben Haus kommen. Das nächste, das sich lohnt |
| `still` | `string` | `Kupfer`, `Edelstahl`, `Tahona`. Für die Neugierigen |
| `agave_years` | `number` | Wie lange die Agave selbst gewachsen ist, bevor sie geerntet wurde |

---

## Was gut ist wie es ist

`prices` mit Grössen deckt 2 cl und 4 cl sauber ab, die App zeigt beide.
`allergens` und `allergen_codes` reichen für die harte Regel. `popularity_rank`
reicht für den Bestseller Hinweis. `recommended` wird als Marker gezeigt, nicht
gewertet, und es gibt keinen eigenen Empfehlungsblock oben in der App.
`content_hash` wird zum Vergleichen genutzt, nicht der Zeitstempel. `image`
wird verlinkt, nicht kopiert, und auf `null` geprüft. `menu_class` erreicht die
Oberfläche gar nicht erst, es wird beim Einlesen nicht übernommen.
`hidden_on_card` wird nicht angezeigt.

**Zu den Sektionen.** Die Spezifikation sagt, per Stichwort filtern statt per
Titel. Die App macht beides. Ein Eintrag gehört ihr, wenn er selbst Agave
nennt, also eine Spirituose oder eine Marke, **oder** wenn er in einer Sektion
mit Stichwort steht. Die Sektion kann also etwas dazunehmen, aber nichts
wegnehmen. Ihr könnt umbenennen, zusammenlegen und neu anlegen. Verloren geht
dabei nur ein Eintrag, der selbst nichts nennt und dessen Sektion jedes
Stichwort verliert, zum Beispiel wenn aus "Tequila Cocktails" einmal
"Hausdrinks" wird. Beide Hälften sind getestet.

---

## Zum Nachprüfen

Beim ersten Lauf gegen die echten Daten sind das die Dinge, die auffallen
würden.

1. **Steht auf Seite 217 schon die neue Fassung.** Solange der Website Seat
   nicht neu veröffentlicht hat, sieht die App die alte Form. Sie läuft, sie
   kann nur Don Julio 1942 nicht einordnen.
2. **Schreibt die Karte `Añejo` oder `Anejo`.** Beides wird erkannt, die App
   normalisiert Tilde und Umlaut. Einheitlich wäre trotzdem besser.
3. **Steht bei Don Julio Rosado `Rosado` oder `Reposado` im
   `agave_expression`.** Beides funktioniert. Bei `Rosado` bekommt es eine
   eigene Antwort in der Frage, bei `Reposado` läuft es mit den Reposados mit.
4. **Taucht `&amp;` irgendwo auf.** Dann ist die Publishing Pipeline kaputt.
   Der Loader meldet das und repariert bewusst nichts.

So sähe eine vollständige pure Flasche aus.

```json
{
  "name": "Don Julio Reposado",
  "name_en": "Don Julio Reposado",
  "group": "", "group_en": "",
  "price": 9.5,
  "prices": [{ "size": "2 cl", "price": 9.5 }, { "size": "4 cl", "price": 17.0 }],
  "description": "Acht Monate im Fass, weich und warm.",
  "description_en": "Eight months in oak, soft and warm.",
  "ingredients": [],
  "ingredients_en": [],

  "strength": "stark",
  "brand": "Don Julio",
  "agave_kind": "Tequila",
  "agave_expression": "Reposado",
  "agave_region": "Highland",
  "additive_free": false,
  "aged_months": 8,
  "flavour_tags": ["vanille", "agave", "eiche"],
  "flavour_tags_en": ["vanilla", "agave", "oak"],

  "abv": 38,

  "allergens": [], "allergens_en": [], "allergen_codes": [],
  "alcohol_free": false,
  "image": "https://brunnenbar.com/wp-content/uploads/don-julio-reposado.jpg",
  "pos_sku": "T2",
  "menu_class": "star",
  "recommended": false,
  "hidden_on_card": false,
  "on_printed_menu": true,
  "popularity_rank": 20
}
```

Sobald etwas davon live ist, sagt Bescheid. Die App zieht die Felder ohne
weitere Änderung, `agave.js` bevorzugt jedes echte Feld gegenüber der eigenen
Ableitung.
