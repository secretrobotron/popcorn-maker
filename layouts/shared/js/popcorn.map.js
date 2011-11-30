// PLUGIN: Map

(function (Popcorn) {

	var mapsRequested = false,
		mapsLoaded = false,
		geocoder,
		waitingToLoad = [],
		allMaps = [],
		mapsById = {},
		activeEventsById = {},
		styleSheet;


	function zoomMap(mapData, map, marker) {
		var i, activeEvents = mapData.activeEvents,
			bounds, listener, event;
		var s = [];

		if (!activeEvents.length) {
			map.fitBounds(mapData.bounds);
			return;
		}

		bounds = new google.maps.LatLngBounds();
		
		for (i = 0; i < activeEvents.length; i++) {
			event = activeEvents[i];
			if (event.latLng) {
				bounds.extend(activeEvents[i].latLng);
			}

			if (event.bounds && event.bounds instanceof google.maps.LatLngBounds) {
				bounds.union(event.bounds);
			}
			s.push(activeEvents[i].title);
		}

		map.fitBounds(bounds);

	}

		
	Popcorn.plugin( "map", function( options ) {
		var popcorn = this,
			activeEvents, allEvents,
			mapDiv,
			map,
			mapData,
			infoWindow,
			target,
			latLng;
		

		function load() {
			var callbackName, classes;
		
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
				if (options.bounds) {
					if (! (options.bounds instanceof google.maps.LatLngBounds) ) {
						options.bounds = options.bounds.split(',');
						try {
							options.bounds = new google.maps.LatLngBounds(
								new google.maps.LatLng(parseFloat(options.bounds[0]), parseFloat(options.bounds[1])),
								new google.maps.LatLng(parseFloat(options.bounds[2]), parseFloat(options.bounds[3]))
							);
						} catch (e) {
							console.log('error', e);
							delete options.bounds;
						}
					}
				}

				if (!isNaN(options.lat) && !isNaN(options.lng)) {
					latLng = new google.maps.LatLng(options.lat, options.lng);
					options.latLng = latLng;
					
				} else {
					if (!geocoder) {
						geocoder = new google.maps.Geocoder();
					}
					
					geocoder.geocode( { address: options.address },
						function(results, status) {
							if (!options) {
								return;
							}

							if (status == google.maps.GeocoderStatus.OK) {
								latLng = results[0].geometry.location;
								options.latLng = latLng;
								options.lat = latLng.lat();
								options.lng = latLng.lng();
								options.bounds = results[0].geometry.viewport;
								
								console.log('Found Location', options.address, options.title, latLng.lat(), latLng.lng() );
								
								load();
							} else {
								console.log('Location not found', options.address, options.title);
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
						mapDiv = allMaps[i].map.getDiv();
						if (mapDiv === target ||
							mapDiv.parentNode === target ||
							mapDiv.parentNode && mapDiv.parentNode.parentNode === target) {

							mapData = allMaps[i];
							map = mapData.map;
							break;
						}
					}
				}
				
				if (!map) {
					//map container needs to be empty
					if (!mapDiv.children && mapDiv.childNodes.length || mapDiv.children.length) {
						mapDiv.appendChild(document.createElement('div'));
						mapDiv = mapDiv.childNodes[mapDiv.childNodes.length - 1];
					}
					
					//still don't have a map, so let's create one
					map = new google.maps.Map(mapDiv, {
						zoom: 14,
						mapTypeId: google.maps.MapTypeId.ROADMAP
					});
					classes = mapDiv.getAttribute('class') || '';
					classes = classes.split(' ');
					if (classes.indexOf('popcorn-map') < 0) {
						classes.push('popcorn-map');
					}
					mapDiv.setAttribute('class', classes.join(' '));
					
					//map.setCenter( latLng );
					
					mapData = {
						map: map,
						bounds: new google.maps.LatLngBounds(),
						activeEvents: activeEventsById[target.id] || [],
						allEvents: []
					};
					
					if (target.id) {
						mapsById[ target.id ] = mapData;
					}
					
					allMaps.push(mapData);

					if (mapData.activeEvents.length) {
						//IE doesn't support classLists, so we do it the old-fashioned way
						var classes = mapDiv.getAttribute('class') || '';
						classes = classes.split(' ');
						if (classes.indexOf('active') < 0) {
							classes.push('active');
						}
						mapDiv.setAttribute('class', classes.join(' '));
						
						google.maps.event.trigger(map, 'resize');

						for (i = 0; i < mapData.activeEvents.length; i++) {
							if (mapData.activeEvents[i].marker) {
								mapData.activeEvents[i].marker.setVisibile(true);
							}
						}

						zoomMap(mapData, map);
					}

				}
			}
			
			activeEvents = mapData.activeEvents;
			allEvents = mapData.allEvents;
			allEvents.push(options);

			mapData.bounds.extend(latLng);
			map.fitBounds(mapData.bounds);

			var marker = new google.maps.Marker({
				map: map, 
				position: latLng,
				title: options.title || options.address,
				animation: google.maps.Animation.DROP,
				visible: (activeEvents.indexOf(options) >= 0)
			});
			
			
			var infoContent;
			if (options.title) {
				if (options.link) {
					infoContent = document.createElement('a');
					infoContent.setAttribute('href', options.link);
					infoContent.appendChild(document.createTextNode(options.title));
				} else {
					infoContent = document.createTextNode(options.title);
				}
				infoWindow = new google.maps.InfoWindow({
					content: infoContent
				});
				google.maps.event.addListener(marker, 'click', function() {
					popcorn.pause();
					infoWindow.open(map,marker);
				});
			}
		
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
				if (!options.target ||
					!options.address && (!options.lat || !options.lng) ) {
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
							mapDiv = map.getDiv();
						}
					} else {
						var i;
						for (i = 0; i < allMaps.length; i++) {
							mapDiv = allMaps[i].map.getDiv();
							if (mapDiv === target ||
								mapDiv.parentNode === target ||
								mapDiv.parentNode && mapDiv.parentNode.parentNode === target) {

								mapData = allMaps[i];
								map = mapData.map;
								break;
							}
						}
					}
				} else if (target.setMapTypeId && target.getDiv) {
					//seems only way to check for google map object is to duck-type
					map = target;
					mapDiv = target.getDiv();
					if (mapDiv.id) {
						if (mapsById[ mapDiv.id ]) {
							mapData = mapsById[ mapDiv.id ];
						} else {
							mapData = {
								map: map,
								bounds: new google.maps.LatLngBounds(),
								activeEvents: [],
								allEvents: []
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
				
				if (target.id) {
					if (!activeEventsById[target.id]) {
						activeEventsById[target.id] = [];
					}
					activeEvents = activeEventsById[target.id];
				}
				
				if (!styleSheet) {
					styleSheet = document.createElement('style');
					styleSheet.setAttribute('type', 'text/css');
					styleSheet.appendChild(
						document.createTextNode('.popcorn-map { visibility: hidden; width: 100%; height: 100%; }\n' +
						'.popcorn-map.active { visibility: visible; }\n'
					));
					document.head.appendChild(styleSheet);
				}

				load();
			},
			start: function( event, options ) {
				var classes;

				if (activeEvents) {
					activeEvents.push(options);
				}
				
				if (options) {
					if (options.marker) {
						options.marker.setVisible(true);
					}

					if (mapDiv && window.google && window.google.maps &&
						(options.map || map) ) {
						//IE doesn't support classLists, so we do it the old-fashioned way
						classes = mapDiv.getAttribute('class') || '';
						classes = classes.split(' ');
						if (classes.indexOf('active') < 0) {
							classes.push('active');
						}
						mapDiv.setAttribute('class', classes.join(' '));
						
						google.maps.event.trigger(map, 'resize');
						
						if (options.latLng) {
							zoomMap(mapData, options.map || map);
						}
					}

				
					if (typeof options.onStart === 'function') {
						options.onStart(options);
					}
				}
			},
			frame: function( event, options, time ) {
				if (options && typeof options.onFrame === 'function') {
					options.onFrame( options, time );
				}
			},
			end: function( event, options ) {
				var classes, index;
				
				if (activeEvents) {
					var index = activeEvents.indexOf(options);
					if (index >= 0) {
						activeEvents.splice(index, 1);
					}
				}
				
				if (options) {
					if (options.marker) {
						if (infoWindow) {
							infoWindow.close();
						}
						options.marker.setVisible(false);
					}

					if (map) {
						mapDiv = map.getDiv();
						if (!activeEvents.length) {
							//IE doesn't support classLists, so we do it the old-fashioned way
							classes = mapDiv.getAttribute('class') || '';
							classes = classes.split(' ');
							index = classes.indexOf('active');
							if (index >= 0) {
								classes.splice(index, 1);
							}
							mapDiv.setAttribute('class', classes.join(' '));
						} else if (options.map) {
							zoomMap(mapData, options.map);
						}
					}

					if (typeof options.onEnd === 'function') {
						options.onEnd(options);
					}
				}
			},
			_teardown: function( event, opts ) {
				var index;

				if (options) {
					if (typeof options.onEnd === 'function') {
						options.onEnd(options);
					}

					if (options.marker) {
						options.marker.setVisible(false);
						options.marker.setMap(null);
						options.marker = null;
					}

					//clean up after any maps and divs we may have added
					if (allEvents && allEvents.indexOf) {
						index = allEvents.indexOf(options);
						if (index >= 0) {
							allEvents.splice(index, 1);
							/*
							if (!allEvents.length) {
								if (mapDiv && mapDiv !== target && mapDiv.parentNode) {
									mapDiv.parentNode.removeChild(mapDiv);
								}
								map = null;
							}
							*/
						}
					}
				}
				infoWindow = null;
				mapDiv = null;
				mapData = null;
				activeEvents = null;
				latLng = null;
				options = null;
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
					title: {
						elem: "input",
						type: "text",
						label: "Title"
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
					address: {
						elem: "input",
						type: "text",
						label: "Address"
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
