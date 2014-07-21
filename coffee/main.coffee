'use strict'

Viewport = width: 800, height: 400
Arc = innerR: 100, outerR: 400, phiMax: 180
Rep = r: 5, spacing: 12

Factions = [
  { name: 'Die Linke',             class: 'linke' }
  { name: 'SPD',                   class: 'spd' }
  { name: 'Bündnis 90/Die Grünen', class: 'gruene' }
  { name: 'FDP',                   class: 'fdp' } # It's better to be future-proof than optimistic.
  { name: 'CDU/CSU',               class: 'cducsu' }
]

x = (phi, r) -> Viewport.width / 2 - r * Math.cos(rad phi)
y = (phi, r) -> Viewport.height - r * Math.sin(rad phi)
xPercent = (phi, r) -> x(phi, r)/Viewport.width * 100
yPercent = (phi, r) -> y(phi, r)/Viewport.height * 100
deg = (rad) -> 360 * rad / (2 * Math.PI)
rad = (deg) -> (2 * Math.PI) * deg / 360
phiAtRadius = (r) -> deg Math.atan2(Rep.spacing, r)

representativeParentElement = (rep) ->
  id = _.find(Factions, name: rep.fraktion).class
  if (element = $('ul#'+id)).length > 0
    return element
  element = $ '<ul id="'+id+'">'
  $("#parliament").append element
  return element

drawRepresentative = (rep, phi, r) ->
  element = $ '<li>'
  element.addClass 'representative'
  element.data 'representative', rep
  element.addClass _.find(Factions, name: rep.fraktion).class
  representativeParentElement(rep).append element
  return element[0]

updateCheckboxLabelState = (checkbox) -> $(checkbox).parent('label').toggleClass 'active', $(checkbox).prop('checked')

NebeneinkunftMinAmounts = [ 0.01, 1000, 3500, 7000, 15000, 30000, 50000, 75000, 100000, 150000, 250000 ]

nebeneinkuenfteMinSum = (rep) ->
  return 0 if rep.nebeneinkuenfte.length == 0
  sum = rep.nebeneinkuenfte.reduce ((sum, einkunft) -> sum += NebeneinkunftMinAmounts[einkunft.level]), 0
  return Math.max parseInt(sum, 10), 1

$.getJSON '/data/data.json', (data) ->
  data = data.data
  window._data = _(data)

  _data.each (rep) ->
    rep.nebeneinkuenfteMinSum = nebeneinkuenfteMinSum rep

  # To distribute the reps evenly in the parliament,
  # we first have to establish where we should draw the boundaries
  # between their groups
  nebeneinkuenfteMinSumGroups = []
  groupSize = 0
  _data.countBy('nebeneinkuenfteMinSum')
  .each (count, sum) ->
    idealGroupSize = data.length / (11 * (nebeneinkuenfteMinSumGroups.length + 1))
    groupSize += count
    if groupSize > idealGroupSize
      nebeneinkuenfteMinSumGroups.push parseInt(sum, 10)
      groupSize = 0

  nebeneinkuenfteMinSumGroup = _.memoize (rep) ->
    index = _.findIndex(nebeneinkuenfteMinSumGroups, (sum) -> rep.nebeneinkuenfteMinSum < sum)
    index = 10 if index == -1
    return index
  , (rep) -> rep.nebeneinkuenfteMinSum

  dataByFaction = _data.groupBy('fraktion').value()
  seats = _.mapValues dataByFaction, (f) -> f.length
  totalSeats = _.reduce seats, (sum, num) -> sum + num

  factionWidth = (factionName) -> Arc.phiMax * (seats[factionName] / totalSeats)
  factionPhi = {}
  factionPhiSum = 0
  for faction in Factions
    continue unless dataByFaction[faction.name]
    factionPhi[faction.name] = factionPhiSum
    factionPhiSum += factionWidth(faction.name)

  coordinates = (args) ->
    rep = args.forRep
    index = args.atIndex
    fromCenter = (10 - args.inGroup)/10
    maxIndex = args.ofLength - 1

    deltaR = Arc.outerR - Arc.innerR - 2 * Rep.spacing
    r = Arc.innerR + Rep.spacing + deltaR*fromCenter
    i = -1
    phi = null

    rMin = 0# Arc.innerR + (Arc.outerR - Arc.innerR) * nebeneinkuenfteSum/72

    while true
      phiInThisRow = phiAtRadius r
      # We leave one seat's width as margin on either side:
      margin = phiInThisRow
      fPhi = factionWidth(rep.fraktion) - 2 * margin

      # How many representatives fit within the faction's wedge at the current phi?
      seatsInThisRow = Math.ceil(fPhi / phiInThisRow)

      # Could this row fit more representatives than are left?
      emptySeatsInThisRow = i + seatsInThisRow - maxIndex

      # If this is the last row but we can't fill it up,
      # increase the margin to center the representatives
      if emptySeatsInThisRow > 0
        margin -= emptySeatsInThisRow * phiInThisRow * 0.5

      if i + seatsInThisRow >= index
        phi = (fPhi / Math.max(seatsInThisRow-1, 1)) * (i + seatsInThisRow - index)
        phi += margin
        break

      r += Rep.spacing
      i += seatsInThisRow

    return phi: phi, r: Math.max(r, rMin)

  drawOrMoveRepresentatives = (repsByFaction) ->
    phi = 0

    for faction in Factions
      factionName = faction.name
      factionReps = repsByFaction[factionName]
      continue unless factionReps

      phi = factionPhi[factionName]

      _(factionReps).groupBy nebeneinkuenfteMinSumGroup
      .each (groupReps, group) ->
        for rep, i in groupReps
          coords = coordinates forRep: rep, atIndex: i, inGroup: group, ofLength: groupReps.length
          rep.element = drawRepresentative rep unless rep.element
          rep.visible = true
          repRadius = (Math.sqrt Math.log(rep.nebeneinkuenfteMinSum+1))
          $(rep.element).removeClass 'hidden'
          .css
            left: xPercent(phi + coords.phi, coords.r) - repRadius + "%"
            top:  yPercent(phi + coords.phi, coords.r) - 2*repRadius + "%"
            width: repRadius+"%"
            height: 2*repRadius+"%"
            borderRadius: "50%"
          .attr 'data-group', group

  hideRepresentatives = (repsByFaction) ->
    _(repsByFaction).each (faction) ->
      for rep in faction
        $(rep.element).addClass 'hidden'
        rep.visible = false

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

  $('form').on 'change', 'input', ->
    $(this).submit()
    updateCheckboxLabelState this

  updateCheckboxLabelState $(':checkbox')
    

  $(window).on 'resize', (event) ->
    aspectRatio = Viewport.height / Viewport.width
    $('#parliament').css height: $('#parliament').width() * aspectRatio
  $(window).trigger('resize')

