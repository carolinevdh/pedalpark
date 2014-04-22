from os import environ

from flask import Flask, render_template
from urlparse import urlparse
from pymongo import Connection


"""Connect to the MongoDB database"""
MONGO_URL = environ.get('MONGOHQ_URL')

if MONGO_URL:
    # MongoHQ settings available, we're on Heroku
    connection = Connection(MONGO_URL)
    db = connection[urlparse(MONGO_URL).path[1:]]
else:
    # We're running on localhost
    connection = Connection('localhost',27017)
    db = connection['pedalpark']

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

#ensure access to routes in data.py and location.py
import pedalpark.data
import pedalpark.location
