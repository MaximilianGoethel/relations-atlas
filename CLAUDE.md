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
  - data/country-codes.json (Ländercodes, siehe unten)
- Länder ohne Daten bleiben anklickbar und zeigen "No data yet".
- Bei jeder Änderung an style.css oder app.js die Versionsnummer (?v=) in index.html erhöhen, damit Browser nicht die alte Datei aus dem Zwischenspeicher nehmen.

## Datenformat pro Land (data/countries/<ISO3>.json)
Festgelegt am 27.10.2026. Vorlage ist data/countries/OMN.json.
- country: name, iso3, asOf (Stand-Datum, Format JJJJ-MM-TT)
- profile:
  - overview: kurze Zusammenfassung
  - political: summary, points (Liste), timeline (Liste mit date, event, significance), assessment
  - economic: summary, strengths (Liste), risks (Liste), assessment
  - keyFigures: Liste mit label, value, source (title, url, date)
  - outlook: summary, scenarios (Liste mit name, whatHappens, consequences), conclusion
  - sources: Liste mit title, url, date
- selection: criteria (warum diese 10 Partner), nearMisses (Liste: knapp nicht gewählte Länder mit Grund)
- relations: genau 10 Einträge, jeweils mit
  - partner (ein ISO3-Code), rank (1–10), influence (very high / high / medium)
  - status (very good / good / mixed / tense / hostile / war), trend (rising / stable / falling)
  - headline (Überschrift der Beziehung)
  - economic, politicalSecurity, current (jeweils Liste von Stichpunkten)
  - assessment (Text)
  - sources: Liste mit title, url, date
- Quellen-date: Veröffentlichungsdatum (JJJJ, JJJJ-MM oder JJJJ-MM-TT); bei Seiten ohne Datum (z. B. Wikipedia) der Abrufmonat.
- Eigene Einschätzungen sind: influence, alle assessment-Felder und die scenarios. Die Website kennzeichnet sie als "Our assessment".
- Das Schema wird einmal festgelegt und danach nur mit meiner Zustimmung geändert.

## Ländercodes
- Die Karte (world-atlas) nummeriert Länder mit ISO-Zifferncodes (z. B. 512 = Oman).
- data/country-codes.json übersetzt sie in ISO-Alpha-2 und -Alpha-3 (z. B. "512": ["OM", "OMN"]).
- Gebiete ohne Code (z. B. Somaliland, Nordzypern) zeigen nur ihren Namen und "No data yet". Kosovo wird in app.js als XKX geführt.

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
