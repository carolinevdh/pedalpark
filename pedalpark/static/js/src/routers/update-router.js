/*
 * Updates database if it's empty, 
 * handles execution of webapp according to success of update
 * by initializing a ParkingsRouter.
 */

var UpdateRouter = Backbone.Router.extend({

  initialize: function() {
    _.bindAll(this, 'onUpdateSuccess', 'onUpdateError');

    //start the application with a map of the world
    var mapView = new MapView();
    mapView.renderWorld();

    //...and a 'loading' message
    this.noticeView = new NoticeView();
    this.noticeView.render(
      'Loading parking locations, please hang on to your handlebars.'
    );

    //ask the back-end for the size of its database
    var sizeModel = new SizeModel();
    sizeModel.fetch({ success : this.onSizeReceived });
  },

  /* 
   * When a database size is successfully received,
   * update the database or proceed with application
   * by initializing a ParkingsRouter.
   * @param <SizeModel> model
   */
  onSizeReceived: function(model) {
    if (model.get('size') <= 0) {
      //database needs an update, perform said update
      var updateModel = new UpdateModel();
      updateModel.fetch({
        success : this.onUpdateSuccess,
        error: this.onUpdateError
      });
    } else {
      //database has previously been updated, proceed with application
      var parkingRouter = new ParkingRouter();
    }
  },

  /* 
   * When /update call to back-end succeeds,
   * display an error or proceed with application
   * by initializing a ParkingsRouter.
   * @param <UpdateModel> model
   */
  onUpdateSuccess: function(model) {
    //display an error if no parkings were loaded into the database
    if (model.get('size') <= 0) this.onUpdateError();
    else {
      //database is updated, proceed with application
      var parkingRouter = new ParkingRouter();
    }
  },

  /* 
   * When an update was needed and failed,
   * displays a message. Sadly, no new calls happen.
   */
  onUpdateError: function() {
    this.noticeView.render(
      'Uh-oh. It looks like the server has a flat. ' +
      'Unfortunately, PedalPark is not going to work now.'
    );
    //Either the data source is unreachable or the database is. 
    //Execution of the page stops here.
  }
});
