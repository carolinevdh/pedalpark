/*
 * Calls '/update' on Python backend,
 * emptying the database and repopulating it with new data.
 */

var UpdateModel = Backbone.Model.extend({
  url: function() {
    return '/update';
  }
});
