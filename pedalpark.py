from flask import Flask, render_template, request
from flask.ext.pymongo import PyMongo
from pymongo import GEO2D
import requests

app = Flask(__name__)

""" ~ Database methods ~ """
mongo = PyMongo(app)

@app.route('/db/update')
def update_db():
	"""Empty DB"""
	mongo.db.parkings.remove()
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
		    for resp_item in resp_json: cast_for_latlong(resp_item)
		    print "Casted all latitude and longitude fields."
		    mongo.db.parkings.insert(resp_json)
		    print "Inserted into database."
		    offset += pagesize
		    import_size += resp_size
		    print "Importing... %d bike parkings so far." % import_size
		else:
		    end_of_data = True

	"""remove coordinates attribute, for MongoDB GeoSpatial Indexing"""
	mongo.db.parkings.update({},{'$unset': {'coordinates.needs_recoding':1}}, multi=True)
	print "MongoDB needs_recoding removed."

	print "%d bike parkings imported." % (import_size)
	return render_template('start.html')

@app.route('/db/index')
def ensure_index():
	"""Create index for MongoDB's GeoSpatial Indexing"""
	mongo.db.parkings.ensure_index([("coordinates", GEO2D)])
	return render_template('start.html')

def cast_for_latlong(item):
    """MongoDB GeoSpatial Indexing requires float values of latitude and longitude"""
    item["coordinates"]["latitude"] = float(item["coordinates"]["latitude"])
    item["coordinates"]["longitude"] = float(item["coordinates"]["longitude"])


""" ~ Pages ~ """
@app.route('/')
def home():
	return render_template('start.html')

if __name__ == '__main__':
	app.run()