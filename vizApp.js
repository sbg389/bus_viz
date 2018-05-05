// =====================================================================
// The usual definition for our data source URLs. We only need the zip
// code data in this lab. The cuisine data will be served through Carto
// Database back-end.
// =====================================================================
const ZIPCODE_URL = "https://raw.githubusercontent.com/hvo/datasets/master/nyc_zip.geojson";

// =====================================================================
// We are then asking D3 to read both of the files asynchronously with
// d3.queue(). Note that after this call, the data is NOT ready. They
// are only being put on the queue for the browser to fetch the data
// in the background (using the specified d3.json() function) since 
// loading files over the network always take time!
//
// Once the download completes, regardless being successful or not, D3
// will call the function that we provide in await() to handle the data
// or the error, respectively. In this case, it will call createPlot().
//
// NOTE: since we only need the zip code, there's only one defer() here.
// =====================================================================
d3.queue()
  .defer(d3.json, ZIPCODE_URL)
  .await(initVisualization);

// =====================================================================
// This is where all the actions happen. The function signature is:
// - 1st argument     : error to indicate whether the queue has
//                      completed successfully or not
// - 2nd to the rest  : the result for each task on the queue, i.e.
//                      the data from the d3.json calls.
// If there are data-dependent setup in our webpage, we must put those
// setup in this callback function. We cannot do:
// data = d3.queue()...
// and then setup right after because the data would not be ready.
// 
// In this case, once we have the shape file, we will setup the chart,
// and a LeafLet map accordingly.
// =====================================================================
function initVisualization(error, zipcodes) {
  let svg       = d3.select("svg"),
      gChart    = svg.append("g"),

      // This is our LeafLet map with an editable circle selection.
      // See createBaseMap() for more details.
      baseMap   = createBaseMap(),
      
      // This holds the current selection of our application, the label
      // for the cuisine, and the counts per zip code.
      selection = {cuisine: 'All', data: []};
  
      // This is to initiate a Carto's client to access the data and
      // visualizations on Carto. Note, for public data sets, we don't
      // need an API Key.
      client    = new carto.Client({
                    apiKey: 'NoNeed',
                    username: 'sbg389',
                  });
  
  // First, populate our leaflet map
  createMap(baseMap, zipcodes, selection);

  // Then, we add a layer from Carto showing the subway entrances. We
  // also need the data SQL source so that we can alter the query when
  // our circle selection is changed.
  let subwaySource = createCartoLayer(client, baseMap);
  
  // Finally, we monitor the selection change events so that we know when
  // to update our SQL.
  setupSelectionHandlers(baseMap, subwaySource);
}
// =====================================================================
// This is for us to show a static (canned) visualization using the data
// on Carto. Here, we pretty much "copy and paste" the SQL and CSS from
// Carto's Builder over.
// =====================================================================
function createCartoLayer(client, baseMap) {
  
  // We specify the data source for our visualization, which is the
  // subway entrances. We can use the Data's SQL part from the Builder.
  let subwaySource = new carto.source.SQL(`
    SELECT *
      FROM bus_stops
  `);

  // We also need to style our data, through CartoCSS, which is also
  // copied over from the Builder
  let subwayStyle= new carto.style.CartoCSS(`
    #layer {
  marker-width: 7;
  marker-fill: #7b3c41;
  marker-fill-opacity: 0.9;
  marker-allow-overlap: true;
  marker-line-width: 1;
  marker-line-color: #FFFFFF;
  marker-line-opacity: 1;
  }
  `);
  
  // After that, we just tell Carto to create a layer with both the style
  // and the data. The good thing is Carto supports LeafLet!
  let subwayLayer = new carto.layer.Layer(subwaySource, subwayStyle);
  client.addLayer(subwayLayer);
  client.getLeafletLayer().addTo(baseMap[2]);
  return subwaySource;
}
// =====================================================================
// This is similar to what we have in the previous labs, except that
// instead of passing the data, we pass the current selection with both
// the cuisine name and the data.
// =====================================================================
function createMap(baseMap, zipcodes, selection) {
  
  function projectPoint(x, y) {
    let point = dMap.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
  }

  let projection = d3.geoTransform({point: projectPoint}),
      path       = d3.geoPath().projection(projection),
      svg        = baseMap[0],
      g          = baseMap[1],
      dMap       = baseMap[2];
  
  // The legend control is an overlay layer, i.e. it doesn't move with
  // the user interactions. We create this control through LeafLet, and
  // add it to our map.
  let legendControl   = L.control({position: 'topleft'});
  
  // On adding the legend to LeafLet, we will setup a <div> to show
  // the selection information.
  legendControl.onAdd = addLegendToMap;
  legendControl.addTo(dMap);
  
  // The tricky part now is we need to sync up the projection between
  // LeafLet and D3's shapes. We need to write a special handler for
  // that, naming reproject(). This will get called whenever the user
  // zoon in or out with the map.
  dMap.on("zoomend", reproject);
  reproject();
  
  // This function gets called when we first add the legend box. We
  // perform some styling to make it looks nice here.
  function addLegendToMap(map) {
    let div    = L.DomUtil.create('div', 'legendbox'),
        ndiv   = d3.select(div)
                   .style("left", "50px")
                   .style("top", "-75px"),
        lsvg   = ndiv.append("svg"),
        legend = lsvg.append("g")
                   .attr("class", "legend")
                   .attr("transform", "translate(0, 20)");
    legend.append("text")
      .attr("class", "axis--map--caption")
      .attr("y", -6);
    return div;
  };

  // This function realign the shapes to the zoom level of LeafLef map.
  // The key action here is to get the bounds of the geometries in this
  // zoom, reproject the path, and update all geometries with the new
  // reprojected information.
  function reproject() {
    // First we compute the bounds, and shift our SVG accordingly
		bounds = path.bounds(zipcodes);
    let topLeft     = bounds[0],
        bottomRight = bounds[1];
    svg.attr("width", bottomRight[0] - topLeft[0])
      .attr("height", bottomRight[1] - topLeft[1])
      .style("left", topLeft[0] + "px")
      .style("top", topLeft[1] + "px");

    // Then also transform our map group
    g.attr("transform", `translate(${-topLeft[0]}, ${-topLeft[1]})`);

    // And update the actual D3 visual elements
    let zipShapes = g.selectAll(".zipcode")
      .data(zipcodes.features); // we rejoin the data
    zipShapes
      .enter().append("path")
        .attr("class", "zipcode")
      .merge(zipShapes) // and perform updates on both match and unmatches
        .attr("d", path);

    // Redraw the map
    updateMap(g, selection);
  }
}

function updateMap(g, selection) {
  let data     = selection.data,
      maxCount = d3.max(data, d => d[1]),
      steps    = 5,
      color    = d3.scaleThreshold()
                   .domain(d3.range(0, maxCount, maxCount/steps))
                   .range(d3.schemeBlues[steps])
      zipcodes = g.selectAll(".zipcode")
                   .data(data, d => (d[0]?d[0]:d.properties.zipcode)),
      x        = d3.scaleLinear()
                   .domain([0, maxCount])
                   .rangeRound([50, 300]),
      legend   = d3.select(".legend");

  zipcodes
    .transition().duration(300)
    .style("fill", d => color(d[1]));
  
  zipcodes.exit()
    .transition().duration(300)
    .style("fill", "none");
  
  let boxes = legend.selectAll("rect")
    .data(color.range().map(function(d) {
        d = color.invertExtent(d);
        return [(d[0]!==null?d[0]:x.domain()[0]),
                (d[1]!==null?d[1]:x.domain()[1])];
      }));

  boxes
    .enter().append("rect")
    .merge(boxes)
      .attr("height", 6)
      .attr("x", d => x(d[0]))
      .attr("width", d => (x(d[1]) - x(d[0])))
      .attr("fill", d => 'SteelBlue');

  legend.call(d3.axisBottom(x)
      .ticks(steps, "s")
      .tickSize(10,0)
      .tickValues(color.domain()))
    .select(".domain")
      .remove();
  
  legend.select(".axis--map--caption")
    .attr("x", x.range()[0])
    .text(`Number of ${selection.cuisine} Restaurants`);
}

function createBaseMap() {
  let center    = [40.7, -73.975],
      cusp      = [40.692908,-73.9896452]
      baseLight = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
                              { maxZoom: 18, }),
      baseDark  = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
                              { maxZoom: 18, }),
      circle    = L.circle(cusp, 1000, options={editable: true}),
      dMap      = L.map('map', {
                    center: center,
                    zoom: 13,
                    layers: [baseLight]
                  }),
      svg       = d3.select(dMap.getPanes().overlayPane).append("svg"),
			g         = svg.append("g").attr("class", "leaflet-zoom-hide");
  
  L.control.layers({
                    "Light": baseLight,
                    "Dark" : baseDark,
                   }, 
                   {
                    "Selection": circle,
                   }).addTo(dMap);
  
  let infoBox = L.control({position: 'bottomleft'});
  infoBox.onAdd = function (map) {var div = L.DomUtil.create('div', 'infobox'); return div;}
  infoBox.addTo(dMap);

  return [svg, g, dMap, circle];
}

function setupSelectionHandlers(baseMap, subwaySource) {
  let dMap    = baseMap[2],
      circle  = baseMap[3],
      infoBox = d3.select(".infobox.leaflet-control");

  dMap.on(L.Draw.Event.EDITMOVE, updateQueryStatus);
  dMap.on(L.Draw.Event.EDITRESIZE, updateQueryStatus);
  dMap.on('mouseup', updateQuery);

  let circleUpdated = true;
  updateQueryStatus(null);

  function updateQueryStatus(e) {
    circleUpdated = true;
    updateCaption();
  }

  function updateQuery(e) {
    if (circleUpdated) {
      circleUpdated = false;
      let radius = circle.getRadius(),
          lat    = circle.getLatLng().lat.toFixed(4),
          lng    = circle.getLatLng().lng.toFixed(4),
          query  = `SELECT * FROM bus_stops
                    WHERE ST_DWithin(the_geom::geography,
                    CDB_LatLng(${lat},${lng})::geography,${radius})
          `;
      subwaySource.setQuery(query);
    }
  }

  function updateCaption() {
    let radius  = L.GeometryUtil.readableDistance(circle.getRadius(), true),
        lat     = circle.getLatLng().lat.toFixed(4),
        lng     = circle.getLatLng().lng.toFixed(4),
        caption = `<table style='width:100%'>
                   <tr><th>Coords</th><td>${lat},${lng}</td></tr>
                   <tr><th>Radius</th><td>${radius}</td></tr>
                   </table>`;
    infoBox.html(caption);
  }    
}