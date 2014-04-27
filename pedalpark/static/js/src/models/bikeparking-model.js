/*
 * Model for a single bicycle parking location.
 */

var BikeParkingModel = Backbone.Model.extend();


/*
 * Collection of BikeParkingModel objects
 */
 
var BikeParkingsCollection = Backbone.Collection.extend({
  model : BikeParkingModel
});
