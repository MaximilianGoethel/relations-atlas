# Projekt: Relations Atlas

## Ziel
Eine interaktive Weltkarte als Website. Klick auf ein Land zeigt Pfeile zu seinen 10 wichtigsten internationalen Beziehungen (wirtschaftlich und politisch). Klick auf einen Partner öffnet ein ausführliches Beziehungsprofil. Zusätzlich hat jedes Land ein Profil seiner politischen und wirtschaftlichen Lage. Privates Projekt für mich und zum Zeigen für Freunde.

## Vorbild
- Die Datei `Oman_Internationale_Beziehungen_2026.pdf` in diesem Ordner ist das Vorbild für Tiefe und Aufbau der Länderdaten.

## Über mich und Sprache
- Ich habe kaum Programmiererfahrung.
- Chatte mit mir auf Deutsch. Website-Texte, Länderdaten und Code-Kommentare sind auf Englisch.

## Arbeitsweise
- Immer nur ein Schritt auf einmal. Erst wenn ich bestätige, dass es funktioniert, kommt der nächste.
- Erkläre jeden Schritt einfach: was wir machen, warum, und genau wo ich was klicken muss.
- Erkläre nach jeder Änderung kurz, welche Dateien du geändert hast und warum.
- Erkläre Git und GitHub (Branch, Pull Request, Merge, GitHub Pages) Schritt für Schritt, bis ich es selbst kann.
- Bei Fehlern: Frag nach der Fehlermeldung oder einem Screenshot, statt zu raten.
- Sag ehrlich, wenn etwas aufwendig, fehleranfällig oder unrealistisch ist.

## Technik
- Reines HTML, CSS und JavaScript, ohne Framework und ohne Build-Schritt.
- Karte mit D3.js und den world-atlas-Ländergrenzen (Natural Earth), per CDN eingebunden.
- Kostenloses Hosting über GitHub Pages.
- Länder werden über ISO-3166-Alpha-3-Codes identifiziert (z. B. OMN, DEU, CHN).
- Dateistruktur:
  - index.html, style.css, app.js
  - data/countries/<ISO3>.json (eine Datei pro Land)
- Länder ohne Daten bleiben anklickbar und zeigen "No data yet".

## Datenformat pro Land (data/countries/<ISO3>.json)
- country: Name, ISO3-Code, asOf (Stand-Datum)
- profile: politische Lage, wirtschaftliche Lage, Kennzahlen, Ausblick
- relations: genau 10 Einträge, jeweils mit
  - partner (ISO3), rank, influence (very high / high / medium)
  - status (very good / good / mixed / tense / hostile / war), trend (rising / stable / falling)
  - economic, politicalSecurity, current (aktuelle Entwicklungen), assessment
  - sources: Liste mit title, url, date
- Das Schema wird einmal festgelegt und danach nur mit meiner Zustimmung geändert.

## Darstellung
- Gebogene Pfeile vom gewählten Land zu seinen 10 Partnern, Farbe je nach status, mit Legende.
- Klick auf einen Pfeil oder ein Partnerland öffnet das Beziehungsprofil in einem Seitenpanel.
- Die Seite muss auch auf dem Handy funktionieren.

## Recherche neuer Länder
- Neue Länder immer aktuell im Web recherchieren (Nachrichten, Regierungsseiten, IWF, Ratingagenturen), nicht aus dem Gedächtnis.
- Die 10 Partner nach wirtschaftlichem und politischem Einfluss auswählen und die Auswahl kurz begründen.
- Tiefe wie im Oman-Dokument: Wirtschaft, Politik und Sicherheit, aktuelle Lage, Bewertung, Quellen mit Links.
- Fakten nur mit Quelle, eigene Einschätzungen klar als solche kennzeichnen.
- Alles in eigenen Worten formulieren, keine Artikel kopieren.
- Jede Länderdatei bekommt ein Stand-Datum (asOf).
- Beziehungen sind nicht symmetrisch: Die Top 10 von Land A müssen Land B nicht enthalten.

## Fahrplan
1. Erste Testseite über GitHub Pages online bringen
2. Weltkarte anzeigen, Ländername beim Überfahren mit der Maus
3. Land anklicken öffnet Seitenpanel mit dem Ländernamen
4. Datenformat festlegen, Oman als erstes Land einfügen (aus der Oman-PDF, ins Englische übertragen)
5. Pfeile zu den 10 Partnern mit Farben und Legende
6. Beziehungsprofil beim Klick auf einen Partner
7. Länderprofil mit politischer und wirtschaftlicher Lage
8. Feinschliff: Handy-Ansicht, Suchfeld, direkte Links (z. B. #OMN)
9. Danach Land für Land weitere Daten ergänzen
