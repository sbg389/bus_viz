import pandas as pd
import requests

def getBusData(BUSLINE):
    MTAKEY = 'e106ffee-0fd1-4f89-bcda-30cf0d9e50c6'
    url = "http://bustime.mta.info/api/siri/vehicle-monitoring.json?key=%s&VehicleMonitoringDetailLevel=calls&" \
      "LineRef=%s"%(MTAKEY, BUSLINE)
    mtadata = requests.get(url).json()

    vehicleActivityArray = mtadata['Siri']['ServiceDelivery']['VehicleMonitoringDelivery']
    numberOfActiveBuses = len(vehicleActivityArray[0]['VehicleActivity'])

    #Create the pandas dataframe to store the data

    columns = ['Latitude','Longitude','StopName','StopStatus', "StopID", 'DirectionRef', 'DestinationName', \
              'DestinationRef']

    df = pd.DataFrame(columns=columns)


    #iterate through all the active buses and dis[play their latitude and longitude
    for i in range (0, numberOfActiveBuses):
        df.loc[i,'Latitude'] = vehicleActivityArray[0]['VehicleActivity'][i] \
           ['MonitoredVehicleJourney']['VehicleLocation']['Latitude']
        df.loc[i,'Longitude'] = vehicleActivityArray[0]['VehicleActivity'][i] \
           ['MonitoredVehicleJourney']['VehicleLocation']['Longitude']

        onwardCallsDict = vehicleActivityArray[0]['VehicleActivity'][i] \
            ['MonitoredVehicleJourney']['OnwardCalls']

        # Handle if Onward Call is empty
        if (onwardCallsDict!={}):
            df.loc[i,'StopStatus'] = vehicleActivityArray[0]['VehicleActivity'][i] \
                ['MonitoredVehicleJourney']['OnwardCalls']['OnwardCall'][0]['Extensions']['Distances'] \
                ['PresentableDistance']
            df.loc[i,'StopName'] = vehicleActivityArray[0]['VehicleActivity'][i] \
                ['MonitoredVehicleJourney']['OnwardCalls']['OnwardCall'][0]['StopPointName']
            df.loc[i,'StopID'] = vehicleActivityArray[0]['VehicleActivity'][i] \
                ['MonitoredVehicleJourney']['OnwardCalls']['OnwardCall'][0]['StopPointRef']
           # adding additional columns - MT

            df.loc[i,'DirectionRef'] = vehicleActivityArray[0]['VehicleActivity'][i] \
                ['MonitoredVehicleJourney']['DirectionRef']
            df.loc[i,'DestinationName'] = vehicleActivityArray[0]['VehicleActivity'][i] \
                ['MonitoredVehicleJourney']['DestinationName']
            df.loc[i,'DestinationRef'] = vehicleActivityArray[0]['VehicleActivity'][i] \
                 ['MonitoredVehicleJourney']['DestinationRef']

        else:
            df.loc[i,'StopStatus'] = 'N/A'
            df.loc[i,'StopName'] = 'N/A'

        #Clean the stopID
        df['StopID'] = df['StopID'].str.replace('MTA_', '')

    return df.to_json(orient='records')

def getStopsData(lat, long, busLine):
    MTAKEY = 'e106ffee-0fd1-4f89-bcda-30cf0d9e50c6'
    url = " http://bustime.mta.info/api/where/stops-for-location.json?" + \
    "lat=%s&lon=%s&latSpan=0.005&lonSpan=0.005&key=%s"%(lat,long, MTAKEY)
    mtadata = requests.get(url).json()
    data = mtadata['data']['stops']
    numberOfStops = len(data)

    #Create the pandas dataframe to store the data
    columns = ['Latitude','Longitude','StopName', "StopID", 'StopDirection']
    df = pd.DataFrame(columns=columns)

     #iterate through all the stops
    for i in range (0, numberOfStops):
        for j in range (0, len(data[i]['routes'])):
            line =  data[i]['routes'][j]['id']
            line = line.replace('MTA NYCT_','')
            if line == busLine:
                df.loc[i,'Latitude'] = data[i]['lat']
                df.loc[i,'Longitude'] = data[i]['lon']
                df.loc[i,'StopName'] = data[i]['name']
                df.loc[i,'StopID'] = data[i]['id']
                df.loc[i,'StopDirection'] = data[i]['direction']

    #Clean the stopID
    df['StopID'] = df['StopID'].str.replace('MTA_', '')
    return df.to_json(orient='records')
