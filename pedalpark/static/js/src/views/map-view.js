/*
 * View for Google Maps map
 */
var MapView = Backbone.View.extend({
	el : $('#map-canvas'),
	initialize: function(){
		_.bindAll(this,'renderLocations','renderForPath');

		//create map on window
		map = this.getNewMap({});
		//prepare array for markers
		this.markers = [];
		//LatLngBounds helps us center and zoom the map on the displayed markers
		bounds = new google.maps.LatLngBounds();

		//make map responsive
		var center;
		function calculateCenter() {
			center = map.getCenter();
		}
		google.maps.event.addDomListener(map, 'idle', function() {
			calculateCenter();
		});
		google.maps.event.addDomListener(window, 'resize', function() {
			map.setCenter(center);
			if(!bounds.isEmpty()) map.fitBounds(bounds);
		});
	},

	/* Returns a new Map object with BicyclingLayer */
	getNewMap: function(options){
		//create map object
		var map = new google.maps.Map(this.el, options);

		//add a layer with bicycle-safe streets
		var bikeLayer = new google.maps.BicyclingLayer();
		bikeLayer.setMap(map);

		return map;
	},

	/* Redraws map with markers */
	renderLocations: function(doMarkLocation, lat, long, parkinglocations){
		bounds = new google.maps.LatLngBounds();

		//if a special location needs to be marked
		if(doMarkLocation){
			//prepare and mark special location
			var mainLatLng = new google.maps.LatLng(lat, long);
			var currentMarker = new google.maps.Marker({
				position : mainLatLng,
				map : map,
				icon : this.getStartMarkerIcon()
			});
			this.markers.push(currentMarker);
			bounds.extend(mainLatLng);
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
				icon : this.getParkingMarkerIcon(nLocations, i+1)
			});
			this.markers.push(parkingMarker);
			bounds.extend(latLng);
		}

		//make sure all markers are in view and the view is centered
		map.setCenter(bounds.getCenter());
		map.fitBounds(bounds);
	},

	/* Redraws map with a view of the world, used as loading screen and in certain fault cases */
	renderWorld: function(){
		map = this.getNewMap({
			zoom: 1,
			center: new google.maps.LatLng(0,0)
		});
	},

	/* Redraws map with a path between marked locations origin and destination */
	renderForPath: function(origin, destination, renderer){
		map = this.getNewMap({});
		bounds = new google.maps.LatLngBounds();

		//set two markers based on input and save in LatLngBounds
		var startMarker = new google.maps.Marker({
				position : origin,
				map : map,
				icon : this.getStartMarkerIcon(false)
		});
		this.markers.push(startMarker);
		bounds.extend(origin);
		var endMarker = new google.maps.Marker({
				position : destination,
				map : map,
				icon : this.getDefaultParkingMarkerIcon()
		});
		this.markers.push(endMarker);
		bounds.extend(destination);

		//make sure all markers are in view and the view is centered
		map.setCenter(bounds.getCenter());
		map.fitBounds(bounds);

		//render path received from Google API
		renderer.setMap(map);
	},

	/* Removes path and markers */
	clearOverlays: function(renderer){
		if(renderer !== undefined) renderer.setMap(null);
		this.removeMarkers();
	},

	/* Removes map from all markers */
	removeMarkers: function(){
		for(var i = 0; i < this.markers.length; i++)
			this.markers[i].setMap(null);
		this.markers.length = 0;
	},

	/* Returns url for starting marker icon */
	getStartMarkerIcon: function(){
		return 'static/img/marker-cyclist.png';
	},

	/* Returns url for a parking marker icon, based on proximity to location */
	getParkingMarkerIcon: function(size, index){
		if (size < 10) return 'static/img/marker-parking-' + index + '.png';
		else return this.getDefaultParkingMarkerIcon();
	},

	/* Returns url for standard parking marker icon */
	getDefaultParkingMarkerIcon: function(){
		return 'static/img/marker-parking.png';
	}
});
	