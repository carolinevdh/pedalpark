/*
 * Calculates and retains the user's current location 
 */

var UserLocationModel = Backbone.Model.extend({
  initialize: function() {
    _.bindAll(this, 'updateLocation', 'positionSuccess', 'positionFailure');

    this.updateLocation();
  },

  /* 
   * Set current location as received from HTML5 Geocoding API,
   * or development time global variables.
   */
  updateLocation: function() {
    if (!FAKE_SF_LOCATION) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          this.positionSuccess,
          this.positionFailure
        );
      }
    } else {
      this.set({
        success: true,
        latitude : SF_LOCATION_LAT,
        longitude : SF_LOCATION_LONG
      });
    }
  },

  /*
   * When the current location has been found,
   * populate this model with received position coordinates.
   * @param <Position> position
   */
  positionSuccess: function(position) {
    this.set({
      success : true,
      latitude : position.coords.latitude,
      longitude : position.coords.longitude
    });
  },

  /* 
   * When the current location could not be found,
   * populate this model with success state.
   */
  positionFailure: function() {
    this.set({
      success : false
    });
  }
});
