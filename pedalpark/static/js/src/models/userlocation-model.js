/*
 * Calculates and retains the user's current location 
 */
var UserLocationModel = Backbone.Model.extend({
	initialize: function() {
		_.bindAll(this,'updateLocation','positionSuccess','positionFailure');
		this.updateLocation();
	},

	/* Attempt to get current location from HTML5 Geolocation API */
	updateLocation: function() {
		if(!FAKE_SF_LOCATION){
			if(navigator.geolocation)
				navigator.geolocation.getCurrentPosition(this.positionSuccess, this.positionFailure);
		}else{
			this.set({
				success: true,
				latitude : SF_LOCATION_LAT,
				longitude : SF_LOCATION_LONG
			});
			console.log('Set fake position at (' + this.get('latitude') + ", " + this.get('longitude') + ').');
		}
	},

	/* When the current location is succesfully calculated, populate the Model */
	positionSuccess: function(position) {
		this.set({
			success : true,
			latitude : position.coords.latitude,
			longitude : position.coords.longitude
		});
		console.log('Acquired position: (' + this.get('latitude') + ", " + this.get('longitude') + ').');
	},

	/* When the current location could not be found, populate the Model accordingly */
	positionFailure: function() {
		this.set({
			success : false
		});
	}
});
