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
        var origin = [this.nearBikeParkingsModel.get('latitude'), this.nearBikeParkingsModel.get('longitude')];
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
            var allBikeParkingsCollection = new BikeParkingsCollection();
            allBikeParkingsCollection.reset(model.get('locations'));

            //render a map with all known bicycle parkings
            this.mapView.redrawWithMarkers(
                false,true,false,0,0,
                allBikeParkingsCollection.models);
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
