// Generated by CoffeeScript 1.7.1
(function() {
  'use strict';
  var Arc, Factions, NebeneinkunftMinAmounts, Rep, RepInspector, T, Tp, Viewport, formatCurrency, nebeneinkuenfteMinSum, repRadius, showOrHideConvenienceButtons, updateCheckboxLabelState;

  Viewport = {
    width: 800,
    height: 400,
    center: {
      x: 400,
      y: 400
    }
  };

  Arc = {
    innerR: 100,
    outerR: 400,
    phiMax: 180
  };

  Rep = {
    r: 5,
    spacing: 12
  };

  Factions = [
    {
      name: 'Die Linke',
      "class": 'linke'
    }, {
      name: 'SPD',
      "class": 'spd'
    }, {
      name: 'Bündnis 90/Die Grünen',
      "class": 'gruene'
    }, {
      name: 'FDP',
      "class": 'fdp'
    }, {
      name: 'CDU/CSU',
      "class": 'cducsu'
    }
  ];

  T = function(string) {
    if (dictionary[string]) {
      return dictionary[string];
    }
    return string;
  };

  Tp = function(number, string) {
    if (dictionary[string + number]) {
      return dictionary[string + number];
    }
    if (number !== 1 && dictionary[string + 'Plural']) {
      return number + ' ' + dictionary[string + 'Plural'];
    }
    if (dictionary[string]) {
      return number + ' ' + dictionary[string];
    }
    return number + ' ' + string;
  };

  NebeneinkunftMinAmounts = [0.01, 1000, 3500, 7000, 15000, 30000, 50000, 75000, 100000, 150000, 250000];

  nebeneinkuenfteMinSum = function(rep) {
    var sum;
    if (rep.nebeneinkuenfte.length === 0) {
      return 0;
    }
    sum = rep.nebeneinkuenfte.reduce((function(sum, einkunft) {
      return sum += NebeneinkunftMinAmounts[einkunft.level];
    }), 0);
    return Math.max(parseInt(sum, 10), 1);
  };

  formatCurrency = _.memoize(function(amount) {
    var group, groups;
    amount = String(Math.floor(amount));
    groups = [];
    while (amount.length > 0) {
      group = amount.substr(-3, 3);
      groups.unshift(group);
      amount = amount.substr(0, amount.length - 3);
    }
    return groups.join(' ') + ' €';
  });

  updateCheckboxLabelState = function(checkbox) {
    var checked, land, path;
    if (checkbox.length > 1) {
      return checkbox.each(function(i, box) {
        return updateCheckboxLabelState(box);
      });
    }
    checked = $(checkbox).prop('checked');
    if (typeof checked === 'undefined') {
      checked = true;
    }
    land = $(checkbox).attr('value');
    $(checkbox).parent('label').toggleClass('active', checked);
    path = $("path[title=" + land + "]");
    if (checked) {
      path.attr('class', 'active');
    } else {
      path.attr('class', 'inactive');
    }
    return showOrHideConvenienceButtons(checkbox);
  };

  showOrHideConvenienceButtons = function(checkbox) {
    var all, buttons, checked, fieldset;
    fieldset = $(checkbox).parents('fieldset');
    all = fieldset.find(':checkbox');
    checked = fieldset.find(':checkbox:checked');
    buttons = fieldset.find('.convenienceButtons');
    buttons.toggleClass('allChecked', checked.length === all.length);
    buttons.toggleClass('someChecked', checked.length > 0);
    return buttons.toggleClass('noneChecked', checked.length === 0);
  };

  repRadius = function(rep) {
    return 0.07 * Math.sqrt(rep.nebeneinkuenfteMinSum);
  };

  RepInspector = (function() {
    function RepInspector(selector) {
      this.tooltip = $(selector);
      this.tooltip.find('tbody').on('scroll', this.handleScroll);
    }

    RepInspector.prototype.field = function(field) {
      return this.tooltip.find("." + field);
    };

    RepInspector.prototype.update = function(rep) {
      var item, minSum, row, table, tableBody, tableRow, _i, _len, _ref, _results;
      this.rep = rep;
      minSum = formatCurrency(rep.nebeneinkuenfteMinSum);
      this.field('name').text(rep.name).attr('href', rep.url);
      this.field('faction').text(T(rep.fraktion)).attr('class', 'faction ' + _.find(Factions, {
        name: rep.fraktion
      })["class"]);
      this.field('land').text(rep.land);
      this.field('mandate').text(T(rep.mandat));
      this.field('constituency').text(rep.wahlkreis);
      this.field('minSum').text(minSum);
      this.field('count').text(Tp(rep.nebeneinkuenfte.length, 'Nebentaetigkeit'));
      table = this.tooltip.find('table');
      tableBody = table.find('tbody');
      tableRow = tableBody.find('tr').first().clone();
      tableBody.empty();
      _ref = rep.nebeneinkuenfte;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        row = tableRow.clone();
        row.addClass('cat' + item.level);
        row.find('.description').text(item.text);
        row.find('.minAmount').text(formatCurrency(NebeneinkunftMinAmounts[item.level]));
        _results.push(tableBody.append(row));
      }
      return _results;
    };

    RepInspector.prototype.handleScroll = function(arg) {
      var bottomShadow, height, max, scrollBottom, scrollTop, table, topShadow;
      table = arg.target ? $(arg.target) : $(arg);
      scrollTop = table.scrollTop();
      max = table.prop('scrollHeight');
      height = table.height();
      scrollBottom = max - scrollTop - height;
      topShadow = 0.5 * Math.min(scrollTop, 10);
      bottomShadow = 0.5 * Math.min(scrollBottom, 10);
      table.siblings('thead').css('box-shadow', "0 " + topShadow + "px .5em -.3em rgba(0, 0, 0, .2)");
      return table.siblings('tfoot').css('box-shadow', "0 -" + bottomShadow + "px .5em -.3em rgba(0, 0, 0, .2)");
    };

    RepInspector.prototype.measure = function() {
      var positionBackup;
      positionBackup = this.position;
      this.moveTo({
        x: 0,
        y: 0
      });
      this.width = this.tooltip.width();
      this.height = this.tooltip.height();
      return this.moveTo(positionBackup);
    };

    RepInspector.prototype.show = function(position) {
      if (position) {
        this.moveTo(position);
      }
      if (!this.visible) {
        this.measure();
      }
      this.tooltip.addClass('visible').removeClass('hidden');
      this.visible = true;
      return this.unfix();
    };

    RepInspector.prototype.hide = function() {
      this.tooltip.addClass('hidden').removeClass('visible');
      this.visible = false;
      return this.unfix();
    };

    RepInspector.prototype.moveTo = function(position) {
      this.position = position;
      if (this.position.x + this.width > windowSize.width) {
        this.position.x = windowSize.width - this.width;
      }
      if (!this.fixed) {
        return this.tooltip.css({
          top: this.position.y,
          left: this.position.x
        });
      }
    };

    RepInspector.prototype.unfix = function() {
      this.fixed = false;
      return this.tooltip.addClass('moving').removeClass('fixed');
    };

    RepInspector.prototype.fix = function() {
      this.fixed = true;
      this.tooltip.addClass('fixed').removeClass('moving');
      return this.handleScroll(this.tooltip.find('tbody'));
    };

    return RepInspector;

  })();

  $(document).ready(function() {
    $('#map').on('mouseenter', 'path', function() {
      var node;
      node = $(this);
      return node.insertAfter(node.siblings().last());
    });
    $('#map').on('mouseleave', 'path', function() {
      var node, nodeClass;
      node = $(this);
      nodeClass = node.attr('class');
      if (nodeClass === 'active') {
        return node.insertAfter(node.siblings().last());
      } else {
        return node.insertBefore(node.siblings().first());
      }
    });
    $('#map').on('click', 'path', function() {
      var checkbox, land;
      land = $(this).attr('title');
      checkbox = $("input[value=" + land + "]");
      return checkbox.click();
    });
    updateCheckboxLabelState($(':checkbox'));
    $('fieldset').each(function(i, fieldset) {
      var div;
      div = $('<div class="convenienceButtons">');
      div.append($('<input type="button" value="Alle auswählen" class="selectAll">'));
      div.append($('<input type="button" value="Auswahl umkehren" class="invertSelection">'));
      return $(fieldset).append(div);
    });
    return $('.invertSelection, .selectAll').click(function(event) {
      var checkboxes, fieldset, selector;
      fieldset = $(this).parents('fieldset');
      selector = ':checkbox';
      if ($(this).hasClass('selectAll')) {
        selector += ':not(:checked)';
      }
      checkboxes = fieldset.find(selector);
      checkboxes.each(function(i, c) {
        $(c).prop('checked', !$(c).prop('checked'));
        return updateCheckboxLabelState(c);
      });
      return $(this).parents('form').triggerHandler('submit');
    });
  });

  $.getJSON('/data/data.json', function(data) {
    var arc, collide, dataByFaction, drawRepresentatives, factions, filterData, force, g, initializeRepPositions, inspector, node, parliament, pie, seats, seatsPie, smoothen, svg, tick, totalSeats;
    data = data.data;
    window._data = _(data);
    factions = Factions.filter(function(faction) {
      return _data.find({
        fraktion: faction.name
      });
    });
    _data.each(function(rep) {
      rep.nebeneinkuenfteMinSum = nebeneinkuenfteMinSum(rep);
      rep.radius = repRadius(rep);
      return rep.nebeneinkuenfte.sort(function(a, b) {
        return b.level - a.level;
      });
    });
    dataByFaction = _data.groupBy('fraktion').value();
    seats = _.mapValues(dataByFaction, function(f) {
      return f.length;
    });
    totalSeats = _.reduce(seats, function(sum, num) {
      return sum + num;
    });
    data = _data.where(function(rep) {
      return rep.nebeneinkuenfteMinSum > 1;
    }).value();
    console.log(data);
    dataByFaction = _.groupBy(data, 'fraktion');
    tick = function(e) {
      var alpha, qt;
      alpha = e.alpha * e.alpha;
      qt = d3.geom.quadtree(data);
      data.forEach(function(rep, i) {
        var dX, dY, destinationPhi, destinationX, destinationY, factionAngles, maxAngle, minAngle, missing, phi, phiOffset, r;
        dX = rep.x - Viewport.center.x;
        dY = rep.y - Viewport.center.y;
        r = Math.sqrt(dX * dX + dY * dY);
        phi = Math.atan2(dX, -dY);
        phiOffset = Math.atan2(rep.radius, r);
        factionAngles = _.find(seatsPie, function(item) {
          return item.data.faction === rep.fraktion;
        });
        minAngle = factionAngles.startAngle;
        maxAngle = factionAngles.endAngle;
        if (r < Arc.innerR + rep.radius) {
          missing = (Arc.innerR + rep.radius - r) / r;
          rep.x += dX * missing;
          rep.y += dY * missing;
        }
        rep.phi = phi;
        rep.wrongPlacement = false;
        if (phi < minAngle + phiOffset) {
          destinationPhi = minAngle + phiOffset;
          rep.wrongPlacement = true;
        }
        if (phi > maxAngle - phiOffset) {
          destinationPhi = maxAngle - phiOffset;
          rep.wrongPlacement = true;
        }
        if (destinationPhi) {
          r = Math.max(Arc.innerR + rep.radius, r);
          dY = -r * Math.cos(destinationPhi);
          dX = r * Math.sin(destinationPhi);
          destinationX = Viewport.center.x + dX;
          destinationY = Viewport.center.y + dY;
          rep.x = destinationX;
          rep.y = destinationY;
        }
        return collide(.4, qt)(rep);
      });
      node.attr('cx', function(d) {
        return smoothen(d, 'x');
      });
      node.attr('cy', function(d) {
        return smoothen(d, 'y');
      });
      node.classed('wrongPlacement', function(d) {
        return d.wrongPlacement;
      });
      return node.attr('data-phi', function(d) {
        return d.phi;
      });
    };
    smoothen = function(object, dimension) {
      var orderedValues, previousValues;
      if (!object._smooth) {
        object._smooth = {};
      }
      if (!object._smooth[dimension]) {
        object._smooth[dimension] = [];
      }
      previousValues = object._smooth[dimension];
      previousValues.push(object[dimension]);
      if (!(previousValues.length <= 10)) {
        previousValues.shift();
      }
      orderedValues = _.clone(previousValues).sort();
      return orderedValues[orderedValues.length >> 1];
    };
    collide = function(alpha, qt) {
      return function(d) {
        var nx1, nx2, ny1, ny2, r;
        r = d.radius;
        nx1 = d.x - r;
        nx2 = d.x + r;
        ny1 = d.y - r;
        ny2 = d.y + r;
        return qt.visit(function(quad, x1, y1, x2, y2) {
          var deltaL, h, l, w;
          if (quad.point && quad.point !== d && quad.point.fraktion === d.fraktion) {
            w = d.x - quad.point.x;
            h = d.y - quad.point.y;
            l = Math.sqrt(w * w + h * h);
            r = d.radius + quad.point.radius;
            if (l < r) {
              deltaL = (l - r) / l * alpha;
              d.x -= w *= deltaL;
              d.y -= h *= deltaL;
              quad.point.x += w;
              quad.point.y += h;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      };
    };
    svg = d3.select('#parliament').attr('width', Viewport.width).attr('height', Viewport.height);
    pie = d3.layout.pie().sort(null).value(function(faction) {
      return faction.seats;
    }).startAngle(Math.PI * -0.5).endAngle(Math.PI * 0.5);
    seatsPie = pie(_.map(factions, function(faction) {
      return {
        faction: faction.name,
        seats: seats[faction.name]
      };
    }));
    initializeRepPositions = function() {
      var deltaAngles, faction, factionName, factionRepCount, height, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = seatsPie.length; _i < _len; _i++) {
        faction = seatsPie[_i];
        factionName = faction.data.faction;
        factionRepCount = dataByFaction[factionName].length;
        deltaAngles = faction.endAngle - faction.startAngle;
        height = 400;
        _results.push(_(dataByFaction[factionName]).sortBy('nebeneinkuenfteMinSum').each(function(rep, i) {
          i = 2 * (i % 5) + 1;
          if (i === 1) {
            height += 2.5 * rep.radius;
          }
          rep.initialX = Viewport.center.x + height * Math.sin(faction.startAngle + deltaAngles * i * 0.1);
          return rep.initialY = Viewport.center.y - height * Math.cos(faction.startAngle + deltaAngles * i * 0.1);
        }));
      }
      return _results;
    };
    parliament = svg.append('g').attr('width', Viewport.width).attr('height', Viewport.height).attr('transform', "translate(" + Viewport.center.x + ", " + Viewport.center.y + ")");
    g = parliament.selectAll('.faction').data(seatsPie).enter().append('g').attr('class', function(seats) {
      return 'arc ' + _.find(factions, {
        name: seats.data.faction
      })["class"];
    });
    arc = d3.svg.arc().outerRadius(Arc.outerR).innerRadius(Arc.innerR);
    g.append('path').attr('d', arc);
    force = d3.layout.force().nodes(data).size([Viewport.width, Viewport.height * 2]).gravity(.07).charge(function(rep) {
      return -0.5 * rep.radius;
    }).friction(.9).on('tick', tick);
    node = null;
    initializeRepPositions();
    drawRepresentatives = function() {
      node = svg.selectAll('circle').data(data);
      node.enter().append('circle').attr('class', function(rep) {
        return _.find(factions, {
          name: rep.fraktion
        })["class"];
      }).attr('data-name', function(rep) {
        return rep.name;
      }).attr('cx', function(rep) {
        return rep.x = rep.initialX;
      }).attr('cy', function(rep) {
        return rep.y = rep.initialY;
      });
      node.transition().attr('r', function(rep) {
        return rep.radius;
      });
      node.exit().remove();
      return force.start();
    };
    filterData = function(filter) {
      return _(data).each(function(rep) {
        var visible;
        visible = _.reduce(filter, function(sum, filterValues, filterProperty) {
          var keep;
          keep = _.contains(filterValues, rep[filterProperty]);
          return Boolean(sum * keep);
        }, true);
        if (visible) {
          rep.radius = repRadius(rep);
          if (!rep.previouslyVisible) {
            rep.x = rep.initialX;
          }
          if (!rep.previouslyVisible) {
            rep.y = rep.initialY;
          }
        } else {
          rep.radius = 1e-2;
        }
        rep.previouslyVisible = visible;
        return null;
      });
    };
    filterData({});
    drawRepresentatives();
    inspector = new RepInspector('#repInspector');
    inspector.hide();
    $('form').on('submit', function(event) {
      var filter, form, inputs;
      if ($(this).data('suspendSumbit')) {
        event.preventDefault();
        return false;
      }
      form = $(this);
      inputs = form.find('input[type=hidden], :checkbox:checked');
      event.preventDefault();
      filter = _(inputs.get()).groupBy('name').mapValues(function(inputs) {
        return inputs.map(function(input) {
          return $(input).val();
        });
      }).value();
      console.log(filter);
      filterData(filter);
      return drawRepresentatives();
    });
    $('form').on('change', 'input', function() {
      $(this).submit();
      return updateCheckboxLabelState(this);
    });
    $('svg').on('mousemove', 'circle', function(event) {
      var position, rep;
      position = {
        x: event.pageX,
        y: event.pageY
      };
      rep = d3.select(this).datum();
      if (!inspector.fixed) {
        inspector.update(rep);
        return inspector.show(position);
      }
    });
    $('svg').on('mouseleave', 'circle', function() {
      if (!inspector.fixed) {
        return inspector.hide();
      }
    });
    $(document).on('mouseup', function() {
      if (inspector.fixed) {
        return inspector.hide();
      }
    });
    $('svg').on('mouseup', 'circle', function(event) {
      if (inspector.fixed && d3.select(this).datum() === inspector.rep) {
        return inspector.unfix();
      } else if (inspector.fixed) {
        return inspector.hide();
      } else {
        event.stopPropagation();
        return inspector.fix();
      }
    });
    $(window).on('resize', function(event) {
      var scale;
      window.windowSize = {
        width: $(window).width(),
        height: $(window).height()
      };
      scale = Math.min(1, (windowSize.width - 16) / Viewport.width);
      $('#parliament').css({
        transform: "scale(" + scale + ")"
      });
      return $('#parliamentContainer').css({
        width: scale * Viewport.width,
        height: scale * Viewport.height
      });
    });
    return $(window).trigger('resize');
  });

}).call(this);


//# sourceMappingURL=main.map
