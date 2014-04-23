/*
 * Fetches a configurable amount of bike parkings
 * close to a given (lat,long) location or address.
 */
var NearBikeParkingsModel = Backbone.Model.extend({
    url: function() {
        return '/near';
    }
});