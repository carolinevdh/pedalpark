import os
from flask import Flask, render_template
from urlparse import urlparse
import pymongo
import json

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

"""Get the Google API key"""
GOOGLE_API_KEY = open('googleapikey').read()

app = Flask(__name__)

@app.route('/')
def index():
	return render_template('index.html',google_api_key = GOOGLE_API_KEY)

import pedalpark.data
import pedalpark.location
