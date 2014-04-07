from flask import Flask
from flask.ext.pymongo import PyMongo

app = Flask(__name__)
mongo = PyMongo(app)

import pedalpark.views
import pedalpark.data
import pedalpark.location
