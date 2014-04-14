from pedalpark import app, data
from flask import request, jsonify
from pygeocoder import Geocoder
from bson import json_util

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
		address = str(address_from_latlong(la,lo))
		if len(address) == 0:
			return jsonify(success=False,reason='wrong_coordinates')
	elif 'address' in args:
		address = args.get('address')
		coordinates = latlong_from_address(address)
		if len(coordinates) == 2:
			la = coordinates[0]
			lo = coordinates[1]
		else:
			return jsonify(success=False,reason='unknown_address')
	else:
		return jsonify(success=False,reason='wrong_arguments')

	return serialize_locations(find_nearest_neighbours(la,lo,limit), la, lo, address)

@app.route('/all')
def all():
	"""Respond with all known and installed bicycle parking locations"""
	return serialize_locations(data.find_db(data.coll()), 0, 0, '')

@app.route('/size')
def size():
	"""Respond with amount of known and installed bicycle parking locations"""
	return jsonify(size=data.size_db(data.coll()))

def find_nearest_neighbours(latitude, longitude, count):
	"""Query collection for X bike parkings closest to given (lat, long) location"""
	neighbours = data.geo_find_db(data.coll(),'coordinates',latitude,longitude,count)
	return neighbours

def latlong_from_address(address):
	"""Get (lat, long) location from human-readable address."""
	try:
		return Geocoder.geocode(address)[0].coordinates
	except:
		return []

def address_from_latlong(latitude, longitude):
	"""Get human-readable address from (lat, long) location."""
	try:
		return Geocoder.reverse_geocode(latitude,longitude)[0]
	except:
		''

def serialize_locations(locations, latitude, longitude, address):
	"""Prepare JSON output based on collection of documents"""
	if locations.count() > 0:
		return json_util.dumps({ \
			'success': True, 'locations': locations, \
			'latitude' : latitude, 'longitude' : longitude, 'address' : address })
	else:
		return jsonify(success=False)