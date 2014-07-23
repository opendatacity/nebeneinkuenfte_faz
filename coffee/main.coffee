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

NebeneinkunftMinAmounts = [ 0.01, 1000, 3500, 7000, 15000, 30000, 50000, 75000, 100000, 150000, 250000 ]

nebeneinkuenfteMinSum = (rep) ->
  return 0 if rep.nebeneinkuenfte.length == 0
  sum = rep.nebeneinkuenfte.reduce ((sum, einkunft) -> sum += NebeneinkunftMinAmounts[einkunft.level]), 0
  return Math.max parseInt(sum, 10), 1


updateCheckboxLabelState = (checkbox) -> $(checkbox).parent('label').toggleClass 'active', $(checkbox).prop('checked')

$.getJSON '/data/data.json', (data) ->
  data = data.data
  window._data = _(data)

  # Which of the possible factions are actually represented in parliament?
  factions = Factions.filter (faction) -> _data.find fraktion: faction.name

  _data.each (rep) ->
    rep.nebeneinkuenfteMinSum = nebeneinkuenfteMinSum rep
    rep.x = Viewport.width * Math.random()
    rep.y = Viewport.height * Math.random() * 0.5
    rep.radius = 0.07*Math.sqrt rep.nebeneinkuenfteMinSum
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

  data = _data.where (rep) -> rep.nebeneinkuenfteMinSum > 1
  .value()

  tick = (e) ->
    alpha = e.alpha * e.alpha
    qt = d3.geom.quadtree data
    data.forEach (rep, i) ->
      dX = rep.x - (Viewport.width >> 1)
      dY = rep.y - Viewport.height
      r = Math.sqrt dX * dX + dY * dY

      # Angle of the line between the CENTRE of the rep and the centre of the parliament
      phi = Math.atan2 dX, -dY
      # Angle between - the line from the centre of parliament through the centre of the rep
      #               - and the the representative's tangent through the centre of parliament
      phiOffset = Math.atan2 rep.radius, r

      factionAngles = _.find seatsPie, (item) -> item.data.faction is rep.fraktion
      minAngle = factionAngles.startAngle
      maxAngle = factionAngles.endAngle

      # Ensure representatives stay outside the inner radius
      if r < Arc.innerR + rep.radius
        missing = (Arc.innerR + rep.radius - r) / r
        rep.x += dX * missing
        rep.y += dY * missing
      
      rep.phi = phi
      rep.wrongPlacement = false
      # …and ensure they stay within their factions
      if phi < minAngle + phiOffset
        destinationPhi = minAngle + phiOffset
        rep.wrongPlacement = true
      if phi > maxAngle - phiOffset
        destinationPhi = maxAngle - phiOffset
        rep.wrongPlacement = true
      if destinationPhi
        r = Math.max Arc.innerR + rep.radius, r
        dY = -r * Math.cos destinationPhi
        dX =  r * Math.sin destinationPhi
        destinationX = (Viewport.width >> 1) + dX
        destinationY = Viewport.height + dY
        rep.x = destinationX
        rep.y = destinationY

      collide(0.1, qt)(rep)

    node.attr 'cx', (d) -> d.x
    node.attr 'cy', (d) -> d.y
    node.classed 'wrongPlacement', (d) -> d.wrongPlacement
    node.attr 'data-phi', (d) -> d.phi

  collide = (alpha, qt) ->
    return (d) ->
      r = d.radius
      nx1 = d.x - r
      nx2 = d.x + r
      ny1 = d.y - r
      ny2 = d.y + r
      qt.visit (quad, x1, y1, x2, y2) ->
        if quad.point and quad.point isnt d
          w = d.x - quad.point.x
          h = d.y - quad.point.y
          l = Math.sqrt w*w + h*h
          r = d.radius + quad.point.radius
          if l < r
            deltaL = (l - r) / l * alpha
            d.x -= w *= deltaL
            d.y -= h *= deltaL
            quad.point.x += w
            quad.point.y += h
        return x1 > nx2 or x2 < nx1 or y1 > ny2 or y2 < ny1

  svg = d3.select 'svg'
  .attr 'width', Viewport.width
  .attr 'height', Viewport.height

  # Draw parliament wedges first
  pie = d3.layout.pie()
  .sort null
  .value (faction) -> faction.seats
  .startAngle Math.PI * -0.5
  .endAngle Math.PI * 0.5

  # We'll be needing this not only for the pie chart but also in the collision
  # detector to make sure that representatives stay inside their own faction
  seatsPie = pie _.map factions, (faction) -> faction: faction.name, seats: seats[faction.name]
  console.log seatsPie

  parliament = svg.append 'g'
  .attr 'width', Viewport.width
  .attr 'height', Viewport.height
  .attr 'transform', "translate(#{Viewport.width/2}, #{Viewport.height})"

  g = parliament.selectAll '.faction'
  .data seatsPie
  .enter().append 'g'
  .attr 'class', (seats) -> 'arc ' + _.find(factions, name: seats.data.faction).class

  arc = d3.svg.arc()
  .outerRadius Arc.outerR
  .innerRadius Arc.innerR

  g.append 'path'
  .attr 'd', arc

  # Now draw circles for the representatives
  force = d3.layout.force()
  .nodes data
  .size [Viewport.width, Viewport.height*2]
  .gravity .05
  .charge 0
  .on 'tick', tick
  .start()

  node = svg.selectAll 'circle'
  .data data
  .enter().append 'circle'
  .attr 'class', (rep) -> _.find(factions, name: rep.fraktion).class
  .attr 'r', (rep) -> rep.radius
  .attr 'cx', (rep) -> rep.x
  .attr 'cy', (rep) -> rep.y

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
