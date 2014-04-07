from pedalpark import app, data
from flask import request, render_template
from pygeocoder import Geocoder

""" All location related methods """

@app.route('/near')
def near():
	args = request.args
	limit = 1
	if 'limit' in args: limit = int(args.get('limit'))
	if 'lat' in args and 'long' in args:
		la = float(args.get('lat'))
		lo = float(args.get('long'))	
		source_str = la, lo
	elif 'address' in args:
		address = args.get('address')
		source_str = address
		coordinates = latlong_from_address(address)
		la = coordinates[0]
		lo = coordinates[1]
	else:
		return render_template('locations.html',source="nowhere", parkings=[]) 	

	locations = find_nearest_neighbours(la,lo,limit)
	return render_template('locations.html',source=source_str, parkings=locations)

def find_nearest_neighbours(latitude,longitude,count):
	neighbours = data.geo_find_db(data.coll(),'coordinates',latitude,longitude,count)
	return neighbours

def latlong_from_address(address):
	return Geocoder.geocode(address)[0].coordinates