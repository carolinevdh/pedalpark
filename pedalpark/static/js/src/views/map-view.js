/*
 * View for Google Maps map
 */
var MapView = Backbone.View.extend({
	el : $('#map-canvas'),
	initialize: function(){
		_.bindAll(this,'redrawWithMarkers','redrawWithPath');
	},

	/* Redraws map with markers, takes several arguments for style aside from actual locations */
	redrawWithMarkers: function(doMarkLocation, doCenter, isManualLocation, lat, long, parkinglocations){

		map = new google.maps.Map(this.el, { zoom : 1});

		//latLngBounds helps us center and zoom the map on the displayed markers
		var latLngBounds = new google.maps.LatLngBounds();

		//render the main, current or manual, location
		var mainLatLng = new google.maps.LatLng(lat, long);
		if ( doMarkLocation ) {
			if ( isManualLocation ) icon = 'static/img/marker-finish.png';
			else icon = 'static/img/marker-cyclist.png';
			var currentMarker = new google.maps.Marker({
				position : mainLatLng,
				map : map,
				icon : icon
			});
			latLngBounds.extend(mainLatLng);
		}

		//render all parkinglocations
		var nLocations = parkinglocations.length;
		for ( i = 0; i < nLocations; i++ ){
			var latLng = new google.maps.LatLng(
					parkinglocations[i].get('coordinates').latitude,
					parkinglocations[i].get('coordinates').longitude);
			var parkingMarker = new google.maps.Marker({
				position : latLng,
				map : map,
				icon : this.getMarkerIcon(nLocations, i+1)
			});
			latLngBounds.extend(latLng);
		}

		//add a layer with bicycle-safe streets
		var bikeLayer = new google.maps.BicyclingLayer();
		bikeLayer.setMap(map);

		//make sure all markers are in view and the view is centered
		if ( doCenter )	map.setCenter(latLngBounds.getCenter());
		map.fitBounds(latLngBounds);

		//listen to resize events, to make map responsive
		var center;
		function calculateCenter() {
			center = map.getCenter();
		}
		google.maps.event.addDomListener(map, 'idle', function() {
			calculateCenter();
		});
		google.maps.event.addDomListener(window, 'resize', function() {
			if( doCenter ) map.setCenter(center);
			map.fitBounds(latLngBounds);
		});
	},

	/* Redraws map with a view of the world, used as loading screen and in certain fault cases */
	redrawWorld: function(){
		map = new google.maps.Map(this.el, {
			zoom : 1,
			center : new google.maps.LatLng(0,0)
		});

		//listen to resize events, to make map responsive
		var center;
		function calculateCenter() {
			center = map.getCenter();
		}
		google.maps.event.addDomListener(map, 'idle', function() {
			calculateCenter();
		});
		google.maps.event.addDomListener(window, 'resize', function() {
			map.setCenter(center);
		});
	},

	/* Redraws map with a path between marked locations origin and destination */
	/* Also, renders written directions as received simultaneously from Google API */
	redrawWithPath: function(origin, destination, directionsView){
		map = new google.maps.Map(this.el, {});

		//object for visual display of directions, on map and written
		var directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});
		directionsDisplay.setMap(map);
		directionsView.setDirections(directionsDisplay);

		//set two markers based on input and save in LatLngBounds
		var latLngBounds = new google.maps.LatLngBounds();
		var start = new google.maps.LatLng(origin[0],origin[1]);
		var startMarker = new google.maps.Marker({
				position : start,
				map : map,
				icon : new google.maps.MarkerImage('static/img/marker-cyclist.png')
		});
		latLngBounds.extend(start);
		var end = new google.maps.LatLng(destination[0],destination[1]);
		var endMarker = new google.maps.Marker({
				position : end,
				map : map,
				icon : new google.maps.MarkerImage('static/img/marker-parking.png')
		});
		latLngBounds.extend(end);

		//zoom and center map to markers
		map.fitBounds(latLngBounds);

		//add a layer with bicycle-safe streets
		var bikeLayer = new google.maps.BicyclingLayer();
		bikeLayer.setMap(map);

		//prepare and execute directions request to Google
		var request = {
			origin: start,
			destination: end,
			travelMode: google.maps.TravelMode.BICYCLING
		};
		var directionsService = new google.maps.DirectionsService();
		directionsService.route(request, function(result, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				//directions received, render on map and in written form
				directionsDisplay.setDirections(result);
			}
		});
	},

	/* Returns a parking marker image, based on proximity to location */
	getMarkerIcon: function(size, index){
		if (size < 10) return 'static/img/marker-parking-' + index + '.png';
		else return 'static/img/marker-parking.png';
	}
});
	