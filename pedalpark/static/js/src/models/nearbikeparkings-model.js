/*
 * Calls '/near' on Python backend,
 * possible arguments are lat, long, address and limit.
 * It fetches a number of bicycle parkings close to a given location. 
 */
 
var NearBikeParkingsModel = Backbone.Model.extend({
  url: function() {
    return '/near';
  }
});
