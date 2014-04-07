# PedalPark

A web application providing directions to the nearest bicycle parking in San Francisco, CA

##Data
All data is provided by [San Francisco 311][1] through their SODA API url at `http://data.sfgov.org/resource/w969-5mn4.json`

###Finding nearest (longitude,latitude) pairs
Finding the nearest bike parking can be done by:

 - Populating a KDTree based on the (long,lat) pair of every bike parking. For this, `scipy.spatial.KDTree` could be used, however all points would have to be converted to 3D space.
 - Brute force traversing all bike parkings and calculating distance using the Haversine formula
 - **Populating a MongoDB and using its built-in [Geospatial Indexing][2]**

  [1]: https://data.sfgov.org/Transportation/Bicycle-Parking-Public-/w969-5mn4
  [2]: http://docs.mongodb.org/manual/applications/geospatial-indexes/