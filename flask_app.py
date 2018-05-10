from flask import Flask, Response
from analysis import getBusData, getStopsData, getBusesData

app = Flask(__name__, static_url_path='', static_folder='.')
app.add_url_rule('/', 'root', lambda: app.send_static_file('index.html'))

@app.route('/vis/<bus>')
def visualizeBus(bus):

    response = getBusData(bus)

    return Response(response,
        mimetype='application/json',
        headers={
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        }
    )

@app.route('/stops/<busLine>/<lat>/<long>')
def visualizeStops(busLine, lat, long):

    response = getStopsData(lat, long, busLine)

    return Response(response,
        mimetype='application/json',
        headers={
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        }
    )

@app.route('/buses/<lat>,<long>')
def visualizeBuses(lat, long):

    response = getBusesData(lat, long)

    return Response(response,
        mimetype='application/json',
        headers={
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        }
    )



if __name__ == '__main__':
    app.run(port=8002)