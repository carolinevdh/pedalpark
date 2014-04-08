import os
from flask import Flask
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

import pedalpark.views
import pedalpark.data
import pedalpark.location
