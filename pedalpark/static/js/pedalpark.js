(function() {
	var TEMPLATE_URL = '/static';

	// Start PedalPark Backbone App
	window.PedalParkApp = Backbone.View.extend({
		initialize: function() {
			console.log('Starting ParkingsRouter.');
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
			_.bindAll(this,'positionSuccess');
			this.updateLocation();
		},

		updateLocation: function() {
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
		updateLocation: function(lat, long){
			//Build Google Map for drawing
			mapOptions = this.getMapOptions(lat,long);
			map = new google.maps.Map(this.el,mapOptions);
			marker = new google.maps.Marker({
				position: mapOptions.center,
				map: map,
			});
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
			this.bikeParkingsModel.fetch({
				data : {
					lat : model.attributes.latitude,
					long : model.attributes.longitude,
					limit : 4
				}
			});
			this.mapView.updateLocation(model.attributes.latitude, model.attributes.longitude);
		}
	});

}());
