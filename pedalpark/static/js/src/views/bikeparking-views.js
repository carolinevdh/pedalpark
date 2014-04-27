/*
 * Three Views, working together to render bike parkings in rows of pairs:
 * this is necessary for the responsive HTML layout.
 */


/*
 * View for a single bicycle parking, takes a BikeParkingModel.
 */

var BikeParkingView = Backbone.View.extend({

  /* Catches event when a user clicks the HTML element, a <div> */
  events: { 'click' : 'clicked' },

  initialize: function() {
    _.bindAll(this, 'render', 'clicked');
    this.template = _.template($('#bikeparking-template').html());
  },

  /* 
   * Hands BikeParkingModel over to HTML Underscore template,
   * together with correct marker image: the one that is also used on the map.
   * @param <Integer> index Indicates proximity to searched location
   */
  render: function(index) {
    var correctedIndex = index % 9;
    this.$el.html(this.template({ parking : this.model.toJSON() }));
    this.$el.children().children().children().children().first().attr(
        'src','/static/img/marker-parking-' + correctedIndex + '.png'
    );
  },

  /* 
   * Bubbles its caught click event up, 
   * eventually reaching the Router. Hands along its BikeParkingModel.
   */
  clicked: function() {
    this.trigger('parking:chosen', this.model);
  }
});


/* 
 * View placing two BikeParkingViews next to each other.
 */

var DoubleBikeParkingsView = Backbone.View.extend({

  /* Catches chosen parking event from child View */
  events: { 'parking:chosen' : 'clicked' },

  initialize: function() {
    _.bindAll(this,'render');
    this.template = _.template($('#bikeparkingsrow-template').html());
  },

  /* 
   * Creates and renders a BikeParkingView
   * for each of its received (1 or 2) bike parkings.
   * @param <Array> parkings Array containing on or two BikeParkingModels
   * @param <Integer> index Indicates proximity to location of first in parkings
   */
  render: function(parkings, index) {
    for (var i=0; i<parkings.length; i++) {
      var bikeParkingView = new BikeParkingView({ model : parkings[i] });
      this.listenTo( bikeParkingView, 'parking:chosen', this.bubble );
      this.$el.append(bikeParkingView.$el);
      bikeParkingView.render(index + i);
    }
  },

  /* 
   * Bubbles the parking chosen event up,
   * eventually reaching the Router.
   * @param <BikeParkingModel> model The clicked BikeParking
   */
  bubble: function(model) {
    this.trigger('parking:chosen', model);
  }
});


/* 
 * View representing all bike parking locations.
 */

var BikeParkingsView = Backbone.View.extend({

  el: $('#bikeparkings'),

  initialize: function() {
    _.bindAll(this,'render');
    this.collection.bind('reset', this.render, this);
  },

  /* 
   * Creates and renders a DoubleBikeParkingsView,
   * for every pair of parkings and a possible last one.
   * @param <BikeParkingsCollection> collection
   */
  render: function(collection) {
    this.$el.empty();
    var length = collection.models.length;
    for (var i=1 ; i-1<length ; i+=2) {
      var doubleView = new DoubleBikeParkingsView();
      this.listenTo(doubleView, 'parking:chosen', this.bubble);
      this.$el.append(doubleView.$el);
      if (i < length) {
        doubleView.render(
          [collection.models[i-1],
          collection.models[i]],
          i
        );
      } else doubleView.render([collection.models[i-1]]);
    }
  },

  /* 
   * Bubbles the parking chosen event up,
   * eventually reaching the Router.
   * @param <BikeParkingModel> model The clicked BikeParking(Model)
   */
  bubble: function(model) {
    this.trigger('parking:chosen', model);
  }
});
