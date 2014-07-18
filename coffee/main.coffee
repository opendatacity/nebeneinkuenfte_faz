'use strict'

C = x: 400, y: 400
Arc = innerR: 100, outerR: 400, phiMax: 180
Rep = r: 8, spacing: 17.5

Factions = [
  { name: 'Die Linke',             class: 'linke' }
  { name: 'SPD',                   class: 'spd' }
  { name: 'Bündnis 90/Die Grünen', class: 'gruene' }
  { name: 'FDP',                   class: 'fdp' } # It's better to be future-proof than optimistic.
  { name: 'CDU/CSU',               class: 'cducsu' }
]

x = (phi, r) -> C.x - r * Math.cos rad(phi)
y = (phi, r) -> C.y - r * Math.sin rad(phi)
deg = (rad) -> 360 * rad / (2 * Math.PI)
rad = (deg) -> (2 * Math.PI) * deg / 360
phiAtRadius = (r) -> deg Math.atan2(Rep.spacing, r)

drawRepresentative = (rep, phi, r) ->
  div = $ '<div>'
  div.addClass 'representative'
  div.css
    left: x(phi, r)
    top:  y(phi, r)
  #div.attr 'data-faction', rep.faction
  $('#parliament').append div

$.getJSON '/data/data.json', (data) ->
  data = data.data
  _data = _(data)
  console.log data

  dataByFaction = _data.groupBy('fraktion').value()
  seats = _.mapValues dataByFaction, (f) -> f.length
  totalSeats = _.reduce seats, (sum, num) -> sum + num
  console.log seats

  coordinatesAtIndex = (factionName, index) ->
    r = Arc.innerR
    factionPhi = Arc.phiMax * (seats[factionName] / totalSeats)
    i = -1
    phi = 0

    until i >= index
      phiInThisRow = phiAtRadius r
      # How many representatives fit within the faction's wedge at the current phi?
      repsInThisRow = Math.floor factionPhi / phiInThisRow
      if i + repsInThisRow >= index
        phi = (factionPhi / repsInThisRow) * (i + repsInThisRow - index)
        break

      r += Rep.spacing
      i += repsInThisRow

    return phi: phi, r: r

  phi = 0
  _(Factions).each (faction) ->
    factionName = faction.name
    return unless dataByFaction[factionName]
    r = Arc.innerR
    for representative, i in dataByFaction[factionName]
      coords = coordinatesAtIndex factionName, i
      console.log coords
      drawRepresentative representative, phi + coords.phi, coords.r
    phi += Arc.phiMax * (seats[factionName] / totalSeats)

