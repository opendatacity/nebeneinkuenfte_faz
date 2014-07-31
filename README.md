# Visualisierung der Nebeneinkünfte der Bundestagsabgeordneten

Kann auch problemlos auf eine "externe" Datenquelle zugreifen (z.B. http://apps.opendatacity.de/nebeneinkuenfte/data/data.json), dann einfach in der index.html den `dataPath` (Zeile 142) entsprechend setzen. Je nachdem, wo das Ding gehostet wird, muss der Server das JSON dafür mit dem passenden `Access-Control-Allow-Origin`-Header ausliefern.

Im Footer muss dereinst noch der Link zum Quellcode nachgetragen werden.

Funktioniert in IE9 aufwärts.
