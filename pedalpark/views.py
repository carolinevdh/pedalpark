from pedalpark import app

""" All simple views """

@app.route('/')
def hello():
	return "Hello, cyclist!"
