# bus_viz# BUS_VIZ
## A real time interactive data visualization tool for NYC public bus riders.

#### By Kelsey Reid, Benjamin Alpert, Marc Toneatto, Sebastian Bana.

#### Objectives
The objective of this project is to design and build a tool to help New York public bus riders make choices about their inmediat transport options. in short, it helps them answering the question of "What's the closest and most immediate bus alternative that I have?". 

The tool aims at providing these answers by helping the user locating him/herself in space using a map and a marker that uses the coordinates obtained from the location api from their browser - expected in most cases to be a mobile browser -. Aditionally, the tool queries a series of APIs from the New York MTA that bring information on near by bus stops and lines. Once the user selects a particular line, the tool retreives the current status of all buses that are serving that particular line, enconding their status with respect to their current or next stop, allowing the user to head to the closest next stop to take the bus.

All of this is achieved with a minimum number of interactions (clicks, on the desired bus line, optional zooming and panning) as the tool automatically positions the user and automatically centers (zoom and pan) the map and elements.

The following figure ilustrates these basic elements:

![Image of bus_viz](https://github.com/sbg389/bus_viz/blob/master/bus_viz_small.png?raw=true)

#### Design

The tool is entirely build as a simple web applicaiton, using the leaflet, carto.js and d3 libraries on the front end and the python flask framework on the backend, and it is currently hosted on the pythonanywhere PaaS.

The following digram presents a high level solution architecture:

![Image of bus_viz](https://github.com/sbg389/bus_viz/blob/master/bus_viz_arch.PNG?raw=true)

#### Data

The tool uses three main sources of data:
* The NYC Open Data bus stops shape file from the MTA (https://wfs.gc.cuny.edu/SRomalewski/MTA_GISdata/nycbusstops_100401.zip)
* The MTA developers API (Nearby buses / stops and Real time bus info) http://web.mta.info/developers/
