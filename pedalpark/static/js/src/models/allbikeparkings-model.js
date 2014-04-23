/*
 * Fetches all known and installed bicycle parkings from Python backend.
 */
var AllBikeParkingsModel = Backbone.Model.extend({
    url: function() {
        return '/all';
    }
});
