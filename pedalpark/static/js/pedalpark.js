(function() {
	var TEMPLATE_URL = '/static';

	// USER LOCATION

	// - model

	var UserLocationModel = Backbone.Model.extend({
		defaults: {
			latitude: -1,
			longitude: -1
		},

		initialize: function() {
			_.bindAll(this,'positionSuccess');
		},

		getLocation: function() {
			console.log('UserLocationModel.getLocation() called.');
			if(navigator.geolocation){
				navigator.geolocation.getCurrentPosition(this.positionSuccess);
			}
		},

		positionSuccess: function(position) {
			this.set({
				latitude : position.coords.latitude,
				longitude : position.coords.longitude
			});
			console.log('Acquired position: (' + this.get('latitude') + ", " + this.get('longitude') + ').');
		},

		positionFailure: function() {
			console.log('ERROR: Could not acquire new position, still: (' + this.latitude + ", " + this.longitude + ').');
		}
	});

	// - view

	var UserLocationView = Backbone.View.extend({
		tagName: 'div',

		initialize: function(){
			_.bindAll(this,'render');
			if(this.model) this.model.on('change',this.render,this);
			console.log('UserLocationView should be bound to UserLocationModel.latitude?');
		},
		render: function(){
			console.log('UserLocationView render called.');
		}
	});

	//Start App

	window.PedalParkApp = Backbone.View.extend({

		initialize: function() {
			userLocationModel = new UserLocationModel();
			userLocationView = new UserLocationView({ model: userLocationModel });
			this.render();
			userLocationModel.getLocation();
		}
	});

}());
