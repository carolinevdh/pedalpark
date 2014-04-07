from flask import Flask
app = Flask(__name__)

import pedalpark.views
import pedalpark.data