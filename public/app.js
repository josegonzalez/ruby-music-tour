(function() {
  var width = 960,
      height = 500;

  var radius = d3.scale.sqrt()
      .domain([0, 1e6])
      .range([0, 10]);

  var unselected_radius = radius(2500000);

  var projection = albersUsa();

  var path = d3.geo.path()
      .projection(projection)
      .pointRadius(1.5);

  var svg = d3.select("body").append("svg")
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("width", width)
      .attr("height", height);

  svg.append("filter")
      .attr("id", "glow")
    .append("feGaussianBlur")
      .attr("stdDeviation", 5);

  queue()
      .defer(d3.json, "/us.json")
      .defer(d3.tsv, "/readme-airports.tsv")
      .defer(d3.jsonp, "http://api.seatgeek.com/2/events?performers.slug=jason-aldean&per_page=10&callback={callback}")
      .await(ready);

  function ready(error, us, airports, events) {
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
      svg.append("path")
        .datum({
          type: "MultiPoint",
          coordinates: [{
            0: evt.venue.location.lon,
            1: evt.venue.location.lat
          }]
        })
        .attr("class", "points event-" + evt.id)
        .attr("d", path.pointRadius(function(d) { return unselected_radius; }));
    });

  }

})();
