/*
 * View rendering input box and submit button, 
 * allowing user to pick a location by typing an address.
 */

var DestinationView = Backbone.View.extend({

  el : $('#destinationform'),

  /* Catches submission of form */
  events: { 'submit form#frm-destination' : 'setDestination' },

  initialize: function() {
    _.bindAll(this, 'render', 'setDestination');
    this.template = _.template($('#destinationform-template').html());
  },

  render: function() {
    this.$el.html(this.template());
  },

  /* 
   * Empties its input box.
   */
  clear: function() {
    $('#destination').val('');
  },

  /* 
   * Reads input address and populates DestinationModel accordingly.
   * @param <Event> event Submission of form event
   */
  setDestination: function(event) {
    event.preventDefault();
    var destination = $('#destination').val();
    this.model.set('address',destination);
  }
});
