// PLUGIN: City Slickers

(function (Popcorn) {

	var mapsRequested = false,
		mapsLoaded = false,
		geocoder,
		waitingToLoad = [],
		allMaps = [],
		mapsById = {};


	function zoomMap(mapData, map, marker) {
		var i, activeEvents = mapData.activeEvents,
			bounds, listener;
		var s = [];

		if (!activeEvents.length) {
			map.fitBounds(mapData.bounds);
			return;
		}

		bounds = new google.maps.LatLngBounds();
		
		for (i = 0; i < activeEvents.length; i++) {
			bounds.extend(activeEvents[i].latLng);
			s.push(activeEvents[i].label);
		}

		map.fitBounds(bounds);

	}

		
	Popcorn.plugin( "slickers", function( options ) {
		var popcorn = this,
			activeEvents,
			mapDiv,
			map,
			mapData,
			latLng;
		

		function load() {
			var callbackName;
		
			if (!mapDiv) {
				return;
			}

			//see if Google Maps API has been loaded at all
			if (!window.google || !window.google.maps) {
				if (!mapsRequested) {
					mapsRequested = true;

					callbackName = 'googleMapsSlickers' + Date.now() + Math.round(Math.random() * 100);
					
					window[callbackName] = function() {
						mapsLoaded = true;

						while (waitingToLoad.length) {
							(waitingToLoad.shift())();
							
							//if (mapData && map && mapData.bounds) {
							//	map.fitBounds(mapData.bounds);
							//}
						}
					};
					Popcorn.getScript("http://maps.google.com/maps/api/js?sensor=false&callback=" + callbackName);
				}
				
				waitingToLoad.push(load);
				
				return;
			}
			
			if (!latLng) {
				if (!isNaN(options.lat) && !isNaN(options.lng)) {
					latLng = new google.maps.LatLng(options.lat, options.lng);
					options.latLng = latLng;
				} else {
					if (!geocoder) {
						geocoder = new google.maps.Geocoder();
					}
					
					geocoder.geocode( { address: options.location },
						function(results, status) {
							if (status == google.maps.GeocoderStatus.OK) {
								latLng = results[0].geometry.location;
								options.latLng = latLng;
								options.lat = latLng.lat();
								options.lng = latLng.lng();
								
								console.log('Found Location', options.location, options.label, latLng.lat(), latLng.lng() );
								
								load();
							} else {
								console.log('Location not found', options.location, options.label);
							}
						}
					);

					return;
				}
			}

			if (!map) {
				//Google Maps API has been loaded, but we don't have a map yet
				//check again to see if a map has been created
				if (mapDiv.id && mapsById[ mapDiv.id ]) {
					mapData = mapsById[ mapDiv.id ];
					map = mapData.map;
				} else {
					var i;
					for (i = 0; i < allMaps.length; i++) {
						if (allMaps[i].map.getDiv() === target) {
							mapData = allMaps[i];
							map = mapData.map;
							break;
						}
					}
				}
				
				if (!map) {
					//still don't have a map, so let's create one
					map = new google.maps.Map(mapDiv, {
						zoom: 14,
						mapTypeId: google.maps.MapTypeId.ROADMAP
					});
					
					//map.setCenter( latLng );
					
					mapData = {
						map: map,
						bounds: new google.maps.LatLngBounds(),
						activeEvents: []
					};
					
					if (mapDiv.id) {
						mapsById[ mapDiv.id ] = mapData;
					}
					
					allMaps.push(mapData);
				}
			}
			
			activeEvents = mapData.activeEvents;

			mapData.bounds.extend(latLng);
			map.fitBounds(mapData.bounds);

			var marker = new google.maps.Marker({
				map: map, 
				position: latLng,
				animation: google.maps.Animation.DROP,
				visible: false
			});
		
			options.map = map;
			options.marker = marker;
			options.mapBounds = mapData.bounds;
			if (typeof options.onLoad === 'function') {
				options.onLoad(options);
			}
		}
		
		//if event callbacks are strings, swap them out for functions
		if (options.onLoad && typeof options.onLoad === 'string') {
			if (window[options.onLoad] && typeof window[options.onLoad] === 'function') {
				options.onLoad = window[options.onLoad];
			}
		}
	
		if (options.onStart && typeof options.onStart === 'string') {
			if (window[options.onStart] && typeof window[options.onStart] === 'function') {
				options.onStart = window[options.onStart];
			}
		}
	
		if (options.onEnd && typeof options.onEnd === 'string') {
			if (window[options.onEnd] && typeof window[options.onEnd] === 'function') {
				options.onEnd = window[options.onEnd];
			}
		}
	
		return {
			_setup: function( options ) {
				var target;
				if (!options.target ||
					!options.location && (!options.lat || !options.lng) ) {
					return;
				}
				
				target = options.target;
				
				if (typeof target === 'string') {
					target = document.getElementById(target);
					if (!target) {
						return;
					}
				}
				
				if (target instanceof HTMLElement) {
					mapDiv = target;
					if (target.id) {
						if ( mapsById[ target.id ] ) {
							mapData = mapsById[ target.id ];
							map = mapData.map;
						}
					} else {
						var i;
						for (i = 0; i < allMaps.length; i++) {
							if (allMaps[i].map.getDiv() === target) {
								mapData = allMaps[i];
								map = mapData.map;
								break;
							}
						}
					}
				} else if (target.setMapTypeId && target.getDiv) {
					//seems only way to check for google map object is to duck type
					map = target;
					mapDiv = target.getDiv();
					if (mapDiv.id) {
						if (mapsById[ mapDiv.id ]) {
							mapData = mapsById[ mapDiv.id ];
						} else {
							mapData = {
								map: map,
								bounds: new google.maps.LatLngBounds(),
								activeEvents: []
							};
							mapsById[ mapDiv.id ] = mapData;
						}
					}
					
					if (mapData && allMaps.indexOf(mapData) < 0) {
						allMaps.push(mapData);
					} else {
						for (i = 0; i < allMaps.length; i++) {
							if (allMaps[i].map === map) {
								mapData = allMaps[i];
								map = mapData.map;
								break;
							}
						}
					}
				}
				
				load();
			},
			start: function( event, options ) {
				activeEvents.push(options);
				
				//zoomMap(mapData, options.map, options.marker);
				
				if (options.marker) {
					options.marker.setVisible(true);
				}
				
				if (typeof options.onStart === 'function') {
					options.onStart(options);
				}
			},
			frame: function( event, options, time ) {
				if (typeof options.onFrame === 'function') {
					options.onFrame( options, time );
				}
			},
			end: function( event, options ) {
				
				var index = activeEvents.indexOf(options);
				if (index >= 0) {
					activeEvents.splice(index, 1);
				}
				
				//zoomMap(mapData, options.map);
				
				if (popcorn.currentTime() < options.start && options.marker) {
					options.marker.setVisible(false);
				}

				if (typeof options.onEnd === 'function') {
					options.onEnd(options);
				}
			},
			_teardown: function( event, opts ) {
				if (typeof options.onEnd === 'function') {
					options.onEnd(options);
				}

				mapDiv = null;
				mapData = null;
				map = null;
				activeEvents = null;
				latLng = null;
				
				if (options) {
					if (options.marker) {
						options.marker.setVisible(false);
						options.marker.setMap(null);
						options.marker = null;
					}
					options = null;
				}
				opts = null;
			},
			manifest: {
				about: {
					name: "Popcorn City Slickers Map Plugin",
					version: "0.1",
					author: "Brian Chirls",
					website: "http://chirls.com"
				},
				options: {
					start: {
						elem: "input",
						type: "number",
						label: "In"
					},
					end: {
						elem: "input",
						type: "number",
						label: "Out"
					},
					target: "map",
					label: {
						elem: "input",
						type: "text",
						label: "Label"
					},
					lat: {
						elem: "input",
						type: "text",
						label: "Lat"
					},
					lng: {
						elem: "input",
						type: "text",
						label: "Lng"
					},
					location: {
						elem: "input",
						type: "text",
						label: "Location"
					},
					onSetup: {
						type: "function",
						label: "onSetup callback function"
					},
					onLoad: {
						type: "function",
						label: "onLoad callback function"
					},
					onStart: {
						type: "function",
						label: "onStart callback function"
					},
					onEnd: {
						type: "function",
						label: "onEnd callback function"
					},
					onFrame: {
						type: "function",
						label: "onFrame callback function"
					}
				}
			}
		};
	});


})( Popcorn );
