/*
 * PedalPark's Backbone.js entry point.
 * Sets some global variables for development,
 * starts the first router.
 */

//These variables help development when not in San Francisco, CA.
var FAKE_SF_LOCATION = false;
var SF_LOCATION_LAT = 37.790947;
var SF_LOCATION_LONG = -122.393171;

// Start PedalPark Backbone.js App
window.PedalParkApp = Backbone.View.extend({
	initialize: function() {
		//Update database, and launch rest of application
		var updateRouter = new UpdateRouter(); //routers start line 400
		Backbone.history.start();
	}
});