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

## Teil 0, die eine offene Frage

`agave_kind` und `agave_expression` sind zweimal unterschiedlich beschrieben.

| Quelle | `agave_kind` | `agave_expression` |
|---|---|---|
| Deine Nachricht, mit Beispiel | `Tequila` | `Añejo` |
| Datenspezifikation, Feldtabelle | Blanco, Reposado, Añejo | genaue Bezeichnung |

Das ist genau andersherum. Die App liest deshalb beide Werte danach, **was sie
sagen**, und nicht danach, unter welchem Schlüssel sie ankommen. Ein Wert, der
eine Spirituose nennt, ist die Gattung. Ein Wert, der eine Reifung nennt, ist
die Auspraegung. So stimmt es in beiden Fällen.

Das ist ein Notbehelf und kein Entwurf. **Sag kurz Bescheid, welche der beiden
Lesarten der Generator tatsächlich schreibt**, dann fällt der Notbehelf raus
und die Feldtabelle wird korrigiert.

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

Was die App daraus macht. Die Frage nach der Agave zeigt nur noch die
Auspraegungen, die heute hinter der Bar stehen, also Blanco, Reposado, Rosado,
Añejo und Mezcal. Rosado ist eine eigene Antwort und wird nicht in Reposado
eingerechnet. Die Herkunft steht auf der Ergebniskarte und unterscheidet zwei
Vorschläge, die sich sonst durch nichts unterscheiden. `additive_free` ist eine
eigene Antwort in der Frage "Soll etwas draussen bleiben", als harte Regel.
Unbekannt zählt dort nicht als ja, und die Frage sagt das auch.

---

## Teil 2, was noch fehlt

### 1. `flavour_tags` und `flavour_tags_en` bei den puren Flaschen

Typ `string[]`. Das wichtigste offene Feld, und dasselbe, das die Cocktail App
schon angefragt hat.

Bei Cocktails liest die App den Geschmack notfalls aus der Zutatenliste,
`Limette` als sauer, `Campari` als bitter, und nennt auf der Karte immer die
Zutat mit, aus der sie das gelesen hat. **Bei einer puren Flasche gibt es keine
Zutatenliste.** Ein Blanco und ein Añejo schmecken für die App deshalb heute
gleich, obwohl genau das der Unterschied ist.

Vokabular wie bei den Cocktails, deutsch mit Umlauten:
`süß`, `prickelnd`, `fruchtig`, `sauer/zitrus`, `bitter`, `kräuterig/frisch`,
`cremig`, `rauchig`, `salzig`, `scharf`, `überraschend`.

Für Agave zusätzlich sinnvoll: `pfeffrig`, `vegetal`, `mineralisch`, `holzig`,
`vanille`, `karamell`.

### 2. `aged_months`

Typ `number`. Der Nutzen ist leicht zu zeigen. Don Julio Añejo und Don Julio
1942 sind beide Añejo, beide Don Julio, beide Hochland, beide stark. Die App
kann heute buchstäblich nichts sagen, was die zwei unterscheidet, ausser dem
Preis, und schreibt deshalb ehrlich "Passt ebenfalls". Mit `aged_months` würde
daraus "Was länger Gereiftes".

### 3. `abv`

Typ `number`, zum Beispiel `38`. Drei Stärkeworte beschreiben einen Cocktail.
Bei einer puren Flasche will ein Gast eine Zahl, und die steht ohnehin auf der
Flasche.

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

1. **Welche Lesart schreibt der Generator bei `agave_kind`.** Siehe Teil 0.
2. **Steht auf Seite 217 schon die neue Fassung.** Solange der Website Seat
   nicht neu veröffentlicht hat, sieht die App die alte Form. Sie läuft, sie
   kann nur Don Julio 1942 nicht einordnen.
3. **Schreibt die Karte `Añejo` oder `Anejo`.** Beides wird erkannt, die App
   normalisiert Tilde und Umlaut. Einheitlich wäre trotzdem besser.
4. **Steht bei Don Julio Rosado `Rosado` oder `Reposado` im
   `agave_expression`.** Beides funktioniert. Bei `Rosado` bekommt es eine
   eigene Antwort in der Frage, bei `Reposado` läuft es mit den Reposados mit.
5. **Taucht `&amp;` irgendwo auf.** Dann ist die Publishing Pipeline kaputt.
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

  "abv": 38,
  "aged_months": 8,
  "flavour_tags": ["süß", "holzig", "vanille"],
  "flavour_tags_en": ["sweet", "woody", "vanilla"],

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
