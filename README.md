# PedalPark

A web application providing directions to the nearest bicycle parking in San Francisco, CA


##Data
All data is provided by [San Francisco 311][1] through their SODA API url at `http://data.sfgov.org/resource/w969-5mn4.json`

###Finding nearest (longitude,latitude) pairs
Finding the nearest bike parking can be done by:

 1. Populating a KDTree based on the (long,lat) pair of every bike parking. For this, `scipy.spatial.KDTree` could be used, however all points would have to be converted to 3D space.
 2. Brute force traversing all bike parkings and calculating distance using the Haversine formula.
 3. **Populating a MongoDB and using its built-in [Geospatial Indexing][2]**.

##Roll your own PedalPark

 1. Start a MongoDB server on port `27017` or specify port in [`pedalpark/__init__.py`][3].
 2. Make `pedalpark` your current MongoDB, through `use pedalpark` in the mongo shell. You can change `pedalpark` in [`pedalpark/__init__.py`][3] as well.
 2. Start a Python server by running `python runserver.py` or `gunicorn pedalpark:app`.

##PedalPark API call examples

**`/update`** populates a MongoDB with bike parkings.

**`/near?lat=37.790947&long=-122.393171&limit=3`** finds the 3 bike parkings closest to the given (lat,long) location.

**`/near?address=Baker+Beach`** finds the bike parking closest to Baker Beach. It also takes a limit argument, but assumes 1 when omitted.

### Using

Server-side

- **MongoDB**, for data caching and Geospatial search of nearest neighbours based on (lat,long).
- **pygeocoder**, a python library easing the usage of Google's Geocoding API.
- **Flask**, for templating and its WSGI container
- **PyMongo**, for MongoDB support.

---

Todo

 - ensure seperation of server and client
 - handle requests with wrong or empty parameters
 - loading screen for /update
 - build kick-ass front-end
 - clean up data received from SF 311


  [1]: https://data.sfgov.org/Transportation/Bicycle-Parking-Public-/w969-5mn4
  [2]: http://docs.mongodb.org/manual/applications/geospatial-indexes/
  [3]: http://github.com/carolinevdh/pedalpark/blob/master/pedalpark/__init__.py
