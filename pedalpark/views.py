from pedalpark import app
from flask import render_template

""" All simple views """

@app.route('/view')
def view():
	return "view"