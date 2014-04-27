from sys import exc_info

from flask import jsonify
from pymongo import GEO2D
from requests import get

from pedalpark import app, db


""" All data persistence methods """

def coll():
    """Define collection once, use coll() in rest of code"""
    return db.parkings

def geo_find_db(c,attr,latitude,longitude,count):
    """Perform GeoSpatial search, based on (lat,long) coordinate"""
    return c.find({attr: {'$near' : [latitude,longitude]}}).limit(count)

def find_db(c):
    """Return all documents in collection"""
    return c.find();

def empty_db(c):
    """Remove all data and indexes from collection"""
    c.remove()
    c.drop_indexes()

def size_db(c):
    """Return size of collection"""
    return c.count()

@app.route('/update')
def update_db():
    """Fetch bicycle parkings from SF 311, store them in collection"""

    #Empty the database
    empty_db(coll())    
    print "Removed all known bike parkings."

    #Define URL and parameters for paginated requests
    pagesize = 500
    offset = 0
    import_size = 0
    url_base = "http://data.sfgov.org/resource/w969-5mn4.json"

    end_of_data = False
    while not end_of_data:
    	#Prepare paged request and execute it
        url_args = "?$limit=%d&$offset=%d" % (pagesize,offset)
        resp = get(url_base + url_args)
        resp_json = resp.json()
        print "Received %d parkings." % (len(resp_json))

        #If this paged response has items, import them
        if resp_json:
            for resp_item in resp_json: cast_latlong(resp_item)
            import_size += insert_into_db(coll(),resp_json)
            offset += pagesize
            print "Importing... %d bike parkings so far." % import_size

        #If this paged response is empty, stop fetching parkings
        else:
            end_of_data = True

    #Optimize database for GeoSpatial search    
    import_size -= prune_db(coll())
    prepare_db_for_geo(coll())        

    print "%d installed bike parkings imported." % (import_size)
    return jsonify(database_size=import_size)

def insert_into_db(c,item):
    """Insert an item into a collection"""
    try:
        c.insert(item)
        return len(item)
    except:
        print "Error when inserting into db:", exc_info()

def prune_db(c):
    """Remove all not installed bike parkings from database"""
    before = c.count()
    c.remove({'status_detail': {'$ne': "INSTALLED"}})
    after = c.count()

    """Remove document attributes we don't need"""
    fields_to_remove = ['status','racks_installed','status_description',
                        'acting_agent','action','installed_by_2',
                        'yr_installed','spaces','racks']
    for field in fields_to_remove:
        c.update({},{'$unset': {field:1}}, multi=True)

    return before - after

def prepare_db_for_geo(c):
    """Remove redundant attribute, create index for GeoSpatial Search"""
    c.update({},{'$unset': {'coordinates.needs_recoding':1}}, multi=True)
    c.ensure_index([("coordinates", GEO2D)])

def cast_latlong(item):
    """MongoDB GeoSpatial Indexing requires float values of (lat,long)"""
    if 'coordinates' in item:
        coordinates = item["coordinates"]
        coordinates["latitude"] = float(coordinates["latitude"])
        coordinates["longitude"] = float(coordinates["longitude"])
