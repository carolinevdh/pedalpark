from pedalpark import app, data
from flask import request, jsonify
from pygeocoder import Geocoder
from bson import json_util

""" All location related methods """

@app.route('/near')
def near():
	args = request.args
	limit = 1
	if 'limit' in args: limit = int(args.get('limit'))
	if 'lat' in args and 'long' in args:
		la = float(args.get('lat'))
		lo = float(args.get('long'))
	elif 'address' in args:
		address = args.get('address')
		coordinates = latlong_from_address(address)
		la = coordinates[0]
		lo = coordinates[1]
	else:
		return jsonify(success=False)

	locations = find_nearest_neighbours(la,lo,limit)
	return json_util.dumps({ 'success': True, 'locations': locations })

def find_nearest_neighbours(latitude,longitude,count):
	neighbours = data.geo_find_db(data.coll(),'coordinates',latitude,longitude,count)
	return neighbours

def latlong_from_address(address):
	return Geocoder.geocode(address)[0].coordinates