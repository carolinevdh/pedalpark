from flask import request, jsonify
from pygeocoder import Geocoder, GeocoderError
from bson import json_util

import pymongo

from pedalpark import app, data

""" All location related methods """

@app.route('/near')
def near():
    """Respond with X bike parkings closest to given location"""
    args = request.args

    if 'limit' in args: limit = int(args.get('limit'))
    else: limit = 1

    if 'lat' in args and 'long' in args:
        la = float(args.get('lat'))
        lo = float(args.get('long'))
        address = str(address_from_latlong(la,lo))

    elif 'address' in args:
        address = args.get('address')
        coordinates = latlong_from_address(address)
        if len(coordinates) == 2:
            la = coordinates[0]
            lo = coordinates[1]
        else:
            return jsonify(success=False, reason='unknown_address')
            
    else:
        return jsonify(success=False, reason='wrong_arguments')

    locations = find_nearest_neighbours(la, lo, limit)
    return serialize_locations(locations, la, lo, address)

@app.route('/all')
def all():
    """Respond with all known and installed bicycle parking locations"""
    return serialize_locations(data.find_db(data.coll()), 0, 0, '')

@app.route('/size')
def size():
    """Respond with amount of known & installed bicycle parking locations"""
    return jsonify(size=data.size_db(data.coll()))

def find_nearest_neighbours(latitude, longitude, count):
    """Query collection for X bike parkings closest to (lat, long)"""
    return data.geo_find_db(
                data.coll(),'coordinates',latitude,longitude,count)

def latlong_from_address(address):
    """Get (lat, long) location from human-readable address."""
    try:
        return Geocoder.geocode(address)[0].coordinates
    except GeocoderError, e:
    	print "Error when converting (lat,long) to address: %s" % e
        return []

def address_from_latlong(latitude, longitude):
    """Get human-readable address from (lat, long) location."""
    try:
        return Geocoder.reverse_geocode(latitude,longitude)[0]
    except GeocoderError, e:
    	print "Error when converting address to (lat,long): %s" % e
        return ''

def serialize_locations(locations, latitude, longitude, address):
    """Prepare JSON output based on collection of documents"""
    print locations
    try:
        size = locations.count()
    except pymongo.errors.OperationFailure, e:
        print 'Error accessing MongoDB documents: ', e
        return jsonify(success=False, reason='mongodb_operationfailure')
    if size:
        return json_util.dumps({
            'success': True, 'locations': locations,
            'latitude': latitude, 'longitude': longitude,
            'address': address })
    else:
        return jsonify(success=False, reason='none_found')
