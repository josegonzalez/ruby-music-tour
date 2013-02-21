(function() {
  //ben's js
  var numEvents = 7;
  var url = "http://api.seatgeek.com/2/events?performers.slug=jason-aldean&per_page=" + numEvents + "&format=json&callback=fireEvent";
  $.ajax({
    url: url,
    success: function(data) {
      var events = data.events;
      var firstDate = Date.parse(events[0].datetime_local);
      var timespan = Date.parse(events.last().datetime_local) - firstDate; //optionally use 'new Date()' to start timespan from current date

      for (var i = 0; i < events.length; i++) {
        events[i].date_shift_from_zero = (Date.parse(events[i].datetime_local) - firstDate)/timespan;
        var bufferWidth = 100;
        var pixelShift = ($("div#timeline").width() - bufferWidth) * events[i].date_shift_from_zero - 16 + (0.5 * bufferWidth);

        var html = "<div class='timeline-points' style='margin-left: " + Math.round(pixelShift) + "px'>" + (i + 1) + "</div>";
        $("div#timeline-points").append(html);
        console.log("date " + (i + 1) + ": " + events[i].datetime_local);
      }

      $("div.timeline-points").hover(function() {
        $(this).toggleClass("active");
        console.log("test");
      });
    },
    dataType: 'jsonp'}
  );

  Array.prototype.last = function() {return this[this.length-1];}

  //jose's js
  var width = 790,
      height = 500;

  var radius = d3.scale.sqrt()
      .domain([0, 1e6])
      .range([0, 10]);

  var unselected_radius = radius(2500000);

  var projection = albersUsa();

  var path = d3.geo.path()
      .projection(projection)
      .pointRadius(1.5);

  var svg = d3.select(".tour-map").append("svg")
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("width", width)
      .attr("height", height);

  svg.append("filter")
      .attr("id", "glow")
    .append("feGaussianBlur")
      .attr("stdDeviation", 5);

  queue()
      .defer(d3.json, "/us.json")
      .defer(d3.jsonp, "http://api.seatgeek.com/2/events?performers.slug=jason-aldean&per_page=" + numEvents + "&callback={callback}")
      .await(ready);

  function ready(error, us, events) {
    // translucent outer glow
    svg.append("path")
        .datum(topojson.object(us, us.objects.land))
        .attr("d", path)
        .attr("class", "land-glow");

    // states
    topojson.object(us, us.objects.states).geometries.forEach(function(o, index) {
      svg.append("path")
          .datum(o)
          .attr("d", path);
    });

    // collect the events
    events.events.forEach(function(evt, index) {
      var il = (index + 1).toString().length,
          location = evt.venue.location,
          coords = _.extend({}, [location.lon, location.lat]);

      svg.append("path")
        .datum({type: "MultiPoint", coordinates: [coords]})
        .attr("class", "points event-" + evt.id)
        .attr("d", path.pointRadius(function(d) { return unselected_radius; }));

       svg.append("text")
          .attr("class", "place-label event-" + evt.id)
          .attr("event_id", evt.id)
          .attr("transform", function(d) { return "translate(" + projection(coords) + ")"; })
          .attr("x", function(d) { return coords[0] > -1 ? (il > 1 ? 12 : 6) : (il > 1 ? -12 : -6); })
          .attr("y", function(d) { return coords[1] > -1 ? 1 : -1; })
          .attr("dy", ".35em")
          .text(function(d) { return index + 1; });
    });

    $("svg .place-label").hover(function() {
      var $el = $(".points.event-" + $(this).attr("event_id"));
      $el.attr("class", $el.attr("class") + " active");
    },
    function() {
      var $el = $(".points.event-" + $(this).attr("event_id"));
      $el.attr("class", $el.attr("class").replace(" active", ""));
    });
  }

})();