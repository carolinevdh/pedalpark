/*
 * simple Model for a single bicycle parking location, 
 * including a Collection of parkings.
 */
var BikeParkingModel = Backbone.Model.extend();

var BikeParkingsCollection = Backbone.Collection.extend({
    model: BikeParkingModel
});