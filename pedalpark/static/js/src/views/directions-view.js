var DirectionsView = Backbone.View.extend({
    el : $('#directions'),
    panel : $('#directions-panel'),

    events: {'click #directions-button': 'closePanel'},

    initialize: function(){
        this.template = _.template($('#directionspanel-template').html());
    },

    setDirections: function(directionsDisplay){
        this.render();
        this.removeDirections();
        directionsDisplay.setPanel($('#directions-panel')[0]);
    },

    removeDirections: function(){
        if(this.panel.children()[0])
            this.panel.children()[0].remove();
    },

    closePanel: function(event){
        this.removeDirections();
        this.remove();
    },

    render: function(){
        this.$el.html(this.template());
    },

    remove: function(){
        this.$el.empty();
    }
});