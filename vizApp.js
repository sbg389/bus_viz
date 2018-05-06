// =====================================================================
// The usual definition for our data source URLs. We only need the zip
// code data in this lab. The cuisine data will be served through Carto
// Database back-end.
// =====================================================================
//1.1.1.3
var fixed_route = "B52";
var bus_route = '';
var pos = [];
const MTA_BUS_URL = "https://sbg389.pythonanywhere.com/vis/";
//console.log(MTA_BUS_URL);

var atStopCols = '';
var approachingCols = '';
var colStops = '';
var subwaySource = {};
var TestSource = {};
var stopName = '';

function updateBus(bus) {
     var bus_route = bus;
     console.log(MTA_BUS_URL)
  }

// =====================================================================
// NOTE: since we only need the zip code, there's only one defer() here.
// =====================================================================

function startViz(){
    var route = document.getElementsByName('busInput')[0].value.toUpperCase()

}

d3.queue()
        .defer(d3.json, MTA_BUS_URL + fixed_route)
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

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setPosition);
    } else {
          pos = [40.692908,-73.9896452];
    }
}

function setPosition(position) {
    pos.push(position.coords.latitude);
    pos.push(position.coords.longitude);
    console.log(pos);
}

function updateBus (){

    var route = document.getElementsByName('busInput')[0].value.toUpperCase();

    d3.queue()
        .defer(d3.json, MTA_BUS_URL + route)
        .await(refreshVisualization);
}

function refreshVisualization (error, data){
  //From The MTA BUS API lets get the active buses
  //And where they are in relation to its stops

    atStopCols = '';
    approachingCols = '';
    colStops = '';

  for(var i = 0; i < data.length; ++i) {
    var stopID = data[i]['StopID'];
    var busStatus = data[i]['StopStatus'];
    var stop_name = data[i]['StopName'];

    if (stopID !== null) {

        colStops = colStops + '\'' + stopID +'\',';

        //find approaching
         if (busStatus == "approaching" || busStatus == "< 1 stop away") {
            approachingCols = approachingCols + '\'' + stopID +'\',';
         } else {
            atStopCols = atStopCols + '\'' + stopID +'\',';
         };
         if (busStatus == "at stop") {
            stopName = stop_name + '\'' + stop_name +'\',';
         } else {
            atStopCols = atStopCols + '\'' + stopID +'\',';
         };

        colStops = colStops + '\'' + stopID +'\',';
        //  colStops = colStops + '\'' + stopID +'\',';
        //  colStops = colStops + '\'' + stopID +'\',';
        }

    }

  approachingCols = approachingCols.slice(0, -1)
  atStopCols = atStopCols.slice(0, -1)
  colStops = colStops.slice(0, -1)
  stopName = stopName.slice(0,-1)


  approachingCols = '(' + approachingCols + ')'
  colStops = '(' + colStops + ')'
  atStopCols = '(' + atStopCols + ')'
  stopName = '(' + stopName + ')'

  console.log("ColStops (ALL): ",colStops)
  console.log("At Stop: ", atStopCols)
  console.log("Approaching: ", approachingCols)

  queryAtStops = ` SELECT * FROM bus_stops where stop_id IN  ${atStopCols} `;
  queryApproachingStops = ` SELECT * FROM bus_stops where stop_id IN  ${approachingCols} `;
  subwaySource.setQuery(queryAtStops);
  TestSource.setQuery(queryApproachingStops);

}

function initVisualization(error, data) {

    // Get current location
    getLocation();

    let svg       = d3.select("svg"),
      gChart    = svg.append("g"),

      // This is our LeafLet map with an editable circle selection.
      // See createBaseMap() for more details.
      baseMap   = createBaseMap(),

      // This is to initiate a Carto's client to access the data and
      // visualizations on Carto. Note, for public data sets, we don't
      // need an API Key.
      client    = new carto.Client({
                    apiKey: 'NoNeed',
                    username: 'sbg389',
                  });

      //From The MTA BUS API lets get the active buses
      //And where they are in relation to its stops
      for(var i = 0; i < data.length; ++i) {
        var stopID = data[i]['StopID'];
        var busStatus = data[i]['StopStatus'];
        var stop_name = data[i]['StopName'];

        if (stopID !== null) {

        colStops = colStops + '\'' + stopID +'\',';

        //find approaching
         if (busStatus == "approaching" || busStatus == "< 1 stop away") {
            approachingCols = approachingCols + '\'' + stopID +'\',';
         } else {
            atStopCols = atStopCols + '\'' + stopID +'\',';
         };
         if (busStatus == "at stop") {
            stopName = stop_name + '\'' + stop_name +'\',';
         } else {
            atStopCols = atStopCols + '\'' + stopID +'\',';
         };

        colStops = colStops + '\'' + stopID +'\',';
        //  colStops = colStops + '\'' + stopID +'\',';
        //  colStops = colStops + '\'' + stopID +'\',';
        }

    }

      approachingCols = approachingCols.slice(0, -1)
      atStopCols = atStopCols.slice(0, -1)
      colStops = colStops.slice(0, -1)
      stopName = stopName.slice(0,-1)


      approachingCols = '(' + approachingCols + ')'
      colStops = '(' + colStops + ')'
      atStopCols = '(' + atStopCols + ')'
      stopName = '(' + stopName + ')'

      console.log("ColStops (ALL): ",colStops)
      console.log("At Stop: ", atStopCols)
      console.log("Approaching: ", approachingCols)

      // First, populate our leaflet map
      createMap(baseMap, data);

      // And go fetch the restaurants data from Carto, and build the chart
      //createChartFromCarto(client, gChart, baseMap[1], selection);

      // Then, we add a layer from Carto showing the subway entrances. We
      // also need the data SQL source so that we can alter the query when
      // our circle selection is changed.
      var sources =  createCartoLayer(client, baseMap)
      let subwaySource = sources[0];
      let TestSrouce = sources[1];

      // Finally, we monitor the selection change events so that we know when
      // to update our SQL.
      setupSelectionHandlers(baseMap, subwaySource, TestSource);
}

function createCartoLayer(client, baseMap) {

//   console.log(colStops)

  // We specify the data source for our visualization, which is the
  // subway entrances. We can use the Data's SQL part from the Builder.
  //let subwaySource = new carto.source.SQL(`
  //SELECT * FROM bus_stops where stop_id = 501398
  //`);

  subwaySource = new carto.source.SQL(`
    SELECT * FROM bus_stops where stop_id IN ${approachingCols}
  `);

  // We also need to style our data, through CartoCSS, which is also
  // copied over from the Builder
  let subwayStyle= new carto.style.CartoCSS(`
    #layer {
  marker-width: 15;
  marker-fill: #f2ea07;
  marker-fill-opacity: 0.9;
  marker-allow-overlap: true;
  marker-line-width: 1;
  marker-line-color: #000000;
  marker-line-opacity: 1;
  }
  `);

  TestSource = new carto.source.SQL(`
    SELECT * FROM bus_stops where stop_id IN ${atStopCols}
  `);

  let TestStyle= new carto.style.CartoCSS(`
    #layer {
  marker-width: 15;
  marker-fill: #04660b;
  marker-fill-opacity: 0.9;
  marker-allow-overlap: true;
  marker-line-width: 1;
  marker-line-color: #000000;
  marker-line-opacity: 1;
  }
  `);

  // After that, we just tell Carto to create a layer with both the style
  // and the data. The good thing is Carto supports LeafLet!
  let subwayLayer = new carto.layer.Layer(subwaySource, subwayStyle);
  let TestLayer = new carto.layer.Layer(TestSource, TestStyle)
  client.addLayer(subwayLayer);
  client.addLayer(TestLayer)
  client.getLeafletLayer().addTo(baseMap[2]);
  return [subwaySource, TestSource];
}

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

    // Redraw the map
    //updateMap(g, selection);
  }
}

function updateMap(g, selection) {

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

function setupSelectionHandlers(baseMap, subwaySource, TestSource) {
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
          query  = `SELECT *
                      FROM bus_stops
                     WHERE ST_DWithin(the_geom::geography,
                                      CDB_LatLng(${lat},${lng})::geography,
                                      ${radius})          `;
      queryAtStops = ` SELECT * FROM bus_stops where stop_id IN  ${atStopCols} `;
      queryApproachingStops = ` SELECT * FROM bus_stops where stop_id IN  ${approachingCols} `;
      subwaySource.setQuery(queryAtStops);
      TestSource.setQuery(queryApproachingStops);
      console.log(queryAtStops);
      console.log(queryApproachingStops);
    }
  }

  function updateCaption() {
    let radius  = L.GeometryUtil.readableDistance(circle.getRadius(), true),
        lat     = circle.getLatLng().lat.toFixed(4),
        lng     = circle.getLatLng().lng.toFixed(4),
        caption = `<table style='width:100%'>
                   <tr><th>Location:</th><td>${lat},${lng}</td></tr>
                   <tr><th>At Stop(s):</th><td>${stopName}</td></tr>
                   </table>`;
    infoBox.html(caption);
  }
}