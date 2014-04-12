(function() {
	var TEMPLATE_URL = '/static';

	//These variables help development when not in San Francisco, CA.
	var FAKE_SF_LOCATION = false;
	var SF_LOCATION_LAT = 37.790947;
	var SF_LOCATION_LONG = -122.393171;

	// Start PedalPark Backbone App
	window.PedalParkApp = Backbone.View.extend({
		initialize: function() {
			parkingsRouter = new ParkingsRouter();
		}
	});

	// - MODEL

	var BikeParkingsModel = Backbone.Model.extend({
		url: function() {
			return '/near';
		}
	});

	var UserLocationModel = Backbone.Model.extend({
		initialize: function() {
			_.bindAll(this,'positionSuccess','updateLocation');
			this.set({
				latitude : -1,
				longitude : -1
			});
			this.updateLocation();
		},

		updateLocation: function() {
			if(!FAKE_SF_LOCATION){
				if(navigator.geolocation)
					navigator.geolocation.getCurrentPosition(this.positionSuccess);
			}else{
				console.log(this);
				this.set({
					latitude : SF_LOCATION_LAT,
					longitude : SF_LOCATION_LONG
				});
				console.log('Set fake position at (' + this.get('latitude') + ", " + this.get('longitude') + ').');
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
			console.log('ERROR: Could not acquire new position, still: (' + this.get('latitude') + ", " + this.get('longitude') + ').');
		}
	});

	// - VIEW

	var BikeParkingsView = Backbone.View.extend({
		initialize: function(){
			this.template = _.template($('#bikeparkings-template').html());
			this.listenTo(this.model,'change', this.render);
		},
		render: function(){
			this.$el.html(this.template({ bikeparkings: this.model.toJSON() }));
		}
	});

	var MapView = Backbone.View.extend({
		el : $('#map-canvas').first(),
		render: function(){
			return this;
		},
		getMapOptions: function(lat, long){
			return mapOptions = {
				zoom: 15,
				center: new google.maps.LatLng(lat,long),
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
		},
		update: function(lat, long, parkinglocations){
			//Build Google Map for drawing
			mapOptions = this.getMapOptions(lat,long);
			map = new google.maps.Map(this.el,mapOptions);
			currentMarker = new google.maps.Marker({
				position: mapOptions.center,
				map: map,
			});
			console.log(parkinglocations);
			for ( i = 0; i < parkinglocations.length; i++ ){
				console.log(parkinglocations[i]);
				parkingMarker = new google.maps.Marker({
					position: new google.maps.LatLng(
						parkinglocations[i].coordinates.latitude,
						parkinglocations[i].coordinates.longitude),
					map: map
				});
			}
			bikeLayer = new google.maps.BicyclingLayer();
			bikeLayer.setMap(map);

			//Listen to resize events: make Google Map responsive
			var center;
			function calculateCenter() {
				center = map.getCenter();
			}
			google.maps.event.addDomListener(map, 'idle', function() {
				calculateCenter();
			});
			google.maps.event.addDomListener(window, 'resize', function() {
				map.setCenter(center);
			});

			//Finally, draw Google Map
			this.render();
		}
	});

	// - CONTROLLER / ROUTER

	var ParkingsRouter = Backbone.Router.extend({
		initialize: function() {
			_.bindAll(this,'onLocationUpdate','parkingFetchSuccess');
			this.userLocationModel = new UserLocationModel();
			this.bikeParkingsModel = new BikeParkingsModel();
			this.bikeParkingsView = new BikeParkingsView({
				el: $('#bikeparkings').first(),
				model: this.bikeParkingsModel
			});
			this.mapView = new MapView();
			this.listenTo(this.userLocationModel, 'change', this.onLocationUpdate);
		},

		onLocationUpdate: function(model){
			//Fetch new bike parkings
			this.bikeParkingsModel.fetch({
				data : {
					lat : model.get('latitude'),
					long : model.get('longitude'),
					limit : 4
				},
				success : this.parkingFetchSuccess
			});
		},

		parkingFetchSuccess: function(){
			console.log('Successfully fetched bikeparkings');

			//Update Google Map with new current location
			this.mapView.update(
				this.userLocationModel.get('latitude'),
				this.userLocationModel.get('longitude'),
				this.bikeParkingsModel.get('locations')
			);
		}
	});

}());
