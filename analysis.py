import json
import pandas as pd
import os
import requests

def getBusData(BUSLINE):
    MTAKEY = 'PUT_KEY_HERE'
    url = "http://bustime.mta.info/api/siri/vehicle-monitoring.json?key=%s&VehicleMonitoringDetailLevel=calls&" \
      "LineRef=%s"%(MTAKEY, BUSLINE)
    mtadata = requests.get(url).json()

    vehicleActivityArray = mtadata['Siri']['ServiceDelivery']['VehicleMonitoringDelivery']
    numberOfActiveBuses = len(vehicleActivityArray[0]['VehicleActivity'])

    #Create the pandas dataframe to store the data

    columns = ['Latitude','Longitude','StopName','StopStatus', "StopID"]

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
        else:
            df.loc[i,'StopStatus'] = 'N/A'
            df.loc[i,'StopName'] = 'N/A'

        #Clean the stopID
        df['StopID'] = df['StopID'].str.replace('MTA_', '')

    return df.to_json(orient='records')

def loadData():
    #Set base path (source from Huy)
    basePath = os.path.dirname(__file__)
    #Load data fom local JSON file (using path)
    nyc_restaurant_data = json.load(open(os.path.join(basePath,'nyc_restaurants_by_cuisine.json'), 'r'))
    #use the normalize method to flatten the data into a pandas datafrae
    dfNYCRestaurant = json_normalize(nyc_restaurant_data)
    return dfNYCRestaurant