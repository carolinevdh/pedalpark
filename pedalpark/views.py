from pedalpark import app
from flask import render_template

""" All simple views """

@app.route('/')
def home():
	return render_template('start.html')