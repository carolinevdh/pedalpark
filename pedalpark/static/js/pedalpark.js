(function() {

	/* 	Disclaimer: this file is awfully big and I have been working to
		complete splitting it into seperate files for Models, Views and Routers.
		I hope to have a working separation as soon as possible. - Caroline */

	//These variables help development when not in San Francisco, CA.
	var FAKE_SF_LOCATION = false;
	var SF_LOCATION_LAT = 37.790947;
	var SF_LOCATION_LONG = -122.393171;

	// Start PedalPark Backbone.js App
	window.PedalParkApp = Backbone.View.extend({
		initialize: function() {
			//Update database, and launch rest of application
			var updateRouter = new UpdateRouter(); //routers start line 400
		}
	});

	// - MODELs (& their Collections) -

	/*
	 * simple Model for a single bicycle parking location, 
	 * including a Collection of parkings.
	 */
	var BikeParkingModel = Backbone.Model.extend();

	var BikeParkingsCollection = Backbone.Collection.extend({
		model: BikeParkingModel
	});


	/*
	 * Models for calling and collection of data from Python backend
	 */

	//Fetches the amount of known and installed bike parkings. 
	var SizeModel = Backbone.Model.extend({
		url: function(){
			return '/size';
		}
	});

	//Empties the database and populates it with new data from SF 311.
	var UpdateModel = Backbone.Model.extend({
		url: function(){
			return '/update';
		}
	});

	//Fetches a configurable amount of bike parkings
	// close to a given (lat,long) location or address.
	var NearBikeParkingsModel = Backbone.Model.extend({
		url: function() {
			return '/near';
		}
	});

	//Fetches all known and installed bicycle parkings
	var AllBikeParkingsModel = Backbone.Model.extend({
		url: function() {
			return '/all';
		}
	});


	/* 
	 * Model to DestinationView 
	 * (the small form allowing for written input of a location)
	 */
	var DestinationModel = Backbone.Model.extend({});

	
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

	

	// - VIEWs -

	/*
	 * Three Views, working together to render bike parkings in rows of pairs,
	 * this is necessary for the responsive HTML layout.
	 */

	//View for a single bicycle parking, takes a BikeParkingModel 
	var BikeParkingView = Backbone.View.extend({

		/* Catches event when a user clicks the HTML element, a <div> */
		events: { 'click' : 'clicked' },

		initialize: function(){
			_.bindAll(this,'render','clicked');
			this.template = _.template($('#bikeparking-template').html());
		},

		/* Hands BikeParkingModel over to Underscore template,      */
		/* together with its marker image as used on the Google map */
		render: function(i){
			index = i % 9;
			this.$el.html(this.template({ parking : this.model.toJSON() }));
			this.$el.children().children().children().children().first().attr('src','/static/img/marker-parking-' + index + '.png');
		},

		/* Propagates its caught click event up, eventually reaching the Router */
		clicked: function(){
			this.trigger('parking:chosen', this.model);
		}
	});

	//View placing two BikeParkingViews next to each other
	var DoubleBikeParkingsView = Backbone.View.extend({

		/* Catches chosen parking event from child View */
		events: { 'parking:chosen' : 'clicked' },
		initialize: function(){
			_.bindAll(this,'render');
			this.template = _.template($('#bikeparkingsrow-template').html());
		},

		/* Creates and renders a BikeParkingView for each of its received (1 or 2) bike parkings */
		render: function(parkings, index){
			for ( var i=0 ; i<parkings.length ; i++ ){
				var bikeParkingView = new BikeParkingView({ model : parkings[i] });
				this.listenTo( bikeParkingView, 'parking:chosen', this.bubble );
				this.$el.append(bikeParkingView.$el);
				bikeParkingView.render(index + i);
			}
		},

		/* Bubbles the parking chosen event up another level */
		bubble: function(model){
			this.trigger('parking:chosen', model);
		}
	});

	//View representing all bike parkings
	var BikeParkingsView = Backbone.View.extend({
		el: $('#bikeparkings'),
		initialize: function(){
			_.bindAll(this,'render');
			this.collection.bind('reset', this.render, this);
		},

		/* Creates and renders a DoubleBikeParkingsView for every pair of parkings and a possible last one */
		render: function(collection){
			this.$el.empty();
			var length = collection.models.length;
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

		/* Bubbles the parking chosen event up another level */
		bubble: function(model){
			this.trigger('parking:chosen', model);
		}
	});


	/*
	 * View for Google Maps map
	 */
	var MapView = Backbone.View.extend({
		el : $('#map-canvas'),
		initialize: function(){
			_.bindAll(this,'redrawWithMarkers','redrawWithPath');
		},

		/* Redraws map with markers, takes several arguments for style aside from actual locations */
		redrawWithMarkers: function(doMarkLocation, doCenter, isManualLocation, lat, long, parkinglocations){

			map = new google.maps.Map(this.el, { zoom : 1});

			//latLngBounds helps us center and zoom the map on the displayed markers
			var latLngBounds = new google.maps.LatLngBounds();

			//render the main, current or manual, location
			var mainLatLng = new google.maps.LatLng(lat, long);
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

			//render all parkinglocations
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

			//add a layer with bicycle-safe streets
			var bikeLayer = new google.maps.BicyclingLayer();
			bikeLayer.setMap(map);

			//make sure all markers are in view and the view is centered
			if ( doCenter )	map.setCenter(latLngBounds.getCenter());
			map.fitBounds(latLngBounds);

			//listen to resize events, to make map responsive
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

		/* Redraws map with a view of the world, used as loading screen and in certain fault cases */
		redrawWorld: function(){
			map = new google.maps.Map(this.el, {
				zoom : 1,
				center : new google.maps.LatLng(0,0)
			});

			//listen to resize events, to make map responsive
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

		/* Redraws map with a path between marked locations origin and destination */
		/* Also, renders written directions as received simultaneously from Google API */
		redrawWithPath: function(origin, destination){
			map = new google.maps.Map(this.el, {});

			//object for visual display of directions, on map and written
			var directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});
			directionsDisplay.setMap(map);
			////remove possible previous directions
			if($('#directions-panel').children()[0]) $('#directions-panel').children()[0].remove();
			directionsDisplay.setPanel($('#directions-panel')[0]);

			//set two markers based on input and save in LatLngBounds
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

			//zoom and center map to markers
			map.fitBounds(latLngBounds);

			//add a layer with bicycle-safe streets
			var bikeLayer = new google.maps.BicyclingLayer();
			bikeLayer.setMap(map);

			//prepare and execute directions request to Google
			var request = {
				origin: start,
				destination: end,
				travelMode: google.maps.TravelMode.BICYCLING
			};
			var directionsService = new google.maps.DirectionsService();
			directionsService.route(request, function(result, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					//directions received, render on map and in written form
					directionsDisplay.setDirections(result);
				}
			});
		},

		/* Returns a parking marker image, based on proximity to location */
		getMarkerIcon: function(size, index){
			if ( size < 10) return 'static/img/marker-parking-' + index + '.png';
			else return 'static/img/marker-parking.png';
		}
	});

	/*
	 * Simple View rendering greetings and application messages for user
	 */
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

	/*
	 * View rendering input box and submit button, allowing user to pick a location by address
	 */
	var DestinationView = Backbone.View.extend({
		el : $('#destinationform'),

		/* Catches submission of form */
		events: {'submit form#frm-destination': 'setDestination'},

		initialize: function(){
			_.bindAll(this,'render','setDestination');
			this.template = _.template($('#destinationform-template').html());
		},

		render: function(){
			this.$el.html(this.template());
		},

		/* Empties input box */
		clear: function(){
			$('#destination').val('');
		},

		/* Reads input address and populates DestinationModel accordingly */
		setDestination: function(event){
			event.preventDefault();
			var destination = $('#destination').val();
			this.model.set('address',destination);
		}
	});

	// - ROUTERs -

	/*
	 * Updates database if it's empty, handles execution of webapp according to success of update
	 */
	var UpdateRouter = Backbone.Router.extend({
		initialize: function(){
			_.bindAll(this,'onSizeReceived','onUpdateSuccess','onUpdateError');

			//start the application with a map of the world
			this.mapView = new MapView();
			this.mapView.redrawWorld();
			this.mapView.render();

			//...and a 'loading' message
			this.noticeView = new NoticeView();
			this.noticeView.render('Loading parking locations, please hang on to your handlebars.');

			//ask the back-end for the size of its database
			var sizeModel = new SizeModel();
			sizeModel.fetch({ success: this.onSizeReceived	});
		},

		/* When a database size is successfully received, update or proceed */
		onSizeReceived: function(model){
			if( model.get('size') <= 0) {
				//database needs an update, perform said update
				var updateModel = new UpdateModel();
				updateModel.fetch({
					success : this.onUpdateSuccess,
					error: this.onUpdateError
				});
			}else{
				//database has previously been updated, proceed with application
				var parkingRouter = new ParkingsRouter();				
				Backbone.history.start();
			}
		},

		/* When /update call to back-end succeeds... */ 
		onUpdateSuccess: function(model){
			//display an error if no parkings were loaded into the database
			if( model.get('size') <= 0) this.onUpdateError();
			else{
				//database is updated, proceed with application
				var parkingRouter = new ParkingsRouter();
				Backbone.history.start();
			}			
		},

		/* When an update was needed and failed, a message displays and sadly, nothing new will happen. */
		onUpdateError: function(){
			this.noticeView.render('Uh-oh. It looks like the server has a flat. Unfortunately, PedalPark is not going to work now.');
			//Either the data source is unreachable or the database is. Execution of the page stops here.
		}
		
	});

	/*
	 * Enabling Models and Views for the display of bike parkings, their locations and directions
	 */
	var ParkingsRouter = Backbone.Router.extend({
		initialize: function() {
			_.bindAll(this,'onManualDestination','onLocationUpdate','manualParkingFetchSuccess',
				'nearParkingFetchSuccess','allParkingFetchSuccess','parkingFetchError','onParkingChosen');

			//models: for current and manual location, and for bike parkings near a location
			var userLocationModel = new UserLocationModel();		
			this.destinationModel = new DestinationModel();
			this.nearBikeParkingsModel = new NearBikeParkingsModel();

			//collection of BikeParkings
			this.bikeParkingsCollection = new BikeParkingsCollection();

			//views: the map, the cascade of bicycle parking views, a notice view and the manual input form
			this.mapView = new MapView();
			var bikeParkingsView = new BikeParkingsView({ collection : this.bikeParkingsCollection });
			this.noticeView = new NoticeView();
			this.destinationView = new DestinationView({ model : this.destinationModel });

			//catch when user requests a manual location
			this.listenTo(this.destinationModel, 'change', this.onManualDestination);
			//catch when a user chooses a bike parking
			this.listenTo(bikeParkingsView, 'parking:chosen', this.onParkingChosen);
			//catch when the current location is updated
			this.listenTo(userLocationModel, 'change', this.onLocationUpdate);

			//(development tool: fake a location in San Francisco, manually trigger)
			if(FAKE_SF_LOCATION) this.onLocationUpdate(userLocationModel);
		},

		/* When the user has chosen a bike parking, calculate start and end, and draw directions */
		onParkingChosen: function(model){
			var	origin = [this.nearBikeParkingsModel.get('latitude'), this.nearBikeParkingsModel.get('longitude')];
			var destination = [model.get('coordinates').latitude, model.get('coordinates').longitude];
			this.mapView.redrawWithPath(origin,destination);
		},

		/** Regarding current location calculation **/

		/* When the UserLocationModel is changed */
		onLocationUpdate: function(model){
			//if a location exists for the user
			if( model.get('success') ) {
				//fetch new bike parkings based on (lat,long)
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
				//fetch all known and installed bike parkings
				var allBikeParkingsModel = new AllBikeParkingsModel();
				allBikeParkingsModel.fetch({
					success : this.allParkingFetchSuccess,
					error : this.parkingFetchError
				});
			}
		},

		/* When the /near API call with (lat,long) returns */
		nearParkingFetchSuccess: function(model){
			//display an error if the API returns an error
			if( !model.get('success') )
				this.parkingFetchError();
			else {
				this.noticeView.render('Hi! Here are some bicycle parkings, close to your current location. Pick one to get directions.');
				this.destinationView.render();

				//reset the Collection of bike parkings with the new data
				this.bikeParkingsCollection.reset(model.get('locations'));

				//update Google map with new current location and bike parkings
				this.mapView.redrawWithMarkers(
					true,true,false,
					model.get('latitude'),
					model.get('longitude'),
					this.bikeParkingsCollection.models
				);
			}
		},

		/* When the /all API call for all bike parkings returns */
		allParkingFetchSuccess: function(model){
			//display an error if the API returns an error
			if( !model.get('success') )
				this.parkingFetchError();
			else {
				this.noticeView.render('Oops, we couldn\'t find your location. Either way, here are all bicycle parkings in San Francisco! Please enable location awareness in your browser.');
				this.destinationView.render();

				//put all bike parkings in the collection
				this.bikeParkingsCollection.reset(model.get('locations'));

				//render a map with all known bicycle parkings
				this.mapView.redrawWithMarkers(
					false,true,false,0,0,
					this.bikeParkingsCollection.models);
			}
		},

		/** Regarding manually set location/destination **/

		/* When the user manually inputs a location */
		onManualDestination: function(model){
			//remove Google directions, if drawn
			if($('#directions-panel').children()[0]) $('#directions-panel').children()[0].remove();

			//get bicycle parkings near this location
			this.nearBikeParkingsModel.fetch({
				data : {
					address : model.get('address'),
					limit : 4
				},
				success : this.manualParkingFetchSuccess,
				error : this.parkingFetchError
			});
		},		

		/* When the /near API call with address returns */
		manualParkingFetchSuccess: function(model){
			//display an error with address if the backend didn't understand it
			if( !model.get('success') ) {
				this.addressGeocodeError(this.destinationModel.get('address'));
			}else{
				this.noticeView.render('Great! Here are some bicycle parkings, close to ' + model.get('address') + '. Pick one to get directions.');
				
				//reset the Collection of bike parkings with the new data
				this.bikeParkingsCollection.reset(model.get('locations'));

				//update Google Map with new current location and bike parkings
				this.mapView.redrawWithMarkers(
					true,true,true,
					model.get('latitude'),
					model.get('longitude'),
					this.bikeParkingsCollection.models
				);

				//clear the manual location input box
				this.destinationView.clear();
			}
		},

		/* Error handling for unknown manual location */
		addressGeocodeError: function(address){
			if(address.length > 0)
				this.noticeView.render('Oops, we have no idea where ' + address + ' is. Could you rephrase, please?');
			else
				this.noticeView.render('Oops, you didn\'t provide an address. Try again?');
			this.destinationView.clear();
		},

		/** Regarding all of the above **/

		/* Error handling if no parkings, nor location was found */
		parkingFetchError: function(){
			this.noticeView.render('Oops, we couldn\t find any bicycle parkings, nor your location. Please enable location awareness in your browser.');
			this.destinationView.render();

			//render a map of the world
			this.mapView.renderWorld();
		}
	});

}());
