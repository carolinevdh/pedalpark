/*
 * View for textual directions, 
 * includes close button that also removes paths on map.
 */

var DirectionsView = Backbone.View.extend({

  el : $('#directions'),
  panel : $('#directions-panel'),

  /* Catches click of close button */
  events: { 'click #directions-button' : 'closeBtn' },

  initialize: function() {
    this.template = _.template($('#directionspanel-template').html());
  },

  /* 
   * Set directions onto DOM element, 
   * as received packed in renderer object.
   * @param <google.maps.DisplayRenderer> renderer
   */
  setDirections: function(renderer) {
    this.$el.html(this.template());
    renderer.setPanel($('#directions-panel')[0]);
  },

  /* 
   * Remove directions from DOM element.
   */
  removeDirections: function() {
    this.$el.empty();
  },

  /* Bubbles its caught click event up,
   * eventually reaching the NavigationView.
   */
  closeBtn: function() {
    this.trigger('close');
  }
});
