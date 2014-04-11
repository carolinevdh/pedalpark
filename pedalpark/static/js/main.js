require.config({
	paths: {
		jquery : 'vendor/jquery',
		foundation : 'vendor/foundation',
		underscore : 'vendor/underscore',
		backbone : 'vendor/backbone',
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

define(['jquery', 'underscore', 'backbone', 'foundation', 'template', 'pedalpark'], function() {
    $(document).foundation({});
    $(document).ready(function() {
        window.App = new PedalParkApp({ appendTo: $('body') });
    });
});