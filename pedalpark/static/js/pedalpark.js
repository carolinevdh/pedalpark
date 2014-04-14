(function() {
	//These variables help development when not in San Francisco, CA.
	var FAKE_SF_LOCATION = true;
	var SF_LOCATION_LAT = 37.790947;
	var SF_LOCATION_LONG = -122.393171;

	// Start PedalPark Backbone.js App
	window.PedalParkApp = Backbone.View.extend({
		initialize: function() {			
			//Update database, and launch parking engine
			var updateRouter = new UpdateRouter();
		}
	});

	// - MODEL (& Collections)

	var BikeParkingModel = Backbone.Model.extend();

	var BikeParkingsCollection = Backbone.Collection.extend({
		model: BikeParkingModel
	});

	var SizeModel = Backbone.Model.extend({
		url: function(){
			return '/size';
		}
	});

	var UpdateModel = Backbone.Model.extend({
		url: function(){
			return '/update';
		}
	});

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

	var DestinationModel = Backbone.Model.extend({});

	// - VIEW

	var BikeParkingView = Backbone.View.extend({
		events: { 'click' : 'clicked' },
		initialize: function(){
			_.bindAll(this,'render','clicked');
			this.template = _.template($('#bikeparking-template').html());
		},
		render: function(i){
			index = i % 9;
			this.$el.html(this.template({ parking : this.model.toJSON() }));
			this.$el.children().children().children().children().first().attr('src','/static/img/marker-parking-' + index + '.png');
		},
		clicked: function(){
			this.trigger('parking:chosen', this.model);
		}
	});

	var DoubleBikeParkingsView = Backbone.View.extend({
		events: { 'parking:chosen' : 'clicked' },
		initialize: function(){
			_.bindAll(this,'render');
			this.template = _.template($('#bikeparkingsrow-template').html());
		},
		render: function(parkings, index){
			for ( var i=0 ; i<parkings.length ; i++ ){
				console.log(index + i);
				var bikeParkingView = new BikeParkingView({ model : parkings[i] });
				this.listenTo( bikeParkingView, 'parking:chosen', this.bubble );
				this.$el.append(bikeParkingView.$el);
				bikeParkingView.render(index + i);
			}
		},
		bubble: function(model){
			this.trigger('parking:chosen', model);
		}
	});

	var BikeParkingsView = Backbone.View.extend({
		el: $('#bikeparkings'),
		initialize: function(){
			_.bindAll(this,'render');
			this.collection.bind('reset', this.render, this);
		},
		render: function(collection){
			this.$el.empty();
			var length = collection.models.length
			for ( var i=1 ; i-1<length ; i+=2){
				var doubleView = new DoubleBikeParkingsView();
				this.listenTo( doubleView, 'parking:chosen', this.bubble );
				this.$el.append(doubleView.$el);
				if( i < length )
					doubleView.render([collection.models[i-1],collection.models[i]], i);
				else
					doubleView.render([collection.models[i-1]]);
			}
		},
		bubble: function(model){
			this.trigger('parking:chosen', model);
		}
	});

	var MapView = Backbone.View.extend({
		el : $('#map-canvas'),
		initialize: function(){
			_.bindAll(this,'redrawWithMarkers','redrawWithPath');
		},
		redrawWithMarkers: function(doMarkLocation, doCenter, isManualLocation, lat, long, parkinglocations){
			//Build Google Map for drawing
			map = new google.maps.Map(this.el, { zoom : 1});
			var mainLatLng = new google.maps.LatLng(lat, long);
			var latLngBounds = new google.maps.LatLngBounds();
			if ( doMarkLocation ) {
				if ( isManualLocation ) icon = 'static/img/marker-finish.png';
				else icon = 'static/img/marker-cyclist.png';
				var currentMarker = new google.maps.Marker({
					position : mainLatLng,
					map : map,
					icon : icon
				});
				latLngBounds.extend(mainLatLng);
			}
			var nLocations = parkinglocations.length;
			for ( i = 0; i < nLocations; i++ ){
				var latLng = new google.maps.LatLng(
						parkinglocations[i].get('coordinates').latitude,
						parkinglocations[i].get('coordinates').longitude);
				var parkingMarker = new google.maps.Marker({
					position : latLng,
					map : map,
					icon : this.getMarkerIcon(nLocations, i+1)
				});
				latLngBounds.extend(latLng);
			}
			var bikeLayer = new google.maps.BicyclingLayer();
			bikeLayer.setMap(map);

			if ( doCenter )	map.setCenter(latLngBounds.getCenter());
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
				if( doCenter ) map.setCenter(center);
				map.fitBounds(latLngBounds);
			});
		},

		redrawWorld: function(){
			map = new google.maps.Map(this.el, {
				zoom : 1,
				center : new google.maps.LatLng(0,0)
			});

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
		},

		redrawWithPath: function(origin, destination){
			map = new google.maps.Map(this.el, {});

			var directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});
			directionsDisplay.setMap(map);

			var latLngBounds = new google.maps.LatLngBounds();
			var start = new google.maps.LatLng(origin[0],origin[1]);
			var startMarker = new google.maps.Marker({
					position : start,
					map : map,
					icon : new google.maps.MarkerImage('static/img/marker-cyclist.png')
			});
			latLngBounds.extend(start);
			var end = new google.maps.LatLng(destination[0],destination[1]);
			var endMarker = new google.maps.Marker({
					position : end,
					map : map,
					icon : new google.maps.MarkerImage('static/img/marker-parking.png')
			});
			latLngBounds.extend(end);
			map.fitBounds(latLngBounds);

			var bikeLayer = new google.maps.BicyclingLayer();
			bikeLayer.setMap(map);

			var request = {
				origin: start,
				destination: end,
				travelMode: google.maps.TravelMode.BICYCLING
			};

			var directionsService = new google.maps.DirectionsService();
			directionsService.route(request, function(result, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					directionsDisplay.setDirections(result);
				}
			});

		},

		getMarkerIcon: function(size, index){
			if ( size < 10) return 'static/img/marker-parking-' + index + '.png';
			else return 'static/img/marker-parking.png';
		}
	});

	var NoticeView = Backbone.View.extend({
		el : $('#notice'),
		initialize: function(){
			_.bindAll(this,'render');
			this.template = _.template($('#notice-template').html());
		},
		render: function(notice){
			this.$el.html(this.template({ 'notice' : notice }));
		}
	});

	var DestinationView = Backbone.View.extend({
		el : $('#destinationform'),
		events: {'submit form#frm-destination': 'setDestination'},
		initialize: function(){
			_.bindAll(this,'render','setDestination');
			this.template = _.template($('#destinationform-template').html());
		},
		render: function(){
			this.$el.html(this.template());
		},
		clear: function(){
			$('#destination').val('');
		},
		setDestination: function(event){
			event.preventDefault();
			var destination = $('#destination').val();
			this.model.set('address',destination);
		}
	});

	// - CONTROLLER / ROUTER

	var UpdateRouter = Backbone.Router.extend({
		initialize: function(){
			_.bindAll(this,'onSizeReceived','onUpdateSuccess','onUpdateError');

			this.mapView = new MapView();
			this.mapView.redrawWorld();
			this.mapView.render();

			this.noticeView = new NoticeView();
			this.noticeView.render('Loading parking locations, please hang on to your handlebars.');

			var sizeModel = new SizeModel();
			sizeModel.fetch({ success: this.onSizeReceived	});
		},

		onSizeReceived: function(model){
			if( model.get('size') <= 0) {
				var updateModel = new UpdateModel();
				updateModel.fetch({
					success : this.onUpdateSuccess,
					error: this.onUpdateError
				});
			}else{
				//Database has previously been updated, proceed with application
				var parkingRouter = new ParkingsRouter();
			}
		},

		onUpdateSuccess: function(model){
			if( model.get('size') <= 0) this.onUpdateError();
			else{
				//Database is updated, proceed with application
				var parkingRouter = new ParkingsRouter();
			}
			
		},

		onUpdateError: function(){
			this.noticeView.render('Uh-oh. It looks like the server has a flat. Unfortunately, PedalPark is not going to work now.');
			//Either the data source is unreachable or the database is. Execution of the page stops here.
		}
		
	});

	var ParkingsRouter = Backbone.Router.extend({
		initialize: function() {
			_.bindAll(this,'onManualDestination','onLocationUpdate','manualParkingFetchSuccess','nearParkingFetchSuccess','allParkingFetchSuccess','parkingFetchError','onParkingChosen');

			var userLocationModel = new UserLocationModel();
			this.nearBikeParkingsModel = new NearBikeParkingsModel();
			var destinationModel = new DestinationModel();

			this.bikeParkingsCollection = new BikeParkingsCollection();

			this.mapView = new MapView();
			var bikeParkingsView = new BikeParkingsView({ collection : this.bikeParkingsCollection });
			this.noticeView = new NoticeView();
			this.destinationView = new DestinationView({ model : destinationModel });

			this.listenTo(destinationModel, 'change', this.onManualDestination);

			this.listenTo(bikeParkingsView, 'parking:chosen', this.onParkingChosen);

			if(!FAKE_SF_LOCATION)
				this.listenTo(userLocationModel, 'change', this.onLocationUpdate);
			else{
				userLocationModel.set({
					latitude : SF_LOCATION_LAT,
					longitude : SF_LOCATION_LONG
				});
				this.onLocationUpdate(userLocationModel);
			}
		},

		onParkingChosen: function(model){
			var	origin = [this.nearBikeParkingsModel.get('latitude'), this.nearBikeParkingsModel.get('longitude')];
			var destination = [model.get('coordinates').latitude, model.get('coordinates').longitude];
			this.mapView.redrawWithPath(origin,destination);
		},

		onManualDestination: function(model){
			this.nearBikeParkingsModel.fetch({
				data : {
					address : model.get('address'),
					limit : 4
				},
				success : this.manualParkingFetchSuccess,
				error : this.parkingFetchError
			});
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
				var allBikeParkingsModel = new AllBikeParkingsModel();
				allBikeParkingsModel.fetch({
					success : this.allParkingFetchSuccess,
					error : this.parkingFetchError
				});
			}
		},

		manualParkingFetchSuccess: function(model){
			if( !model.get('success') ) {
				this.addressGeocodeError(model.get('address'));
			}else{
				this.noticeView.render('Great! Here are some bicycle parkings, close to ' + model.get('address') + '. Pick one to get directions.');
				
				this.bikeParkingsCollection.reset(model.get('locations'));

				//Update Google Map with new current location and bike parkings
				this.mapView.redrawWithMarkers(
					true,true,true,
					model.get('latitude'),
					model.get('longitude'),
					this.bikeParkingsCollection.models
				);

				this.destinationView.clear();
			}
		},

		addressGeocodeError: function(address){
			this.noticeView.render('Oops, we have no idea where ' + address + ' is. Could you rephrase, please?');
			this.destinationView.clear();
		},

		nearParkingFetchSuccess: function(model){
			if( !model.get('success') )
				this.parkingFetchError();
			else {
				this.noticeView.render('Hi! Here are some bicycle parkings, close to your current location. Pick one to get directions.');
				this.destinationView.render();

				this.bikeParkingsCollection.reset(model.get('locations'));

				//Update Google Map with new current location and bike parkings
				this.mapView.redrawWithMarkers(
					true,true,false,
					model.get('latitude'),
					model.get('longitude'),
					this.bikeParkingsCollection.models
				);
			}
		},

		allParkingFetchSuccess: function(model){
			if( !model.get('success') )
				this.parkingFetchError();
			else {
				this.noticeView.render('Oops, we couldn\'t find your location. Either way, here are all bicycle parkings in San Francisco! Please enable location awareness in your browser.');
				this.destinationView.render();

				this.bikeParkingsCollection.reset(model.get('locations'));

				//Render a map with all known bicycle parkings
				this.mapView.redrawWithMarkers(
					false,true,false,0,0,
					this.bikeParkingsCollection.models);
			}
		},

		parkingFetchError: function(){
			this.noticeView.render('Oops, we couldn\t find any bicycle parkings, nor your location. Please enable location awareness in your browser.');
			this.destinationView.render();

			//Render a map of the world
			this.mapView.renderWorld();
		}
	});

}());
