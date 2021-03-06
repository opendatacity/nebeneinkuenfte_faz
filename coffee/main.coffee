'use strict'

# Warning: This code is hideous.

# I solemnly swear that I will never write code as unmaintainable
# as this mess again. Sorry.

Viewport = width: 700, height: 350, center: {x: 350, y: 350}
Arc = innerR: 80, outerR: 350, phiMax: 180
Rep = r: 5, spacing: 12

Factions = [
  { name: 'Die Linke',             class: 'linke' }
  { name: 'SPD',                   class: 'spd' }
  { name: 'Bündnis 90/Die Grünen', class: 'gruene' }
  { name: 'FDP',                   class: 'fdp' } # It's better to be future-proof than optimistic.
  { name: 'CDU/CSU',               class: 'cducsu' }
]

termBegin = new Date 2013, 9, 22

T = (string) ->
  return dictionary[string] if dictionary[string]
  return string
Tp = (number, string) ->
  return dictionary[string+number] if dictionary[string+number]
  return number + ' ' + dictionary[string+'Plural'] if number != 1 and dictionary[string+'Plural']
  return number + ' ' + dictionary[string] if dictionary[string]
  return number + ' ' + string
abbreviate = (string) ->
  return abbreviations[string] if abbreviations[string]
  return string
formatDate = (date) ->
  date.getDate() + '.&nbsp;' +
  T('month'+date.getMonth()) + ' ' +
  date.getFullYear()

NebeneinkunftMinAmounts = [ 0.01, 1000, 3500, 7000, 15000, 30000, 50000, 75000, 100000, 150000, 250000 ]
PeriodLength =
  monatlich: 1000 * 60 * 60 * 24 * 365 / 12,
  'jährlich': 1000 * 60 * 60 * 24 * 365

nebeneinkunftMinAmount = (einkunft) ->
  if einkunft.periodical is 'einmalig'
    count = 1
  else
    begin = +new Date(einkunft.begin) or +termBegin
    end = +new Date(einkunft.end) or Date.now()
    duration = end - begin
    count = Math.max 1, (duration / PeriodLength[einkunft.periodical]) | 0
  return NebeneinkunftMinAmounts[einkunft.level] * count

nebeneinkuenfteMinSum = (rep) ->
  return 0 if rep.nebeneinkuenfte.length == 0
  sum = rep.nebeneinkuenfte.reduce ((sum, einkunft) -> sum += nebeneinkunftMinAmount(einkunft)), 0
  return Math.max parseInt(sum, 10), 1

formatCurrency = _.memoize (amount, html = true) ->
  prepend = if html then '<span class="digitGroup">' else ''
  append = if html then '</span>' else ''
  glue = if html then '' else ' '
  currency = if html then '<span class="euro">€</span>' else '€'
  amount = String Math.floor amount
  groups = []
  while amount.length > 0
    group = amount.substr -3, 3
    groups.unshift prepend + group + append
    amount = amount.substr 0, amount.length - 3
  return groups.join(glue) + glue + currency

updateCheckboxLabelState = (checkbox) ->
  if checkbox.length > 1
    return checkbox.each (i, box) -> updateCheckboxLabelState box

  checked = $(checkbox).prop 'checked'
  checked = true if typeof checked is 'undefined'
  land = $(checkbox).attr 'value'
  $(checkbox).parent('label').toggleClass 'active', checked
  path = $("path[title=#{land}]")
  if checked
    path.attr 'class', 'active'
  else
    path.attr 'class', 'inactive'
  showOrHideConvenienceButtons checkbox

showOrHideConvenienceButtons = (checkbox) ->
  fieldset = $(checkbox).parents('fieldset')
  all = fieldset.find ':checkbox'
  checked = fieldset.find ':checkbox:checked'
  buttons = fieldset.find('.convenienceButtons')
  buttons.toggleClass 'allSelected', checked.length == all.length
  buttons.toggleClass 'someSelected', checked.length > 0
  buttons.toggleClass 'noneSelected', checked.length is 0

getEventPosition = (event) ->
  if event.originalEvent.touches
    offset = $(event.target).offset()
    return x: offset.left - $(window).scrollLeft(), y: offset.top - $(window).scrollTop()
  return x: event.pageX - $(window).scrollLeft(), y: event.pageY - $(window).scrollTop()

class RepInspector
  constructor: (selector) ->
    me = this
    @tooltip = $(selector)
    @tooltip.find('tbody').on 'scroll', @handleScroll
    @tooltip.find('.closeButton').on 'click', null, inspector: this, (event) ->
      event.data.inspector.hide()
      event.preventDefault()
    $(window).keyup (event) ->
      me.hide() if event.keyCode is 27 # Escape

  field: (field) -> @tooltip.find ".#{field}"

  update: (rep) ->
    @rep = rep
    minSum = formatCurrency rep.nebeneinkuenfteMinSum, true
    @field('name')        .text rep.name
                          .attr 'href', rep.url
    @field('faction')     .text T rep.fraktion
                          .attr 'class', 'faction ' + _.find(Factions, name: rep.fraktion).class
    @field('land')        .text rep.land
    @field('mandate')     .text T rep.mandat
    @field('constituency').text rep.wahlkreis
    @field('minSum')      .html minSum
    @field('ended')       .toggleClass 'hidden', !rep.ended
                          .html if rep.ended then 'ausgeschieden am ' + formatDate(rep.ended) else ''

    @field('count')       .text Tp(rep.nebeneinkuenfte.length, 'Nebentaetigkeit')

    table = @tooltip.find 'table'
    tableBody = table.find 'tbody'
    tableRow = tableBody.find('tr').first().clone()
    tableBody.empty()

    for item in rep.nebeneinkuenfte
      row = tableRow.clone()
      row.addClass 'cat' + item.level
      row.find('.description').text item.text
      row.find('.minAmount').html formatCurrency nebeneinkunftMinAmount(item), true
      tableBody.append row

  handleScroll: (arg) ->
    table = if arg.target then $(arg.target) else $(arg)
    scrollTop = table.scrollTop()
    max = table.prop 'scrollHeight'
    height = table.height()

    scrollBottom = max - scrollTop - height

    topShadow = Math.max 0, 0.5 * Math.min(scrollTop, 15)
    bottomShadow = Math.max 0, 0.5 * Math.min(scrollBottom, 15)

    table.siblings('thead').css 'box-shadow', "0 #{topShadow}px .5em -.5em rgba(0, 0, 0, .3)"
    table.siblings('tfoot').css 'box-shadow', "0 -#{bottomShadow}px .5em -.5em rgba(0, 0, 0, .3)"

  measure: ->
    # If it's currently hidden, we'll first move it to [0, 0] to measure it
    # as the browser may otherwise interfere and do its own scaling.
    clone = @tooltip.clone()
    clone.addClass 'clone'
    clone.removeAttr 'id style'
    clone.insertAfter @tooltip
    @width = clone.outerWidth()+1
    @height = clone.outerHeight(true)
    clone.remove()
  show: (position) ->
    @measure()
    @moveTo position if position
    @tooltip.addClass('visible').removeClass('hidden')
    @visible = true
    @unfix() if @fixed
  hide: ->
    @tooltip.addClass('hidden').removeClass('visible')
    @visible = false
    @unfix()
  moveTo: (@position) ->
    # See if the tooltip would extend beyond the side of the window.
    topMargin = parseInt @tooltip.css('marginTop'), 10
    x = @position.x
    y = @position.y
    if x + @width > windowSize.width
      x = Math.max 0, windowSize.width - @width
    if y + @height > windowSize.height
      y = Math.max 0 - topMargin, windowSize.height - @height
    @tooltip.css top: y, left: x
  unfix: ->
    @fixed = false
    @tooltip.addClass('moving').removeClass('fixed')
    $('body').removeClass 'inspectorFixed'
    @measure()
    @moveTo @position
  fix: ->
    @fixed = true
    @tooltip.addClass('fixed').removeClass('moving')
    $('body').addClass 'inspectorFixed'
    tbody = @tooltip.find('tbody')
    tbody.scrollTop 0
    tbody.css maxHeight: Math.min 300, $(window).height() - 170
    @handleScroll tbody
    @measure()
    @moveTo @position

JSONSuccess = (data) ->
  lastUpdated = new Date data.date
  $('.lastUpdated').html 'Stand der Daten: ' +
    formatDate(lastUpdated) + '.'

  data = data.data.filter (f) -> !f.hasLeftParliament
  window._data = _(data)

  # Which of the possible factions are actually represented in parliament?
  factions = Factions.filter (faction) -> _data.find fraktion: faction.name

  _data.each (rep, i) ->
    rep.nebeneinkuenfteMinSum = nebeneinkuenfteMinSum rep
    console.log(rep.nebeneinkuenfteMinSum, rep)
    rep.nebeneinkuenfteCount = rep.nebeneinkuenfte.length
    rep.alphabeticOrder = i
    rep.nebeneinkuenfte.sort (a, b) -> b.level - a.level
    rep.fraktion = rep.fraktion.replace /\s+\*/g, ''
    rep.ended = new Date(rep.ended) if rep.ended

  dataByFaction = _data.groupBy('fraktion').value()
  seats = _.mapValues dataByFaction, (f) -> f.length
  totalSeats = _.reduce seats, (sum, num) -> sum + num

  minSumPerSeat = _.mapValues dataByFaction, (representatives, faction) ->
    minSum = _.reduce representatives, ((sum, rep) -> sum + rep.nebeneinkuenfteMinSum), 0
    factionSeats = seats[faction]
    minSum/factionSeats
  maxNebeneinkuenfteMinSum = _.max(data, 'nebeneinkuenfteMinSum').nebeneinkuenfteMinSum
  repRadiusScaleFactor = 850 / _.max minSumPerSeat

  repRadius = (rep) -> repRadiusScaleFactor * Math.sqrt rep.nebeneinkuenfteMinSum
  _data.each (rep) -> rep.radius = repRadius rep

  data = _data.where (rep) -> rep.nebeneinkuenfteMinSum > 1
  .value()
  # Recalculate dataByFaction from `data`
  dataByFaction = _.groupBy data, 'fraktion'

  # We'll create a clone of the data array that can be sorted in place
  # for the data table
  dataTable =
    data: data.sort (rep1, rep2) -> rep2.nebeneinkuenfteMinSum - rep1.nebeneinkuenfteMinSum
    sortedBy: 'nebeneinkuenfteMinSum'
    sortOrder: -1

  tick = (e) ->
    alpha = e.alpha * e.alpha
    qt = d3.geom.quadtree data
    data.forEach (rep, i) ->
      dX = rep.x - Viewport.center.x
      dY = rep.y - Viewport.center.y
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
        destinationX = Viewport.center.x + dX
        destinationY = Viewport.center.y + dY
        rep.x = destinationX
        rep.y = destinationY

      collide(.3, qt)(rep) # .4

    unless window.animationFrameRequested
      window.requestAnimationFrame ->
        window.animationFrameRequested = false
        node.attr 'cx', (d) -> d.x
        node.attr 'cy', (d) -> d.y
      window.animationFrameRequested = true

  collide = (alpha, qt) ->
    return (d) ->
      r = d.radius * 3
      nx1 = d.x - r
      nx2 = d.x + r
      ny1 = d.y - r
      ny2 = d.y + r
      qt.visit (quad, x1, y1, x2, y2) ->
        if quad.point and quad.point isnt d and quad.point.fraktion is d.fraktion
          w = d.x - quad.point.x
          h = d.y - quad.point.y
          l = Math.sqrt(w*w + h*h)
          r = d.radius + quad.point.radius + 1
          if l < r
            deltaL = (l - r) / l * alpha
            d.x -= w *= deltaL
            d.y -= h *= deltaL
            quad.point.x += w
            quad.point.y += h
        return x1 > nx2 or x2 < nx1 or y1 > ny2 or y2 < ny1

  svg = d3.select '#parliament'
  .attr 'width', Viewport.width
  .attr 'height', Viewport.height + 10
  .attr 'viewBox', "0 0 #{Viewport.width} #{Viewport.height}"

  # Draw parliament wedges first
  pie = d3.layout.pie()
  .sort null
  .value (faction) -> faction.seats
  .startAngle Math.PI * -0.5
  .endAngle Math.PI * 0.5

  # Now we finally have something to display to the user. About time, too.
  $(document.body).removeClass 'loading'

  # We'll be needing this not only for the pie chart but also in the collision
  # detector to make sure that representatives stay inside their own faction
  seatsPie = pie _.map factions, (faction) -> faction: faction.name, seats: seats[faction.name]

  # Now we know where the factions are, we can initalize the representatives
  # with sensible values.
  initializeRepPositions = ->
    for faction in seatsPie
      factionName = faction.data.faction

      # How many reps above the significance threshold are in this faction?
      # This is not the same as the number of seats!
      factionRepCount = dataByFaction[factionName].length
      deltaAngles = faction.endAngle - faction.startAngle
      height = Viewport.height
      _(dataByFaction[factionName]).sortBy('nebeneinkuenfteMinSum').each (rep, i) ->
        i = 2 * (i % 5) + 1
        height += 2.5 * rep.radius if i == 1
        rep.initialX = Viewport.center.x + height * Math.sin(faction.startAngle + deltaAngles * i * 0.1)
        rep.initialY = Viewport.center.y - height * Math.cos(faction.startAngle + deltaAngles * i * 0.1)

  parliament = svg.append 'g'
  .attr 'width', Viewport.width
  .attr 'height', Viewport.height
  .attr 'transform', "translate(#{Viewport.center.x}, #{Viewport.center.y})"

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
  .gravity .1 # .13
  .charge (d)         -> -2 * d.radius - 1
  .chargeDistance (d) ->  3 * d.radius
  .friction .9 # .75
  .on 'tick', tick

  node = null
  initializeRepPositions()
  window.drawRepresentatives = (initialize) ->
    node = svg.selectAll 'circle'
    .data data

    node.enter().append 'circle'
    .attr 'class', (rep) -> _.find(factions, name: rep.fraktion).class
    .attr 'data-name', (rep) -> rep.name
    .attr 'cx', (rep) -> rep.x = rep.initialX
    .attr 'cy', (rep) -> rep.y = rep.initialY

    node.transition()
    .attr 'r', (rep) -> rep.radius
    .style 'opacity', (rep) ->
      if rep.radius < 1 then 0 else if rep.ended then 0.3 else 1

    node.exit().remove()

    force.start() if initialize
    force.alpha .07
    window.deferredAnimation = false
    null

  table = d3.select '#tableView tbody'
  rowHTML = $('#tableView tbody tr').remove().html()
  rows = table.selectAll('tr').data(dataTable.data)

  tableRow = (rep) ->
    $ rowHTML.replace /\{(?:([^\}]*?):)?([^\}]*?)\}/g, (match, type, property) ->
      return formatCurrency rep[property] if type is 'currency'
      return abbreviate rep[property] if type is 'abbr'
      T rep[property]

  rows.enter().append 'tr'
  .each (rep) -> $(this).html tableRow(rep)
  .style 'opacity', (rep) -> if rep.ended then 0.5 else 1

  rows.select '.faction'
  .attr 'class', (rep) -> 'faction ' + _.find(Factions, name: rep.fraktion).class

  rows.select '.bar'
  .style 'width', (rep) -> rep.nebeneinkuenfteMinSum / maxNebeneinkuenfteMinSum * 100 + '%'

  $('#tableView tfoot td').html Math.round((1 - data.length / _data.value().length) * 100) +
    '&nbsp;Prozent sind bislang neben ihrem Mandat keinen vergüteten Tätigkeiten nachgegangen.'

  updateTable = ->
    rows.attr 'class', (rep) -> if rep.radius >= 1 then 'visible' else 'hidden'

  sortTable = (sortField) ->
    # If the array is _already_ sorted by this field, reverse the sort order
    if dataTable.sortedBy is sortField
      dataTable.sortOrder *= -1
    else
      dataTable.sortOrder = 1
    table.selectAll 'tr'
    .sort (rep1, rep2) ->
      return -dataTable.sortOrder if rep2[sortField] > rep1[sortField]
      return  dataTable.sortOrder if rep2[sortField] < rep1[sortField]
      return 0

    dataTable.sortedBy = sortField

  $('#tableView thead').on 'click', 'th', (event) ->
    event.preventDefault()
    sortField = $(this).attr 'data-sortfield'
    sortTable sortField
    $(this).parent().children().removeClass 'sorted-1 sorted1'
    $(this).addClass "sorted#{dataTable.sortOrder}"

  $('#tableView tbody').on 'click', 'tr', (event) ->
    rep = d3.select(this).datum()
    position = getEventPosition event
    inspector.update rep
    inspector.show position
    inspector.fix()

  filterData = (filter) ->
    _(data).each (rep) ->
      visible = _.reduce filter, (sum, filterValues, filterProperty) ->
        keep = _.contains filterValues, rep[filterProperty]
        return Boolean(sum * keep)
      , true
      if visible
        rep.radius = repRadius rep
        rep.x = rep.initialX unless rep.previouslyVisible
        rep.y = rep.initialY unless rep.previouslyVisible
      else
        rep.radius = 1e-2
      rep.previouslyVisible = visible
      return null

  filterData {}

  drawRepresentatives(true)
  updateTable()

  inspector = new RepInspector '#repInspector'

  $('form').on 'submit', (event) ->
    if $(this).data 'suspendSumbit'
      event.preventDefault()
      return false
    form = $ this
    inputs = form.find 'input[type=hidden], :checkbox:checked'
    event.preventDefault()

    filter = _(inputs.get())
    .groupBy('name')
    .mapValues (inputs) -> inputs.map (input) -> $(input).val()
    .value()

    filterData filter
    if $('#parliamentView:visible').length > 0
      drawRepresentatives()
    else # We need to defer the animation until the Parliament tab is shown
      window.deferredAnimation = true
    updateTable()
    #hideRepresentatives groupedData.false if groupedData.false

  $('form').on 'change', 'input', ->
    changedCheckbox = this
    if $(changedCheckbox).parents('fieldset').find(':checked').length == 0
      $(changedCheckbox).parents('fieldset').find(':checkbox').each (index, checkbox) ->
        $(checkbox).prop('checked', true) unless checkbox is changedCheckbox
        updateCheckboxLabelState checkbox
    $(changedCheckbox).submit()
    updateCheckboxLabelState changedCheckbox

  $('svg').on 'mousemove touchend', 'circle', (event) ->
    position = getEventPosition event
    rep = d3.select(this).datum()
    unless inspector.visible
      inspector.update rep
      inspector.show position
    unless inspector.fixed
      inspector.moveTo position

  $('svg').on 'mouseleave', 'circle', -> inspector.hide() unless inspector.fixed

  $(document).on 'mouseup', (event) ->
    inspector.hide() if inspector.fixed and $(event.target).parents('.repInspector').length < 1

  $('svg').on 'click', 'circle', (event) ->
    position = getEventPosition event
    rep = d3.select(this).datum()
    if inspector.fixed and d3.select(this).datum() is inspector.rep
      inspector.unfix()
      inspector.moveTo position
    else if inspector.fixed
      inspector.update rep
      inspector.show position
      inspector.fix() if event.originalEvent.touches
    else
      event.stopPropagation() # Otherwise the click would fire on the document node and hide the inspector
      inspector.fix()
    event.stopPropagation()

  $('.toggler').on 'click', (event) ->
    event.stopPropagation()
    $(this.getAttribute 'href').toggleClass 'hidden'

  $(document.body).on 'mousedown touchstart', (event) ->
    t = $(event.target)
    $('.togglee').addClass 'hidden' unless t.hasClass('togglee') or t.parents('.togglee').length > 0

  $(window).trigger('resize')

$(document).ready ->
  FastClick.attach document.body
  $.getJSON window.dataPath, JSONSuccess

  if Modernizr.touch
    $('html, body').css
      width: Math.min(window.screen.availWidth - 20, 570) + 'px'
      height: window.innerHeight + 'px'

  # Collapse everything that's supposed to start collapsed
  $('.startCollapsed').each (i, e) ->
    $(e).css height: $(e).height()
    .addClass 'collapsed'
    .removeClass 'startCollapsed'

  $('#map').on 'mouseenter', 'path', ->
    # Move to the top of the map's child nodes
    node = $ this
    node.insertAfter node.siblings().last()

  $('#map').on 'mouseleave', 'path', ->
    node = $ this
    nodeClass = node.attr 'class'
    if nodeClass is 'active'
      node.insertAfter node.siblings().last()
    else
      node.insertBefore node.siblings().first()

  checkAllInParentFieldset = (element) ->
    checkboxes = $(element).parents('fieldset').find(':checkbox')
    checkboxes.prop 'checked', true
    updateCheckboxLabelState checkboxes
    $(element).parents('form').submit()

  $('#map').on 'dblclick', 'path', -> checkAllInParentFieldset this

  # Count clicks on the map so we can display a hint about multiple selection
  # after the second click
  mapClickCount = 0
  mapClickCountResetTimeout = null
  mapUserHasLearnt = false
  ignoreNext = false
  $('#map').on 'mouseup', 'path', (event) ->
    mapClickCount++
    clearTimeout mapClickCountResetTimeout
    mapClickCountResetTimeout = setTimeout (-> mapClickCount = 0), 15000
    event.preventDefault() # To avoid grey rectangle on iOS

    return ignoreNext = false if ignoreNext

    selectMultiple = event.shiftKey or event.metaKey or event.ctrlKey
    land = $(this).attr 'title'
    fieldset = $(this).parents 'fieldset'

    # Return to "all selected" if the user clicks on the only selected land
    selectAll = $(this).attr('class') == 'active' and $(this).siblings('.active').length is 0

    if selectAll
      fieldset.find(':checkbox').prop('checked', true)
      $(this).parents('form').triggerHandler 'submit'
    else
      fieldset.find(':checkbox').prop('checked', false) unless selectMultiple
      checkbox = fieldset.find "input[value=#{land}]"
      checkbox.click()

    updateCheckboxLabelState $(':checkbox')

    mapUserHasLearnt = true if selectMultiple

    hint = fieldset.find('.uiHint')
    if mapClickCount == 2 and not mapUserHasLearnt
      hint.removeClass 'collapsed'
      setTimeout (-> hint.addClass 'collapsed'), 8000
    else if mapClickCount > 2 and mapUserHasLearnt
      hint.addClass 'collapsed'

  # Add 'Select All' and 'Invert Selection buttons to fieldsets'
  $('fieldset').each (i, fieldset) ->
    div = $ '<div class="convenienceButtons">'
    div.append $ '<input type="button" value="alle" title="Alle auswählen" class="selectAll">'
    div.append $ '<input type="button" value="umkehren" title="Auswahl umkehren" class="invertSelection">'
    $(fieldset).append div

  updateCheckboxLabelState $(':checkbox')

  $('.invertSelection, .selectAll').click (event) ->
    fieldset = $(this).parents('fieldset')
    selector = ':checkbox'
    selector += ':not(:checked)' if $(this).hasClass 'selectAll'
    checkboxes = fieldset.find selector
    checkboxes.each (i, c) ->
      $(c).prop 'checked', !$(c).prop 'checked'
      updateCheckboxLabelState c
    $(this).parents('form').triggerHandler 'submit'

  # Make tab buttons do something
  tabs = {}
  $('nav.tabs').on 'click', 'a', (event) ->
    event.preventDefault()
    return null if $(this).hasClass 'active'

    $(window).scrollTop 0
    tabs.selected = this
    tabs.selectedID = $(tabs.selected).attr('href')
    tabs.anchors = $(tabs.selected).parents('nav').find('a') unless tabs.anchors

    tabs.anchors.each (index, a) ->
      if a is tabs.selected
        $(a).addClass('active').removeClass('inactive')
        $(tabs.selectedID).addClass('visible').removeClass('hidden')
      else
        anchorID = $(a).attr('href')
        $(a).addClass('inactive').removeClass('active')
        $(anchorID).addClass('hidden').removeClass('visible')
  $('.tabs .parliament').click ->
    if window.deferredAnimation
      drawRepresentatives()
  $('.tabs .parliament').trigger 'click'

  $(window).on 'resize', (event) ->
    window.windowSize = width: $(window).width(), height: $(window).height()
    wScale = Math.min 1, (windowSize.width - 16) / Viewport.width
    hScale = Math.min 1, (windowSize.height - 16) / (Viewport.height + 10)
    scale = Math.min wScale, hScale
    $('#parliament, #parliamentView').height (Viewport.height + 10) * scale
    .width Viewport.width * scale

    if window.deferredAnimation
      drawRepresentatives()

    # Due to the variable height of the parliament we can't reliably use media
    # queries. Instead we'll attach/remove classes from the body depending on
    # the most suitable layout.
    body = $('body')
    vSpace = windowSize.height - 26 - Viewport.height * scale
    hSpace = windowSize.width - 16 - Viewport.width * scale
    if vSpace < 300 or vSpace < 500 and Modernizr.touch
      body.removeClass('tall').addClass('short')
    else
      body.addClass('tall').removeClass('short')

    if hSpace > 220
      body.addClass('wide').removeClass('narrow')
    else
      body.removeClass('wide').addClass('narrow')

    if windowSize.width >= 900 and tabs.selectedID is '#filterView'
      $('.tabs .parliament').trigger 'click'
  $(window).triggerHandler 'resize'

# You read this far? That sort of devotion deserves a limerick!
#
# There once was a geek from Berlin
# With a project he was keen to begin.
#   And – much though he wrote –
#   He never refactored the code
# That still works but causes him chagrin.
