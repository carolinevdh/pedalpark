/*
 * Calls '/size' on Python backend,
 * fetching the amount of known and installed bicycle parkings.
 */
 
var SizeModel = Backbone.Model.extend({
  url: function() {
    return '/size';
  }
});
