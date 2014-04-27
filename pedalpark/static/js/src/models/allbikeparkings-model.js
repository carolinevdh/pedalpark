/*
 * Calls '/all' on Python backend,
 * fetching all known and installed bicycle parkings.
 */
 
var AllBikeParkingsModel = Backbone.Model.extend({
  url: function() {
    return '/all';
  }
});
