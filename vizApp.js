// =====================================================================
// BUS_VIZ: A real time visualization tool for new york public buses
// =====================================================================
//1.1.1.5 -- adding multiple 0, 1 colstops for direction
var fixed_route = "B52";
var bus_route = '';
var pos = [];
const MTA_BUS_URL = "https://sbg389.pythonanywhere.com/vis/";
const MTA_STOPS_URL = "https://sbg389.pythonanywhere.com/stops/"
const MTA_BUSES_URL = "https://sbg389.pythonanywhere.com/buses/"

//http://sbg389.pythonanywhere.com/buses/40.692908,-73.9896452

//console.log(MTA_BUS_URL);

var atStopCols = '';
var approachingCols = '';
var localBusStops = '';
var localBuses = '';
//var atStopColsD1 = '';
//var approachingColsD1 = '';
var colStops = '';
var busSource = {};
var TestSource = {};
var stopName = '';
var currentBus = '';

// Global Variable for the Map
mainMap = {};

// Collection to store the bus stops coordinates
var colCoordinates = new Array ( );
colCoordinates[0] = new Array ();
colCoordinates[1] = new Array ();

// Variable for the center of the route
var routeCenter = [];

// functions to get max and min from arrays
// to be used with the colCoordinates
Array.min = function( array ){
    return Math.min.apply( Math, array );
};

Array.max = function( array ){
    return Math.max.apply( Math, array );
};

function updateBus(bus) {
     var bus_route = bus;
     console.log(MTA_BUS_URL)
  }

// =====================================================================
// use d3. queue to load the default route data and initialize
// =====================================================================

currentBus = fixed_route;

d3.queue()
        .defer(d3.json, MTA_BUS_URL + fixed_route)
        .await(initVisualization);

//try to Get the location from the browser
//if it cant, then default to CUSP

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setPosition);
    } else {
          pos = [40.692908,-73.9896452];
    }
}

// Add the location to a given  variable

function setPosition(position) {
    pos.push(position.coords.latitude);
    pos.push(position.coords.longitude);
    console.log(pos);
}

function removeDuplicates(arr){
    let unique_array = []
    for(let i = 0;i < arr.length; i++){
        if(unique_array.indexOf(arr[i]) == -1){
            unique_array.push(arr[i])
        }
    }
    return unique_array
}

function updateBus (){

    var route = document.getElementsByName('busInput')[0].value.toUpperCase();
    currentBus = route;

    currentBus = route;
    d3.queue()
        .defer(d3.json, MTA_BUS_URL + route)
        .await(refreshVisualization);
}

function updateBusClick (route){

    currentBus = route;
    console.log(route);
    d3.queue()
        .defer(d3.json, MTA_BUS_URL + route)
        .await(refreshVisualization);
}

function xRay () {

     // Get the Bus that is beign analyzed
     var route = document.getElementsByName('busInput')[0].value.toUpperCase();
    currentBus = route;

     // Get the location and pan the map there
     mainMap.panTo(new L.LatLng(pos[0],pos[1]));

    console.log(MTA_STOPS_URL + route + '/' + pos[0] + '/' + pos[1]);

     d3.queue()
            .defer(d3.json, MTA_STOPS_URL + route + '/' + pos[0] + '/' + pos[1])
            .await(refreshXRay);

}

function refreshXRay (error, data, baseMap){

    localBusStops = '' ;

    for(var i = 0; i < data.length; ++i) {
        var stopID = data[i]['StopID'];
        var stop_name = data[i]['StopName'];
        var direction = data[i]['StopDirection'];

        localBusStops = localBusStops + '\'' + stopID +'\',';
    }

    localBusStops = localBusStops.slice(0,-1);
    localBusStops = '(' + localBusStops + ')';

    console.log(localBusStops);

    queryNearByStops = ` SELECT * FROM bus_stops where stop_id IN  ${localBusStops} `;

    nearByStopsSource.setQuery(queryNearByStops);

}

function getBuses() {

     // Get the Bus that is beign analyzed
     var route = document.getElementsByName('busInput')[0].value.toUpperCase();

     // Get the location and pan the map there
     mainMap.panTo(new L.LatLng(pos[0],pos[1]));

    console.log(MTA_BUSES_URL + pos[0] + ',' + pos[1]);

     d3.queue()
            .defer(d3.json, MTA_BUSES_URL + pos[0] + ',' + pos[1])
            .await(refreshBuses);
}

function refreshBuses (error, data, baseMap){

    localBuses = '' ;
    var arrLocalBuses = new Array()
    localBusesStops = '';

    var linkRef = `<a href="javascript:updateBusClick('`;
    var linkRefEnd = `')">`;

    for(var i = 0; i < data.length; ++i) {
        var busline = data[i]['busline'];
        var stopID = data[i]['StopID'];
        var direction = data[i]['StopDirection'];

        console.log(busline);
        console.log(arrLocalBuses.includes(busline));

        //check if the bus exist already
        if  (!arrLocalBuses.includes(busline)){
            localBuses = localBuses + linkRef + busline + linkRefEnd + busline + '</a><br>';
        }
        arrLocalBuses.push(busline);
        localBusesStops = localBusesStops + '\'' + stopID +'\',';
    }

    localBusesStops = localBusesStops.slice(0,-1);
    localBusesStops = '(' + localBusesStops + ')';

    console.log(localBuses);

    querylocalBusesStops = ` SELECT * FROM bus_stops where stop_id IN  ${localBusesStops} `;

    localBusesStopsSource.setQuery(querylocalBusesStops);

    L.marker(pos).addTo(mainMap)
    .bindPopup(localBuses)
    .openPopup();
}

function refreshVisualization (error, data, baseMap, busline){
  //From The MTA BUS API lets get the active buses
  //And where they are in relation to its stops

    // Clear previous values for global variables
    atStopCols = '';
    approachingCols = '';
    //atStopColsD1 = '';
    //approachingColsD1 = '';
    colStops = '';
    colCoordinates = new Array ( );
    colCoordinates[0] = new Array ();
    colCoordinates[1] = new Array ();
    routeCenter = [];

  for(var i = 0; i < data.length; ++i) {
    var stopID = data[i]['StopID'];
    var busStatus = data[i]['StopStatus'];
    var stop_name = data[i]['StopName'];
    var direction = data[i]['DirectionRef'];

    if (stopID !== null) {

        // Load data on the collection of coordinates
        colCoordinates[0].push(data[i]['Latitude']);
        colCoordinates[1].push(data[i]['Longitude']);

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

  midLat = (Array.min(colCoordinates[0]) +
            Array.max(colCoordinates[0])) / 2;

  midLon =  (Array.min(colCoordinates[1]) +
            Array.max(colCoordinates[1])) / 2;

  routeCenter.push (midLat);
  routeCenter.push (midLon);

  console.log(routeCenter);

  queryAtStops = ` SELECT * FROM bus_stops where stop_id IN  ${atStopCols} `;
  queryApproachingStops = ` SELECT * FROM bus_stops where stop_id IN  ${approachingCols} `;

  busSource.setQuery(queryAtStops);
  console.log(queryAtStops);

  TestSource.setQuery(queryApproachingStops);
  console.log(queryApproachingStops);

  lat = pos[0];
  lng = pos[1];

  infoBox = d3.select(".infobox.leaflet-control");
  caption = `<table style='width:100%'>
                   <tr><th>Bus Line:</th><td>${currentBus}</td></tr>
                   <tr><th>Location:</th><td>${lat},${lng}</td></tr>
                   <tr><th>At Stop(s):</th><td>${stopName}</td></tr>
                   </table>`;
  infoBox.html(caption);

  mainMap.panTo(new L.LatLng(routeCenter[0],routeCenter[1]));

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
        var direction = data[i]['DirectionRef'];


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

      //createChartFromCarto(client, gChart, baseMap[1], selection);

      // Then, we add a layer from Carto showing the subway entrances. We
      // also need the data SQL source so that we can alter the query when
      // our circle selection is changed.
      var sources =  createCartoLayer(client, baseMap)
      let busSource = sources[0];
      let TestSource = sources[1];
      let nearByStopsSource = sources[2];
      let localBusesStopsSource = sources [3];

      mainMap = baseMap[2];

}

function createCartoLayer(client, baseMap) {

//   console.log(colStops)

  // We specify the data source for our visualization, which is the
  // subway entrances. We can use the Data's SQL part from the Builder.
  //let busSource = new carto.source.SQL(`
  //SELECT * FROM bus_stops where stop_id = 501398
  //`);

  busSource = new carto.source.SQL(`
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

  nearByStopsSource = new carto.source.SQL(`
    SELECT * FROM bus_stops where stop_id = 0
  `);

  let nearByStopsStyle= new carto.style.CartoCSS(`
  #layer {
  marker-width: 15;
  marker-fill: #68595a;
  marker-fill-opacity: 0.9;
  marker-allow-overlap: true;
  marker-line-width: 1;
  marker-line-color: #FFFFFF;
  marker-line-opacity: 1;
  }
  `);

  localBusesStopsSource = new carto.source.SQL(`
    SELECT * FROM bus_stops where stop_id = 0
  `);

  let localBusesStopsStyle= new carto.style.CartoCSS(`
  #layer {
  marker-width: 15;
  marker-fill: #68595a;
  marker-fill-opacity: 0.9;
  marker-allow-overlap: true;
  marker-line-width: 1;
  marker-line-color: #FFFFFF;
  marker-line-opacity: 1;
  }
  `);

  // After that, we just tell Carto to create a layer with both the style
  // and the data. The good thing is Carto supports LeafLet!
  let subwayLayer = new carto.layer.Layer(busSource, subwayStyle);
  let TestLayer = new carto.layer.Layer(TestSource, TestStyle);
  let nearByStopsLayer =  new carto.layer.Layer(nearByStopsSource, nearByStopsStyle);
  let localBusesStopsLayer =  new carto.layer.Layer(localBusesStopsSource, localBusesStopsStyle);

  client.addLayer(subwayLayer);
  client.addLayer(TestLayer);
  client.addLayer(nearByStopsLayer);
  client.addLayer(localBusesStopsLayer);
  client.getLeafletLayer().addTo(baseMap[2]);
  return [busSource, TestSource, nearByStopsSource, localBusesStopsSource];
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
          .attr("y", 1)
          .attr("x", 7)
          .text("Legend");

        legend.append("g")
            .attr("width", 7)
            .attr("height", 7)
            .append("circle")
            .attr("cx", 7)
            .attr("cy", 7)
            .attr("r", 7)
            .style("fill", "#04660b")
            .attr("stroke-width", .5)
            .attr("stroke", "black")
            .attr("transform", "translate(22, 12)");

        legend.append("text")
           .text("Bus At Stop")
           .attr("transform", "translate(40, 24)");

        legend.append("g")
            .attr("width", 7)
            .attr("height", 7)
            .append("circle")
            .attr("cx", 7)
            .attr("cy", 7)
            .attr("r", 7)
            .style("fill", "#f2ea07") //f2ea07
            .attr("stroke-width", .5)
            .attr("stroke", "black")
            .attr("transform", "translate(22, 36)");

        legend.append("text")
           .text("Bus Approaching Stop")
           .attr("transform", "translate(40, 48)");

           legend.append("g")
            .attr("width", 7)
            .attr("height", 7)
            .append("circle")
            .attr("cx", 7)
            .attr("cy", 7)
            .attr("r", 7)
            .style("fill", "#68595a")
            .attr("stroke-width", .5)
            .attr("stroke", "black")
            .attr("transform", "translate(22, 60)");

        legend.append("text")
           .text("Closest Bus Stops")
           .attr("transform", "translate(40, 72)");


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


  let infoBox = L.control({position: 'bottomleft'});
  infoBox.onAdd = function (map) {var div = L.DomUtil.create('div', 'infobox'); return div;}
  infoBox.addTo(dMap);

  return [svg, g, dMap, circle];
}