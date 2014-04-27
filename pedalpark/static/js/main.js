require.config({
	paths: {
		jquery : 'vendor/jquery',
		foundation : 'vendor/foundation',
		underscore : 'vendor/underscore',
		backbone : 'vendor/backbone',
		async : 'vendor/async',
		pedalpark : 'dist/pedalpark.min'
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
	},
	waitSeconds: 30
});

//load Google Maps API asynchronously
define('gmaps', ['async!http://maps.googleapis.com/maps/api/js?sensor=false'], function() {
    return google.maps;
});

//load other dependencies before starting Foundation and PedalPark
define(['jquery', 'underscore', 'backbone', 'foundation','gmaps','pedalpark',], function() {
    $(document).foundation({});
    $(document).ready(function() {
        window.App = new PedalParkApp({ appendTo: $('body') });
    });
});
