'use strict'

C = x: 400, y: 400
Arc = innerR: 100, outerR: 400, phiMax: 180
Rep = r: 5, spacing: 12

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
  div.data 'representative', rep
  div.addClass _.find(Factions, name: rep.fraktion).class
  $('#parliament').append div
  return div[0]

$.getJSON '/data/data.json', (data) ->
  data = data.data
  window._data = _(data)

  _data.each (rep) ->
    rep.nebeneinkuenfteSum = rep.nebeneinkuenfte.reduce ((sum, nebeneinkunft) -> sum+nebeneinkunft.level), 0

  nebeneinkuenfeSumMax = _data.max('nebeneinkuenfteSum').value().nebeneinkuenfteSum
  console.log nebeneinkuenfeSumMax

  console.log data[0..5]

  dataByFaction = _data.groupBy('fraktion').value()
  seats = _.mapValues dataByFaction, (f) -> f.length
  totalSeats = _.reduce seats, (sum, num) -> sum + num

  factionPhi = (factionName) -> Arc.phiMax * (seats[factionName] / totalSeats)

  coordinatesAtIndex = (rep, index) ->
    r = Arc.innerR + Rep.spacing
    i = -1
    phi = null

    rMin = 0# Arc.innerR + (Arc.outerR - Arc.innerR) * nebeneinkuenfteSum/72

    while true
      phiInThisRow = phiAtRadius r
      # We leave one seat's width as margin on either side:
      margin = phiInThisRow
      fPhi = factionPhi(rep.fraktion) - 2 * margin
      # How many representatives fit within the faction's wedge at the current phi?
      repsInThisRow = Math.ceil(fPhi / phiInThisRow)
      if i + repsInThisRow >= index
        phi = (fPhi / Math.max(repsInThisRow-1, 1)) * (i + repsInThisRow - index)
        phi += margin
        break

      r += Rep.spacing
      i += repsInThisRow

    return phi: phi, r: Math.max(r, rMin)

  drawOrMoveRepresentatives = (repsByFaction) ->
    phi = 0

    for faction in Factions
      factionName = faction.name
      continue unless repsByFaction[factionName]
      r = Arc.innerR
      for rep, i in repsByFaction[factionName]
        coords = coordinatesAtIndex rep, i
        rep.element = drawRepresentative rep unless rep.element
        $(rep.element).removeClass 'hidden'
        .css
          left: x(phi + coords.phi, coords.r)
          top:  y(phi + coords.phi, coords.r)
      phi += factionPhi(factionName)

  hideRepresentatives = (repsByFaction) ->
    for faction in Factions
      continue unless repsByFaction[faction.name]
      $(rep.element).addClass 'hidden' for rep in repsByFaction[faction.name]

  drawOrMoveRepresentatives dataByFaction

  $('form').on 'submit', (event) ->
    form = $ this
    inputs = form.find 'input[name]:not(:checkbox), :checkbox:checked'
    event.preventDefault()

    filter = _(inputs.get()).groupBy('name').mapValues (inputs) -> inputs.map (input) -> $(input).val()
    filter = filter.value()

    groupedData = _data.groupBy (rep) ->
      _(filter).reduce (sum, filterValues, filterProperty) ->
        keep = _.contains filterValues, rep[filterProperty]
        return Boolean(sum * keep)
      , true
    groupedData = groupedData.mapValues((reps) -> _.groupBy reps, 'fraktion').value()
    drawOrMoveRepresentatives groupedData.true if groupedData.true
    hideRepresentatives groupedData.false if groupedData.false

  $('form').on 'change', 'input', -> $(this).submit()

