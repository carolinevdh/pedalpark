from pedalpark import app, data
from flask import request, render_template

""" All location related methods """

@app.route('/near')
def near():
	la = float(request.args.get('lat'))
	lo = float(request.args.get('long'))
	source_str = la, lo
	limit = int(request.args.get('limit'))

	locations = find_nearest_neighbours(la,lo,limit)

	return render_template('locations.html',source=source_str, parkings=locations)

def find_nearest_neighbours(latitude,longitude,count):
	neighbours = data.geo_find_db(data.coll(),'coordinates',latitude,longitude,count)
	return neighbours