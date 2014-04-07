from flask import Flask, render_template, request
from flask.ext.pymongo import PyMongo
from pymongo import GEO2D
import requests
import sys

app = Flask(__name__)

""" ~ Database methods ~ """
mongo = PyMongo(app)

def empty_db(c):
	"""Remove all data and indexes from collection"""
	c.remove()
	c.drop_indexes()

@app.route('/db/update')
def update_db():
	empty_db(mongo.db.parkings)	
	print "Removed all known bike parkings."

	"""Fill DB with entries from paginated API"""
	pagesize = 500
	offset = 0
	import_size = 0
	url_base = "http://data.sfgov.org/resource/w969-5mn4.json"

	end_of_data = False
	while not end_of_data:
		url_args = "?$limit=%d&$offset=%d" % (pagesize,offset)
		print "About to call %s." % (url_base + url_args)
		resp = requests.get(url_base + url_args)
		resp_json = resp.json()
		resp_size = len(resp_json)
		print "Received %d parkings." % (resp_size)
		if resp_size > 0:
		    for resp_item in resp_json: cast_latlong(resp_item)
		    print "Casted all latitude and longitude fields."
		    import_size += insert_into_db(mongo.db.parkings,resp_json)
		    offset += pagesize
		    print "Importing... %d bike parkings so far." % import_size
		else:
		    end_of_data = True

	prepare_db_for_geo(mongo.db.parkings)	    

	print "%d bike parkings imported." % (import_size)
	return render_template('start.html')
 
def insert_into_db(c,item):
	try:
		c.insert(item)
		return len(item)
	except:
		print "Unexpected error when inserting into db:", sys.exc_info()

def prepare_db_for_geo(c):
	"""Remove coordinates attribute and create index for MongoDB GeoSpatial Indexing"""
	c.update({},{'$unset': {'coordinates.needs_recoding':1}}, multi=True)
	c.ensure_index([("coordinates", GEO2D)])

def cast_latlong(item):
    """MongoDB GeoSpatial Indexing requires float values of latitude and longitude"""
    item["coordinates"]["latitude"] = float(item["coordinates"]["latitude"])
    item["coordinates"]["longitude"] = float(item["coordinates"]["longitude"])


""" ~ Pages ~ """
@app.route('/')
def home():
	return render_template('start.html')

if __name__ == '__main__':
	app.run()