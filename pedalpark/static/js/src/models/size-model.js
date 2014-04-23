/*
 * Fetches the amount of known and installed bike parkings.
 */
var SizeModel = Backbone.Model.extend({
    url: function(){
        return '/size';
    }
});