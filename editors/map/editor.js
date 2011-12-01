ButterEditor(function() {
  var bin, icons = [], userIcons, i, editor,
    gmaps, geocoder,
    geocache = {},
    map, latLng, marker, tempMarker,
    latLngTimeout, locationTimeout;
  
  function saveLocation(loc) {
    if (!loc) {
      return;
    }

    if (loc.latLng) {
      loc = loc.latLng;
    }

    tempMarker.setVisible(false);
    
    latLng = loc;
    
    editor.setField('lat', loc.lat());
    editor.setField('lng', loc.lng());

/*	
    marker.setPosition(loc);
    marker.setTitle(trackEvent.label);
    marker.setVisible(true);
    
    map.setCenter(loc);
*/
  }
  
  function saveBounds() {
    var bounds = map.getBounds();
    if (editor.trackEvent.address || editor.trackEvent.lat && editor.trackEvent.lng) {
      editor.setField('bounds', bounds.toUrlValue());
    }
  }
  
  function geocode(location) {

    function processResults(results) {
      latLng = results[0].geometry.location;
      map.fitBounds(results[0].geometry.viewport);
      
      tempMarker.setPosition(latLng);
      tempMarker.setTitle(results[0].formatted_address);
      tempMarker.setVisible(true);
    }

    if (geocache[location]) {

      processResults(geocache[location]);

    } else if (geocoder) {

      geocoder.geocode( { address: location },
        function(results, status) {
          if (status == gmaps.GeocoderStatus.OK) {
            geocache[location] = results;
            processResults(results);
          }
        }
      );

    }
  }
  
  function checkLocation() {
    if (locationTimeout) {
      clearTimeout(locationTimeout);
      locationTimeout = false;
    }

    locationTimeout = setTimeout(function() {
      var loc;

      if (!geocoder) {
        return;
      }

      loc = editor.fields.address.element.value;
      loc = loc.replace(/^[\s\t\n\r ]+/, '');
      loc = loc.replace(/[\s\t\n\r ]+$/, '');
      loc = loc.replace(/[\s\t\n\r ]+/, ' ', 'g');
      
      if (loc) {
        geocode(loc);
      }
    }, 500);
  }
  
  function checkLatLng(field, value) {
    if (latLngTimeout) {
      clearTimeout(latLngTimeout);
      latLngTimeout = false;
    }

    latLngTimeout = setTimeout(function() {

      var lat, lng;
      if (!geocoder) {
        return;
      }

      lat = editor.trackEvent.lat;
      if ( lat !== '' && isNaN(lat) || lat < -90 || lat > 90 ) {
        editor.fields.lat.element.style.backgroundColor = '#f11';
        lat = '';
      } else {
        editor.fields.lat.element.style.backgroundColor = '';
      }

      lng = editor.trackEvent.lng;
      if ( lng !== '' && isNaN(lng) || lng < -180 || lng > 180 ) {
        editor.fields.lng.element.style.backgroundColor = '#f11';
        lng = '';
      } else {
        editor.fields.lng.element.style.backgroundColor = '';
      }

      if (!isNaN(lat) && !isNaN(lng) && lat !== '' && lng != '') {
        //saveLocation( new gmaps.LatLng(lat, lng) );
        var loc = new gmaps.LatLng(lat, lng);
        tempMarker.setVisible(false);
        marker.setPosition(loc);
        marker.setTitle(editor.trackEvent.title);
        marker.setVisible(true);
        
        map.setCenter(loc);
      }
    }, 500);
  }
  
  function loadGoogleMaps() {
    var trackEvent = editor.trackEvent;

    gmaps = window.google.maps;
    geocoder = new gmaps.Geocoder();
    
    map = new gmaps.Map(document.getElementById('map'), {
      zoom: 3,
      mapTypeId: gmaps.MapTypeId.ROADMAP
    });

    gmaps.event.addListener(map, 'bounds_changed', saveBounds);
    
    tempMarker = new gmaps.Marker({
      map: map,
      visible: false,
      draggable: true
    });
    
    marker = new gmaps.Marker({
      map: map,
      visible: false,
      draggable: true,
      icon: 'https://www.google.com/intl/en_ALL/mapfiles/marker_purple.png'
    });
    
    gmaps.event.addListener(marker, 'dragend', saveLocation);
    gmaps.event.addListener(marker, 'click', saveLocation);
    gmaps.event.addListener(tempMarker, 'dragend', saveLocation);
    gmaps.event.addListener(tempMarker, 'click', saveLocation);

    if (trackEvent.lat !== undefined &&
      !isNaN(trackEvent.lat) &&
      trackEvent.lng !== undefined &&
      !isNaN(trackEvent.lng) &&
      trackEvent.lat < -90 && trackEvent.lat > 90 &&
      trackEvent.lng < -180 && trackEvent.lng > 180
      ) {
      latLng = new gmaps.LatLng(trackEvent.lat, trackEvent.lng);
      map.setCenter(latLng);
      map.setZoom(14);

      saveLocation(latLng)

    } else if (trackEvent.location) {
      geocode(trackEvent.location);
    } else {
      latLng = new gmaps.LatLng(37.09024, -95.712891);
      map.setCenter(latLng);
    }
  }

  if (window.parent) {
    try {
      gmaps = window.parent.google && window.parent.google.maps;
    } catch (e) {
    }
  }
    
  if (gmaps) {
    loadGoogleMaps();
  } else {
    (function() {
      var script = document.createElement('script');
      script.src = 'http://maps.google.com/maps/api/js?sensor=false&callback=loadGoogleMaps';
      document.head.appendChild(script);

      window.loadGoogleMaps = loadGoogleMaps;
    }());
  }

  editor = new EditorState({
    start: {
      type: 'time'
    },
    end: {
      type: 'time'
    },
    top: {
      type: 'percent'
    },
    left: {
      type: 'percent'
    },
    title: 'text',
    address: {
      type: 'text',
      callback: checkLocation
    },
    lat: {
      type: 'number',
      callback: checkLatLng
    },
    lng: {
      type: 'number',
      callback: checkLatLng
    },
    bounds: 'object',
    target: {
      type: 'target',
      fieldset: 'target-section'
    }
  }, 30);
  
  //main controls
  document.getElementById('undo').addEventListener('click', function(event) {
    editor.undo();
  }, false);

  document.getElementById('cancel').addEventListener('click', function(event) {
    editor.cancel();
  }, false);

  document.getElementById('ok').addEventListener('click', function(event) {
    editor.ok();
  }, false);

  document.getElementById('delete').addEventListener('click', function(event) {
    editor.del();
  }, false);

  //save expanded fieldset state in localStorage
  var headers = document.getElementsByClassName('form-header'),
    headerStates,
    header, id;
    
  try {
    headerStates = (localStorage && JSON.parse(localStorage.pmHeaderStates));
  } catch(e) {
  }
  if (!headerStates) {
    headerStates = {};
  }

  for (i = 0; i < headers.length; i++) {
    header = headers[i];
    id = header.id || EditorState.util.trim(header.textContent);
    header.addEventListener('click', (function(element, id) {
      return function() {
        element.classList.toggle('collapse');
        if (id) {
          headerStates[id] = element.classList.contains('collapse')
          try {
            localStorage.pmHeaderStates = JSON.stringify(headerStates);
          } catch (e) {
          }
        }
      };
    }(header, id)), false);
    if (id && headerStates[id]) {
      header.classList.add('collapse');
    }
  }
});
