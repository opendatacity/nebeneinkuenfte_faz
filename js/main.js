(function() {
  'use strict';
  var Arc, Factions, JSONSuccess, NebeneinkunftMinAmounts, Rep, RepInspector, T, Tp, Viewport, abbreviate, formatCurrency, getEventPosition, nebeneinkuenfteMinSum, showOrHideConvenienceButtons, updateCheckboxLabelState;

  Viewport = {
    width: 700,
    height: 350,
    center: {
      x: 350,
      y: 350
    }
  };

  Arc = {
    innerR: 80,
    outerR: 350,
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

  abbreviate = function(string) {
    if (abbreviations[string]) {
      return abbreviations[string];
    }
    return string;
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

  formatCurrency = _.memoize(function(amount, html) {
    var append, currency, glue, group, groups, prepend;
    if (html == null) {
      html = true;
    }
    prepend = html ? '<span class="digitGroup">' : '';
    append = html ? '</span>' : '';
    glue = html ? '' : ' ';
    currency = html ? '<span class="euro">€</span>' : '€';
    amount = String(Math.floor(amount));
    groups = [];
    while (amount.length > 0) {
      group = amount.substr(-3, 3);
      groups.unshift(prepend + group + append);
      amount = amount.substr(0, amount.length - 3);
    }
    return groups.join(glue) + glue + currency;
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
    buttons.toggleClass('allSelected', checked.length === all.length);
    buttons.toggleClass('someSelected', checked.length > 0);
    return buttons.toggleClass('noneSelected', checked.length === 0);
  };

  getEventPosition = function(event) {
    var offset;
    if (event.originalEvent.touches) {
      offset = $(event.target).offset();
      return {
        x: offset.left - $(window).scrollLeft(),
        y: offset.top - $(window).scrollTop()
      };
    }
    return {
      x: event.pageX - $(window).scrollLeft(),
      y: event.pageY - $(window).scrollTop()
    };
  };

  RepInspector = (function() {
    function RepInspector(selector) {
      var me;
      me = this;
      this.tooltip = $(selector);
      this.tooltip.find('tbody').on('scroll', this.handleScroll);
      this.tooltip.find('.closeButton').on('click', null, {
        inspector: this
      }, function(event) {
        event.data.inspector.hide();
        return event.preventDefault();
      });
      $(window).keyup(function(event) {
        if (event.keyCode === 27) {
          return me.hide();
        }
      });
    }

    RepInspector.prototype.field = function(field) {
      return this.tooltip.find("." + field);
    };

    RepInspector.prototype.update = function(rep) {
      var item, minSum, row, table, tableBody, tableRow, _i, _len, _ref, _results;
      this.rep = rep;
      minSum = formatCurrency(rep.nebeneinkuenfteMinSum, true);
      this.field('name').text(rep.name).attr('href', rep.url);
      this.field('faction').text(T(rep.fraktion)).attr('class', 'faction ' + _.find(Factions, {
        name: rep.fraktion
      })["class"]);
      this.field('land').text(rep.land);
      this.field('mandate').text(T(rep.mandat));
      this.field('constituency').text(rep.wahlkreis);
      this.field('minSum').html(minSum);
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
        row.find('.minAmount').html(formatCurrency(NebeneinkunftMinAmounts[item.level], true));
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
      topShadow = Math.max(0, 0.5 * Math.min(scrollTop, 15));
      bottomShadow = Math.max(0, 0.5 * Math.min(scrollBottom, 15));
      table.siblings('thead').css('box-shadow', "0 " + topShadow + "px .5em -.5em rgba(0, 0, 0, .3)");
      return table.siblings('tfoot').css('box-shadow', "0 -" + bottomShadow + "px .5em -.5em rgba(0, 0, 0, .3)");
    };

    RepInspector.prototype.measure = function() {
      var clone;
      clone = this.tooltip.clone();
      clone.addClass('clone');
      clone.removeAttr('id style');
      clone.insertAfter(this.tooltip);
      this.width = clone.outerWidth() + 1;
      this.height = clone.outerHeight(true);
      return clone.remove();
    };

    RepInspector.prototype.show = function(position) {
      this.measure();
      if (position) {
        this.moveTo(position);
      }
      this.tooltip.addClass('visible').removeClass('hidden');
      this.visible = true;
      if (this.fixed) {
        return this.unfix();
      }
    };

    RepInspector.prototype.hide = function() {
      this.tooltip.addClass('hidden').removeClass('visible');
      this.visible = false;
      return this.unfix();
    };

    RepInspector.prototype.moveTo = function(position) {
      var topMargin, x, y;
      this.position = position;
      topMargin = parseInt(this.tooltip.css('marginTop'), 10);
      x = this.position.x;
      y = this.position.y;
      if (x + this.width > windowSize.width) {
        x = Math.max(0, windowSize.width - this.width);
      }
      if (y + this.height > windowSize.height) {
        y = Math.max(0 - topMargin, windowSize.height - this.height);
      }
      return this.tooltip.css({
        top: y,
        left: x
      });
    };

    RepInspector.prototype.unfix = function() {
      this.fixed = false;
      this.tooltip.addClass('moving').removeClass('fixed');
      $('body').removeClass('inspectorFixed');
      this.measure();
      return this.moveTo(this.position);
    };

    RepInspector.prototype.fix = function() {
      var tbody;
      this.fixed = true;
      this.tooltip.addClass('fixed').removeClass('moving');
      $('body').addClass('inspectorFixed');
      tbody = this.tooltip.find('tbody');
      tbody.scrollTop(0);
      tbody.css({
        maxHeight: Math.min(300, $(window).height() - 170)
      });
      this.handleScroll(tbody);
      this.measure();
      return this.moveTo(this.position);
    };

    return RepInspector;

  })();

  JSONSuccess = function(data) {
    var arc, collide, dataByFaction, dataTable, drawRepresentatives, factions, filterData, force, g, initializeRepPositions, inspector, maxNebeneinkuenfteMinSum, minSumPerSeat, node, parliament, pie, repRadius, repRadiusScaleFactor, rowHTML, rows, seats, seatsPie, sortTable, svg, table, tableRow, tick, totalSeats, updateTable;
    data = data.data;
    window._data = _(data);
    factions = Factions.filter(function(faction) {
      return _data.find({
        fraktion: faction.name
      });
    });
    _data.each(function(rep, i) {
      rep.nebeneinkuenfteMinSum = nebeneinkuenfteMinSum(rep);
      rep.nebeneinkuenfteCount = rep.nebeneinkuenfte.length;
      rep.alphabeticOrder = i;
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
    minSumPerSeat = _.mapValues(dataByFaction, function(representatives, faction) {
      var factionSeats, minSum;
      minSum = _.reduce(representatives, (function(sum, rep) {
        return sum + rep.nebeneinkuenfteMinSum;
      }), 0);
      factionSeats = seats[faction];
      return minSum / factionSeats;
    });
    maxNebeneinkuenfteMinSum = _.max(data, 'nebeneinkuenfteMinSum').nebeneinkuenfteMinSum;
    repRadiusScaleFactor = 850 / _.max(minSumPerSeat);
    repRadius = function(rep) {
      return repRadiusScaleFactor * Math.sqrt(rep.nebeneinkuenfteMinSum);
    };
    _data.each(function(rep) {
      return rep.radius = repRadius(rep);
    });
    data = _data.where(function(rep) {
      return rep.nebeneinkuenfteMinSum > 1;
    }).value();
    dataByFaction = _.groupBy(data, 'fraktion');
    dataTable = {
      data: data.sort(function(rep1, rep2) {
        return rep2.nebeneinkuenfteMinSum - rep1.nebeneinkuenfteMinSum;
      }),
      sortedBy: 'nebeneinkuenfteMinSum',
      sortOrder: -1
    };
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
        return collide(.3, qt)(rep);
      });
      if (!window.animationFrameRequested) {
        window.requestAnimationFrame(function() {
          window.animationFrameRequested = false;
          node.attr('cx', function(d) {
            return d.x;
          });
          return node.attr('cy', function(d) {
            return d.y;
          });
        });
        return window.animationFrameRequested = true;
      }
    };
    collide = function(alpha, qt) {
      return function(d) {
        var nx1, nx2, ny1, ny2, r;
        r = d.radius * 3;
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
            r = d.radius + quad.point.radius + 1;
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
    svg = d3.select('#parliament').attr('width', Viewport.width).attr('height', Viewport.height + 10).attr('viewBox', "0 0 " + Viewport.width + " " + Viewport.height);
    pie = d3.layout.pie().sort(null).value(function(faction) {
      return faction.seats;
    }).startAngle(Math.PI * -0.5).endAngle(Math.PI * 0.5);
    $(document.body).removeClass('loading');
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
        height = Viewport.height;
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
    force = d3.layout.force().nodes(data).size([Viewport.width, Viewport.height * 2]).gravity(.1).charge(function(d) {
      return -2 * d.radius - 1;
    }).chargeDistance(function(d) {
      return 3 * d.radius;
    }).friction(.9).on('tick', tick);
    node = null;
    initializeRepPositions();
    drawRepresentatives = function(initialize) {
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
      }).style('opacity', function(rep) {
        if (rep.radius < 1) {
          return 0;
        } else {
          return 1;
        }
      });
      node.exit().remove();
      if (initialize) {
        force.start();
      }
      return force.alpha(.07);
    };
    table = d3.select('#tableView tbody');
    rowHTML = $('#tableView tbody tr').remove().html();
    rows = table.selectAll('tr').data(dataTable.data);
    tableRow = function(rep) {
      return $(rowHTML.replace(/\{(?:([^\}]*?):)?([^\}]*?)\}/g, function(match, type, property) {
        if (type === 'currency') {
          return formatCurrency(rep[property]);
        }
        if (type === 'abbr') {
          return abbreviate(rep[property]);
        }
        return T(rep[property]);
      }));
    };
    rows.enter().append('tr').each(function(rep) {
      return $(this).html(tableRow(rep));
    });
    rows.select('.faction').attr('class', function(rep) {
      return 'faction ' + _.find(Factions, {
        name: rep.fraktion
      })["class"];
    });
    rows.select('.bar').style('width', function(rep) {
      return rep.nebeneinkuenfteMinSum / maxNebeneinkuenfteMinSum * 100 + '%';
    });
    updateTable = function() {
      return rows.attr('class', function(rep) {
        if (rep.radius >= 1) {
          return 'visible';
        } else {
          return 'hidden';
        }
      });
    };
    sortTable = function(sortField) {
      if (dataTable.sortedBy === sortField) {
        dataTable.sortOrder *= -1;
      } else {
        dataTable.sortOrder = 1;
      }
      table.selectAll('tr').sort(function(rep1, rep2) {
        if (rep2[sortField] > rep1[sortField]) {
          return -dataTable.sortOrder;
        }
        if (rep2[sortField] < rep1[sortField]) {
          return dataTable.sortOrder;
        }
        return 0;
      });
      return dataTable.sortedBy = sortField;
    };
    $('#tableView thead').on('click', 'th', function(event) {
      var sortField;
      event.preventDefault();
      sortField = $(this).attr('data-sortfield');
      sortTable(sortField);
      $(this).parent().children().removeClass('sorted-1 sorted1');
      return $(this).addClass("sorted" + dataTable.sortOrder);
    });
    $('#tableView tbody').on('click', 'tr', function(event) {
      var position, rep;
      rep = d3.select(this).datum();
      position = getEventPosition(event);
      inspector.update(rep);
      inspector.show(position);
      return inspector.fix();
    });
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
    drawRepresentatives(true);
    updateTable();
    inspector = new RepInspector('#repInspector');
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
      filterData(filter);
      drawRepresentatives();
      return updateTable();
    });
    $('form').on('change', 'input', function() {
      var changedCheckbox;
      changedCheckbox = this;
      if ($(changedCheckbox).parents('fieldset').find(':checked').length === 0) {
        $(changedCheckbox).parents('fieldset').find(':checkbox').each(function(index, checkbox) {
          if (checkbox !== changedCheckbox) {
            $(checkbox).prop('checked', true);
          }
          return updateCheckboxLabelState(checkbox);
        });
      }
      $(changedCheckbox).submit();
      return updateCheckboxLabelState(changedCheckbox);
    });
    $('svg').on('mousemove touchend', 'circle', function(event) {
      var position, rep;
      position = getEventPosition(event);
      rep = d3.select(this).datum();
      if (!inspector.visible) {
        inspector.update(rep);
        inspector.show(position);
      }
      if (!inspector.fixed) {
        return inspector.moveTo(position);
      }
    });
    $('svg').on('mouseleave', 'circle', function() {
      if (!inspector.fixed) {
        return inspector.hide();
      }
    });
    $(document).on('mouseup', function(event) {
      if (inspector.fixed && $(event.target).parents('.repInspector').length < 1) {
        return inspector.hide();
      }
    });
    $('svg').on('mouseup touchend', 'circle', function(event) {
      var position, rep;
      position = getEventPosition(event);
      rep = d3.select(this).datum();
      if (inspector.fixed && d3.select(this).datum() === inspector.rep) {
        inspector.unfix();
        return inspector.moveTo(position);
      } else if (inspector.fixed) {
        inspector.update(rep);
        inspector.show(position);
        if (event.originalEvent.touches) {
          return inspector.fix();
        }
      } else {
        event.stopPropagation();
        return inspector.fix();
      }
    });
    $('.toggler').on('click', function(event) {
      event.stopPropagation();
      return $(this.getAttribute('href')).toggleClass('hidden');
    });
    $(document.body).on('mousedown touchstart', function(event) {
      var t;
      t = $(event.target);
      if (!(t.hasClass('togglee') || t.parents('.togglee').length > 0)) {
        return $('.togglee').addClass('hidden');
      }
    });
    return $(window).trigger('resize');
  };

  $(document).ready(function() {
    var checkAllInParentFieldset, ignoreNext, mapClickCount, mapClickCountResetTimeout, mapUserHasLearnt, tabs;
    FastClick.attach(document.body);
    $.getJSON(window.dataPath, JSONSuccess);
    $('.startCollapsed').each(function(i, e) {
      return $(e).css({
        height: $(e).height()
      }).addClass('collapsed').removeClass('startCollapsed');
    });
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
    checkAllInParentFieldset = function(element) {
      var checkboxes;
      checkboxes = $(element).parents('fieldset').find(':checkbox');
      checkboxes.prop('checked', true);
      updateCheckboxLabelState(checkboxes);
      return $(element).parents('form').submit();
    };
    $('#map').on('dblclick', 'path', function() {
      return checkAllInParentFieldset(this);
    });
    mapClickCount = 0;
    mapClickCountResetTimeout = null;
    mapUserHasLearnt = false;
    ignoreNext = false;
    $('#map').on('mouseup', 'path', function(event) {
      var checkbox, fieldset, hint, land, selectAll, selectMultiple;
      mapClickCount++;
      clearTimeout(mapClickCountResetTimeout);
      mapClickCountResetTimeout = setTimeout((function() {
        return mapClickCount = 0;
      }), 15000);
      event.preventDefault();
      if (ignoreNext) {
        return ignoreNext = false;
      }
      selectMultiple = event.shiftKey || event.metaKey || event.ctrlKey;
      land = $(this).attr('title');
      fieldset = $(this).parents('fieldset');
      selectAll = $(this).attr('class') === 'active' && $(this).siblings('.active').length === 0;
      if (selectAll) {
        fieldset.find(':checkbox').prop('checked', true);
        $(this).parents('form').triggerHandler('submit');
      } else {
        if (!selectMultiple) {
          fieldset.find(':checkbox').prop('checked', false);
        }
        checkbox = fieldset.find("input[value=" + land + "]");
        checkbox.click();
      }
      updateCheckboxLabelState($(':checkbox'));
      if (selectMultiple) {
        mapUserHasLearnt = true;
      }
      hint = fieldset.find('.uiHint');
      if (mapClickCount === 2 && !mapUserHasLearnt) {
        hint.removeClass('collapsed');
        return setTimeout((function() {
          return hint.addClass('collapsed');
        }), 8000);
      } else if (mapClickCount > 2 && mapUserHasLearnt) {
        return hint.addClass('collapsed');
      }
    });
    $('fieldset').each(function(i, fieldset) {
      var div;
      div = $('<div class="convenienceButtons">');
      div.append($('<input type="button" value="alle" title="Alle auswählen" class="selectAll">'));
      div.append($('<input type="button" value="umkehren" title="Auswahl umkehren" class="invertSelection">'));
      return $(fieldset).append(div);
    });
    updateCheckboxLabelState($(':checkbox'));
    $('.invertSelection, .selectAll').click(function(event) {
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
    tabs = {};
    $('nav.tabs').on('click', 'a', function(event) {
      event.preventDefault();
      if ($(this).hasClass('active')) {
        return null;
      }
      $(window).scrollTop(0);
      tabs.selected = this;
      tabs.selectedID = $(tabs.selected).attr('href');
      if (!tabs.anchors) {
        tabs.anchors = $(tabs.selected).parents('nav').find('a');
      }
      return tabs.anchors.each(function(index, a) {
        var anchorID;
        if (a === tabs.selected) {
          $(a).addClass('active').removeClass('inactive');
          return $(tabs.selectedID).addClass('visible').removeClass('hidden');
        } else {
          anchorID = $(a).attr('href');
          $(a).addClass('inactive').removeClass('active');
          return $(anchorID).addClass('hidden').removeClass('visible');
        }
      });
    });
    $('.tabs .parliament').trigger('click');
    $(window).on('resize', function(event) {
      var body, hScale, hSpace, scale, vSpace, wScale;
      window.windowSize = {
        width: $(window).width(),
        height: $(window).height()
      };
      wScale = Math.min(1, (windowSize.width - 16) / Viewport.width);
      hScale = Math.min(1, (windowSize.height - 16) / (Viewport.height + 10));
      scale = Math.min(wScale, hScale);
      $('#parliament, #parliamentView').height((Viewport.height + 10) * scale).width(Viewport.width * scale);
      body = $('body');
      vSpace = windowSize.height - 26 - Viewport.height * scale;
      hSpace = windowSize.width - 16 - Viewport.width * scale;
      if (vSpace < 300 || vSpace < 500 && Modernizr.touch) {
        body.removeClass('tall').addClass('short');
      } else {
        body.addClass('tall').removeClass('short');
      }
      if (hSpace > 220) {
        body.addClass('wide').removeClass('narrow');
      } else {
        body.removeClass('wide').addClass('narrow');
      }
      if (windowSize.width >= 900 && tabs.selectedID === '#filterView') {
        return $('.tabs .parliament').trigger('click');
      }
    });
    return $(window).triggerHandler('resize');
  });

}).call(this);

//# sourceMappingURL=main.js.map
