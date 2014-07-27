$.getJSON '/data/laender.geojson', (data) ->
  width = 300
  height = 420

  projection = d3.geo.mercator()
  .center [0.5 * (data.bbox[0] + data.bbox[2]), 0.5 * (data.bbox[1] + data.bbox[3])]
  .scale 1800
  .translate [width >> 1, height >> 1]
  .precision .1

  path = d3.geo.path()
  .projection(projection)

  svg = d3.select '#land'
  .append 'svg'
  .attr 'height', height
  .attr 'width', width

  console.log data

  svg.selectAll 'path'
  .data data.features
  .enter().append 'path'
  .attr 'd', path
  .attr 'title', (d) -> d.properties.NAME_1
