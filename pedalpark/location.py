from pedalpark import app, data
from flask import request, jsonify
from pygeocoder import Geocoder
from bson import json_util
import pymongo

""" All location related methods """

@app.route('/near')
def near():
	"""Respond with X bike parkings closest to given (lat, long) location"""
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

	return serialize_locations(find_nearest_neighbours(la,lo,limit))

#@app.route('/all')
def all():
	"""Respond with all known and installed bicyle locations"""
	return serialize_locations(data.find_db(data.coll()))

def find_nearest_neighbours(latitude,longitude,count):
	"""Query collection for X bike parkings closest to given (lat, long) location"""
	neighbours = data.geo_find_db(data.coll(),'coordinates',latitude,longitude,count)
	return neighbours

def latlong_from_address(address):
	"""Get human-readable address from (lat, long) location"""
	return Geocoder.geocode(address)[0].coordinates

def serialize_locations(locations):
	"""Prepare JSON output based on collection of documents"""
	if locations.count() > 0: 
		return json_util.dumps({ 'success': True, 'locations': locations })
	else:
		return jsonify(success=False)