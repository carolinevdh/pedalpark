(function() {
	var TEMPLATE_URL = '/static';

	// Start PedalPark Backbone App
	window.PedalParkApp = Backbone.View.extend({
		initialize: function() {
			console.log('Starting ParkingsRouter.');
			parkingsRouter = new ParkingsRouter();
			mapsView = new MapsView();
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

	var MapsView = Backbone.View.extend({
		el : $('#map-canvas').first(),
		initialize: function(){
			var mapOptions = {
				zoom: 8,
				center: new google.maps.LatLng(-34.397, 150.644),
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			this.map = new google.maps.Map(this.el,mapOptions);
			this.render();
		},
		render: function(){
			return this;
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
		}
	});

}());
