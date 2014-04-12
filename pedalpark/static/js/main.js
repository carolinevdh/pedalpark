require.config({
	paths: {
		jquery : 'vendor/jquery',
		foundation : 'vendor/foundation',
		underscore : 'vendor/underscore',
		backbone : 'vendor/backbone',
		async : 'vendor/async',
		pedalpark : 'pedalpark'
	},
	shim: {
		backbone : {
			deps : ['underscore','jquery'],
			exports : 'Backbone'
		},
		foundation : {
			deps : ['jquery']
		},
		underscore : {
			exports : '_'
		},
		pedalpark : {
			deps : ['backbone','foundation']
		}
	}

});

define('gmaps', ['async!http://maps.googleapis.com/maps/api/js?sensor=false'], function() {
    return google.maps;
});

define(['jquery', 'underscore', 'backbone', 'foundation', 'pedalpark','gmaps'], function() {
	console.log('Using Backbone...');
    $(document).foundation({});
    $(document).ready(function() {
        window.App = new PedalParkApp({ appendTo: $('body') });
    });
});