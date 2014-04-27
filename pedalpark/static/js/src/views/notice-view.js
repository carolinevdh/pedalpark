/*
 * Simple View rendering greetings and application messages to user
 */

var NoticeView = Backbone.View.extend({
  
    el : $('#notice'),

    initialize: function(){
        _.bindAll(this,'render');
        this.template = _.template($('#notice-template').html());
    },

    render: function(notice){
        this.$el.html(this.template({ 'notice' : notice }));
    }
});
