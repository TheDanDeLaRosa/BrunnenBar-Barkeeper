# Was die Agave App aus dem Menu API braucht

Stand 08.09.2026, dritte Fassung. Gegenstück zu
`menu-api-felder-fuer-die-app.md`, für den Tequila und Mezcal Empfehler unter
`/tequila/`.

**Datenseitig ist alles da.** Der Neat Abschnitt steht in der Karte, und
`strength`, `brand`, `agave_kind`, `agave_expression`, `agave_region`,
`additive_free`, `aged_months`, `abv` und `flavour_tags` sind echte Felder. Die
App liest alle direkt und rät nichts mehr, wo ein Feld steht. Was hier noch
steht, ist ein Bildwunsch und eine Handvoll Sachen für später.

**Zwei Dinge vorab.**

Gebaut wurde weiterhin gegen das dokumentierte Schema, nicht gegen die echte
Antwort. Aus der Build Umgebung ist `brunnenbar.com` gesperrt. Der erste Lauf
gegen die Live Daten gehört angeschaut, Abschnitt "Zum Nachprüfen" sagt worauf.

Die Felder liegen in `menu.json` und stehen auf Seite 217 erst, wenn der
Website Seat `publish_menu_page.py` laufen lässt. Bis dahin sieht ein Browser
die ältere Form. Die App fällt dann pro Feld auf die Namensableitung zurück,
verliert die Herkunft, die Fassreife, den Alkoholgehalt und den Geschmack der
puren Flaschen, und kann Don Julio 1942 nicht als Añejo einordnen. Sie läuft.
Beide Formen werden getestet.

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
| `abv` | da, auf jeder puren Flasche |

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

## Zu den zwei Schreibweisen, kurz zum Mitschreiben

Danke fürs Aufräumen, es ändert für die App aber nichts, und das ist auch
völlig in Ordnung.

Der Unterschied lag nie innerhalb der API. Die Cocktails haben dort gar keine
`flavour_tags`. Die App liest ihren Geschmack aus der Zutatenliste und schreibt
dabei die Hausform, also `sauer/zitrus`. Die puren Flaschen liefern
`flavour_tags` mit und schreiben, bewusst feiner, `zitrus`. Beide landen in
derselben Ergebnisliste.

Die Abgleichtabelle in `agave.js` legt die zwei auf einen Schlüssel. Ohne sie
würde ein Gast, der nach Zitrus fragt, die Margarita treffen und den Blanco
nicht, und das würde niemandem auffallen.

**Sie bleibt also, und das ist kein Problem.** Sie tut nichts, wenn eine
Schreibweise schon die Hausform ist, kostet sieben Zeilen und schützt genau
gegen den Fall, der still schiefgeht. Von eurer Seite ist dazu nichts mehr zu
tun. Wenn ihr irgendwann doch `flavour_tags` auch bei den Cocktails ausspielt,
sagt Bescheid, dann liest die App die statt der Zutatenliste.

---

## Teil 2, was noch fehlt

### 1. Flaschenfotos möglichst freigestellt

Kein Feld, sondern ein Wunsch ans Bildmaterial. `image` wird verlinkt und auf
`null` geprüft, das passt alles.

Die Ergebniskarte ist fast schwarz. Ein Foto auf weissem Grund füllt den Rahmen
und steht dann als helles Rechteck darin. Das sieht ordentlich aus, es ist
gerahmt und hat einen Rand, aber ein freigestelltes PNG mit transparentem
Hintergrund sieht deutlich besser aus und kostet beim Export nichts.

Wenn die Fotos ohnehin freigestellt sind, ist hier nichts zu tun.

---

## Teil 3, für später

Nichts davon blockiert etwas. In der Reihenfolge, in der ein Gast danach fragt.

| Feld | Typ | Warum |
|---|---|---|
| `nom` | `string` | Die Destilleriennummer. Sagt, welche Flaschen aus demselben Haus kommen. Das nächste, das sich lohnt |
| `still` | `string` | `Kupfer`, `Edelstahl`, `Tahona`. Für die Neugierigen |
| `agave_years` | `number` | Wie lange die Agave selbst gewachsen ist, bevor sie geerntet wurde |
| `flavour_tags` bei den Cocktails | `string[]` | Dann liest die App sie statt der Zutatenliste. Kein Muss, die Ableitung funktioniert |

---

## Was gut ist wie es ist

`prices` mit Grössen deckt 2 cl und 4 cl sauber ab, die App zeigt beide.
`allergens` und `allergen_codes` reichen für die harte Regel. `popularity_rank`
reicht für den Bestseller Hinweis. `recommended` wird als Marker gezeigt, nicht
gewertet, und es gibt keinen eigenen Empfehlungsblock oben in der App.
`content_hash` wird zum Vergleichen genutzt, nicht der Zeitstempel. `abv` steht
auf der Karte und wird bewusst nicht gewertet, weil 38 und 42 Prozent für eine
Empfehlung dasselbe sind. `image` wird verlinkt, nicht kopiert, und auf `null`
geprüft. `menu_class` erreicht die
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
  "abv": 38,
  "flavour_tags": ["vanille", "agave", "eiche"],
  "flavour_tags_en": ["vanilla", "agave", "oak"],

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
