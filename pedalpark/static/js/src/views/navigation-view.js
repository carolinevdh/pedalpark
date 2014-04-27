/*
 * View combining MapView and DirectionsView
 */
var NavigationView = Backbone.View.extend({

  initialize: function() {
    _.bindAll(this, 'renderLocations', 'onRouteReceived', 'restoreLocations');

    this.mapView = new MapView();
    this.mapView.renderWorld();
    this.directionsView = new DirectionsView();

    //catch when close button in directionsView is clicked
    this.listenTo(this.directionsView, 'close', this.restoreLocations);
  },

  /* 
   * Redraws map with a view of the world.
   */
  renderWorld: function() {
    this.mapView.renderWorld();
  },

  /* 
   * Redraws map with markers.
   * @param <Boolean> doMarkLocation Does the special location need to be drawn?
   * @param <Float> lat Latitude of special location
   * @param <Float> long Longitude of special location
   * @param <Array<BikeParkingModel>> locations
   */
  renderLocations: function(doMarkLocation, lat, lon, locations) {
    //save location settings, for usage when directions are closed
    this.latitude = lat;
    this.longitude = lon;
    this.locations = locations;

    //render map with locations
    this.mapView.renderLocations(
      true,
      this.latitude,
      this.longitude,
      this.locations
    );
  },

  /* 
   * Fetches directions between two locations, renders map and directions after.
   * @param <Array<Float>> origin
   * @param <Array<Float>> destination
   */
  renderDirections: function(origin, destination) {
     //prepare directions request
    var request = {
      origin : new google.maps.LatLng(origin[0],origin[1]),
      destination : new google.maps.LatLng(destination[0],destination[1]),
      travelMode : google.maps.TravelMode.BICYCLING
    };

    //send directions request to Google
    var directionsService = new google.maps.DirectionsService();
    directionsService.route(request, this.onRouteReceived);
  },

  /* 
   * Removes directions displayed.
   */
  removeDirections: function() {
    this.directionsView.removeDirections();
  },

  /* 
   * Removes path and markers drawn on map.
   */
  removeMapOverlays: function() {
    this.mapView.clearOverlays(this.renderer);
  },

  /* When directions are received succesfully from Google API,
   * render them on map, display textual directions beneath.
   * @param <google.maps.DirectionsResult> result
   * @param <google.maps.DirectionsStatus> status
   */
  onRouteReceived: function(result, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      //renderer object helps populate the map and the directions
      this.renderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true
      });

      //prepare map
      var origin = result.routes[0].legs[0].start_location;
      var destination = result.routes[0].legs[0].end_location;
      this.mapView.renderForPath(origin, destination, this.renderer);
      //prepare directions
      this.directionsView.setDirections(this.renderer);

      //plug result in to renderer
      this.renderer.setDirections(result);
    }
  },

  /* 
   * Removes everything related to given directions,
   * reverts map to view with several locations.
   */
  restoreLocations: function() {
    this.removeDirections();
    this.removeMapOverlays();

    this.mapView.renderLocations(
      true,
      this.latitude,
      this.longitude,
      this.locations
    );
  }
});
