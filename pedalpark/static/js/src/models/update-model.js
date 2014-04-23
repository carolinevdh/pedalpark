/*
 * Empties the database and populates it with new data from SF 311.
 */
var UpdateModel = Backbone.Model.extend({
    url: function(){
        return '/update';
    }
});
