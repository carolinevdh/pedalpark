(function() {
	var TEMPLATE_URL = '/static';

	//These variables help development when not in San Francisco, CA.
	var FAKE_SF_LOCATION = false;
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

	var NearBikeParkingsModel = Backbone.Model.extend({
		url: function() {
			return '/near';
		}
	});

	var AllBikeParkingsModel = Backbone.Model.extend({
		url: function() {
			return '/all';
		}
	});

	var UserLocationModel = Backbone.Model.extend({
		initialize: function() {
			_.bindAll(this,'updateLocation','positionSuccess','positionFailure');
			this.updateLocation();
		},

		updateLocation: function() {
			if(!FAKE_SF_LOCATION){
				if(navigator.geolocation)
					navigator.geolocation.getCurrentPosition(this.positionSuccess, this.positionFailure);
			}else{
				this.set({
					success: true,
					latitude : 37.390947 + Math.random(),
					longitude : -122.393171
				});
				console.log('Set fake position at (' + this.get('latitude') + ", " + this.get('longitude') + ').');
			}
		},

		positionSuccess: function(position) {
			this.set({
				success : true,
				latitude : position.coords.latitude,
				longitude : position.coords.longitude
			});
			console.log('Acquired position: (' + this.get('latitude') + ", " + this.get('longitude') + ').');
		},

		positionFailure: function() {
			this.set({
				success : false
			});
		}
	});

	// - VIEW

	var BikeParkingsView = Backbone.View.extend({
		el: $('#bikeparkings').first(),
		initialize: function(){
			this.template = _.template($('#bikeparkings-template').html());
			this.listenTo(this.model,'change', this.render);
		},
		render: function(){
			this.$el.html(this.template({ bikeparkings: this.model.toJSON() }));
		}
	});

	var MapView = Backbone.View.extend({
		el : $('#map-canvas'),

		update: function(doMarkLocation, doCenter, doFitBounds, lat, long, parkinglocations){
			//Build Google Map for drawing
			map = new google.maps.Map(this.el, { zoom : 1});
			mainLatLng = new google.maps.LatLng(lat, long);
			latLngBounds = new google.maps.LatLngBounds();
			if ( doMarkLocation ) {
				currentMarker = new google.maps.Marker({
					position : mainLatLng,
					map : map,
					icon : 'static/img/marker-cyclist.png'
				});
				latLngBounds.extend(mainLatLng);
			}
			nLocations = parkinglocations.length;
			for ( i = 0; i < nLocations; i++ ){
				latLng = new google.maps.LatLng(
						parkinglocations[i].coordinates.latitude,
						parkinglocations[i].coordinates.longitude);
				parkingMarker = new google.maps.Marker({
					position : latLng,
					map : map,
					icon : this.getMarkerIcon(nLocations, i+1)
				});
				latLngBounds.extend(latLng);
			}
			bikeLayer = new google.maps.BicyclingLayer();
			bikeLayer.setMap(map);

			if ( doCenter )	map.setCenter(latLngBounds.getCenter());
			if ( doFitBounds ) map.fitBounds(latLngBounds);

			//Listen to resize events: make Google Map responsive
			var center;
			function calculateCenter() {
				center = map.getCenter();
			}
			google.maps.event.addDomListener(map, 'idle', function() {
				calculateCenter();
			});
			google.maps.event.addDomListener(window, 'resize', function() {
				if( doCenter ) map.setCenter(center);
			});

			//Finally, draw Google Map
			this.render();
		},

		renderWorld: function(){
			this.update(false,true,false,0,0,[]);
		},

		getMarkerIcon: function(size, index){
			if ( size < 10) return 'static/img/marker-parking-' + index + '.png';
			else return 'static/img/marker-parking.png';
		},

		makeResponsive: function(map){
			
		}
	});

	var NoticeView = Backbone.View.extend({
		el : $('#notice').first(),
		initialize: function(){
			_.bindAll(this,'render');
			this.template = _.template($('#notice-template').html());
			this.listenTo(this.model,'change', this.render);
		},
		render: function(notice){
			this.$el.html(this.template({ 'notice' : notice }));
		}
	});

	// - CONTROLLER / ROUTER

	var ParkingsRouter = Backbone.Router.extend({
		initialize: function() {
			_.bindAll(this,'onLocationUpdate','nearParkingFetchSuccess','allParkingFetchSuccess','parkingFetchError');

			this.userLocationModel = new UserLocationModel();
			this.nearBikeParkingsModel = new NearBikeParkingsModel();

			this.mapView = new MapView();
			this.bikeParkingsView = new BikeParkingsView({ model : this.nearBikeParkingsModel });
			this.noticeView = new NoticeView({ model : this.nearBikeParkingsModel });

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
			//If a location exists for the user
			if( model.get('success') ) {
				//Fetch new bike parkings
				this.nearBikeParkingsModel.fetch({
					data : {
						lat : model.get('latitude'),
						long : model.get('longitude'),
						limit : 4
					},
					success : this.nearParkingFetchSuccess,
					error : this.parkingFetchError
				});
			//If no location exists for the user
			}else{
				//Fetch all bike parkings
				this.allBikeParkingsModel = new AllBikeParkingsModel();
				this.allBikeParkingsModel.fetch({
					success : this.allParkingFetchSuccess,
					error : this.parkingFetchError
				});
			}
		},

		nearParkingFetchSuccess: function(){
			if( !this.nearBikeParkingsModel.get('success') )
				this.parkingFetchError();
			else {
				this.noticeView.render('Hi! Here are some bicycle parkings, close to your current location. Pick one to get directions!');

				//Update Google Map with new current location and bike parkings
				this.mapView.update(
					true,true,true,
					this.userLocationModel.get('latitude'),
					this.userLocationModel.get('longitude'),
					this.nearBikeParkingsModel.get('locations')
				);
			}
		},

		allParkingFetchSuccess: function(){
			if( !this.allBikeParkingsModel.get('success') )
				this.parkingFetchError();
			else {
				this.noticeView.render('Oops, we couldn\'t find your location. Either way, here are all bicycle parkings in San Francisco! Please enable location awareness in your browser.');

				//Render a map with all known bicycle parkings
				this.mapView.update(false,true,true,0,0,this.allBikeParkingsModel.get('locations'));
			}
		},

		parkingFetchError: function(){
			console.log('parkingFetchError');
			this.noticeView.render('Oops, we couldn\t find any bicycle parkings, nor your location. Please enable location awareness in your browser.');

			//Render a map of the world
			this.mapView.renderWorld();
		},
	});

}());
