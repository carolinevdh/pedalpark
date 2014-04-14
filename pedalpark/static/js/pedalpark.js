(function() {
	var TEMPLATE_URL = '/static';

	//These variables help development when not in San Francisco, CA.
	var FAKE_SF_LOCATION = true;
	var SF_LOCATION_LAT = 37.790947;
	var SF_LOCATION_LONG = -122.393171;

	// Start PedalPark Backbone App
	window.PedalParkApp = Backbone.View.extend({
		initialize: function() {
			//Update database, and launch parking engine
			updateRouter = new UpdateRouter();
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
		render: function(){
			//this.button = new DynamicButtonView({ model : this.model });
			//this.button.render();
			this.$el.html(this.template({ parking : this.model.toJSON() }));
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
		render: function(parkings){
			for ( var i=0 ; i<parkings.length ; i++ ){
				var bikeParkingView = new BikeParkingView({ model : parkings[i] });
				this.listenTo( bikeParkingView, 'parking:chosen', this.bubble );
				this.$el.append(bikeParkingView.$el);
				bikeParkingView.render();
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
			for ( var i=collection.models.length-1 ; i >= 0 ; i-=2){
				var doubleView = new DoubleBikeParkingsView();
				this.listenTo( doubleView, 'parking:chosen', this.bubble );
				this.$el.append(doubleView.$el);
				if( i - 1 >= 0 ) 
					doubleView.render([collection.models[i],collection.models[i-1]]);
				else
					doubleView.render([collection.models[i]]);
			}
		},
		bubble: function(model){
			this.trigger('parking:chosen', model);
		}
	});

	var MapView = Backbone.View.extend({
		el : $('#map-canvas'),
		update: function(doMarkLocation, doCenter, doFitBounds, isManualLocation, lat, long, parkinglocations){
			//Build Google Map for drawing
			map = new google.maps.Map(this.el, { zoom : 1});
			mainLatLng = new google.maps.LatLng(lat, long);
			latLngBounds = new google.maps.LatLngBounds();
			if ( doMarkLocation ) {
				if ( isManualLocation ) icon = 'static/img/marker-finish.png';
				else icon = 'static/img/marker-cyclist.png';
				currentMarker = new google.maps.Marker({
					position : mainLatLng,
					map : map,
					icon : icon
				});
				latLngBounds.extend(mainLatLng);
			}
			nLocations = parkinglocations.length;
			for ( i = 0; i < nLocations; i++ ){
				latLng = new google.maps.LatLng(
						parkinglocations[i].get('coordinates').latitude,
						parkinglocations[i].get('coordinates').longitude);
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
				if( doFitBounds ) map.fitBounds(latLngBounds);
			});

			//Finally, draw Google Map
			this.render();
		},

		renderWorld: function(){
			this.update(false,true,false,false,0,0,[]);
		},

		getMarkerIcon: function(size, index){
			if ( size < 10) return 'static/img/marker-parking-' + index + '.png';
			else return 'static/img/marker-parking.png';
		},

		makeResponsive: function(map){
			
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
			this.mapView.renderWorld();

			this.noticeView = new NoticeView();
			this.noticeView.render('Loading parking locations, please hang on to your handlebars.');

			this.sizeModel = new SizeModel();
			this.sizeModel.fetch({ success: this.onSizeReceived	});
		},

		onSizeReceived: function(){
			if( this.sizeModel.get('size') <= 0) {
				this.updateModel = new UpdateModel();
				this.updateModel.fetch({
					success : this.onUpdateSuccess,
					error: this.onUpdateError
				});
			}else{
				//Database has previously been updated, proceed with application
				parkingRouter = new ParkingsRouter();
			}
		},

		onUpdateSuccess: function(){
			if( this.updateModel.get('size') <= 0) this.onUpdateError();
			else{
				//Database is updated, proceed with application
				parkingRouter = new ParkingsRouter();
			}
			
		},

		onUpdateError: function(){
			this.noticeView.render('Uh-oh. It looks like the server has a flat. Unfortunately, PedalPark is not going to work now.');
			//Either the data source is unreachable or the database is. The front-end will remain in this state.
		}
		
	});

	var ParkingsRouter = Backbone.Router.extend({
		initialize: function() {
			_.bindAll(this,'onManualDestination','onLocationUpdate','manualParkingFetchSuccess','nearParkingFetchSuccess','allParkingFetchSuccess','parkingFetchError');

			this.userLocationModel = new UserLocationModel();
			this.nearBikeParkingsModel = new NearBikeParkingsModel();
			this.destinationModel = new DestinationModel();

			this.bikeParkingsCollection = new BikeParkingsCollection();

			this.mapView = new MapView();
			this.bikeParkingsView = new BikeParkingsView({ collection : this.bikeParkingsCollection });
			this.noticeView = new NoticeView();
			this.destinationView = new DestinationView({ model : this.destinationModel });

			this.listenTo(this.destinationModel, 'change', this.onManualDestination);

			this.listenTo(this.bikeParkingsView, 'parking:chosen', this.onParkingChosen);

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

		onParkingChosen: function(model){
			console.log('Picked parking at ' + model.get('location_name'));
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
				this.allBikeParkingsModel = new AllBikeParkingsModel();
				this.allBikeParkingsModel.fetch({
					success : this.allParkingFetchSuccess,
					error : this.parkingFetchError
				});
			}
		},

		manualParkingFetchSuccess: function(model){
			if( !model.get('success') ) {
				this.addressGeocodeError(this.destinationModel.get('address'));
			}else{
				this.noticeView.render('Great! Here are some bicycle parkings, close to ' + model.get('address') + '. Pick one to get directions.');
				
				this.bikeParkingsCollection.reset(model.get('locations'));

				//Update Google Map with new current location and bike parkings
				this.mapView.update(
					true,true,true,true,
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
				this.mapView.update(
					true,true,true,false,
					this.userLocationModel.get('latitude'),
					this.userLocationModel.get('longitude'),
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
				this.mapView.update(
					false,true,true,0,0,
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
