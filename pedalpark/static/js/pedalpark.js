(function() {
	var TEMPLATE_URL = '/static';

	//These variables help development when not in San Francisco, CA.
	var FAKE_SF_LOCATION = true;
	var SF_LOCATION_LAT = 37.790947;
	var SF_LOCATION_LONG = -122.393171;

	// Start PedalPark Backbone App
	window.PedalParkApp = Backbone.View.extend({
		initialize: function() {
			console.log('Entering Backbone MVC...');
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
			this.updateLocation();
		},

		updateLocation: function() {
			if(!FAKE_SF_LOCATION){
				if(navigator.geolocation)
					navigator.geolocation.getCurrentPosition(this.positionSuccess);
			}else{
				this.set({
					latitude : 37.390947 + Math.random(),
					longitude : -122.393171
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
				zoom: 1,
				center: new google.maps.LatLng(lat,long),
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
		},
		update: function(lat, long, parkinglocations){
			//Build Google Map for drawing
			mapOptions = this.getMapOptions(lat,long);
			map = new google.maps.Map(this.el,mapOptions);
			latLngBounds = new google.maps.LatLngBounds();
			currentMarker = new google.maps.Marker({
				position : mapOptions.center,
				map : map,
				icon : 'static/img/marker-cyclist.png'
			});
			latLngBounds.extend(mapOptions.center);
			for ( i = 0; i < parkinglocations.length; i++ ){
				console.log(parkinglocations[i]);
				latLng = new google.maps.LatLng(
						parkinglocations[i].coordinates.latitude,
						parkinglocations[i].coordinates.longitude);
				parkingMarker = new google.maps.Marker({
					position : latLng,
					map : map,
					icon : 'static/img/marker-parking-' + (i + 1) + '.png'
				});
				latLngBounds.extend(latLng);
			}
			bikeLayer = new google.maps.BicyclingLayer();
			bikeLayer.setMap(map);

			map.setCenter(latLngBounds.getCenter());
			map.fitBounds(latLngBounds); 

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
			if(!FAKE_SF_LOCATION)
				this.listenTo(this.userLocationModel, 'change', this.onLocationUpdate);
			else{
				this.userLocationModel.set({
					latitude : SF_LOCATION_LAT,
					longitude : SF_LOCATION_LONG
				});
				this.onLocationUpdate(this.userLocationModel);
			}
		},

		onLocationUpdate: function(model){
			console.log('ParkingsRouter received userLocationModel change.');
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
