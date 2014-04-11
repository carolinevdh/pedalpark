import os
from flask import Flask, render_template
from urlparse import urlparse
import pymongo

"""Connect to the MongoDB database"""
MONGO_URL = os.environ.get('MONGOHQ_URL')

if MONGO_URL:
	# MongoHQ settings available, we're on Heroku
	connection = pymongo.Connection(MONGO_URL)
	db = connection[urlparse(MONGO_URL).path[1:]]
else:
	# We're running on localhost
	connection = pymongo.Connection('localhost',27017)
	db = connection['pedalpark']

app = Flask(__name__)

@app.route('/')
def index():
	print "/ route in __init__.py"
	return render_template('index.html')

import pedalpark.data
import pedalpark.location
