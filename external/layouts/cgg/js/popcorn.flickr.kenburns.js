// PLUGIN: flickr.kenburns

(function (Popcorn) {

  var allImages = {
  };

  Popcorn.plugin( "fkb", function( options ) {

    var startedLoading = false,
      loaded = false,
      popcorn = this,
      container,
      image,
      imageRecord,
      units,
      duration,
      position, destination;

		function load() {
			var link, url = 'http://api.flickr.com/services/rest/?method=flickr.photos.getInfo';
	
			if (options.apikey) {
				url += "&api_key=" + options.apikey;
			}
			
			url += "&photo_id=" + options.id + "&lang=en-us&format=json&jsoncallback=flickr";
			
			startedLoading = true;
			
			Popcorn.xhr.getJSONP( url, function( data ) {
				var photo;
	
				if (!data || data.stat !== 'ok' || !data.photo) {
					return;
				}
				
				photo = data.photo;
				
				image = document.createElement('img');
				image.src = 'http://farm' + photo.farm + '.static.flickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '_m.jpg';
				
				link = document.createElement('a');
				link.setAttribute('target', '_new');
				if (photo.urls && photo.urls.url && photo.urls.url[0] &&
					photo.urls.url[0]._content) {
	
					link.setAttribute('href', photo.urls.url[0]._content);
	
				} else {
	
					link.setAttribute('href', 'http://www.flickr.com/photos/' + (photo.owner.nsid) + '/' + photo.id + '/');
	
				}
				
				link.addEventListener('click', function() {
					popcorn.pause();
				}, false);
				
				link.appendChild(image);
				container.appendChild(link);
				
				image.addEventListener('load', function () {
					if (options.startPosition) {
						container.style.position = 'absolute';
						container.style.top = position.top + '%';
						container.style.left = position.left + '%';
						container.style.width = position.scale + '%';
						this.style.width = '100%';
					}
	
					loaded = true;
	
					if (typeof options.onLoad === 'function') {
						options.onLoad(options);
					}
				}, true);
	
				options.image = image;
			});
		}

		//for now assume all units are percentages
		//todo: handle different formats, check for negative sizes
		if (options.startPosition) {
			position = {
				top: options.startPosition[0] || 10,
				left: options.startPosition[1] || 10,
				scale: options.startPosition[2] || 10
			};

			if (options.endPosition) {
				destination = {
					top: options.endPosition[0] || position.top,
					left: options.endPosition[1] || position.left,
					scale: options.endPosition[2] || position.scale
				};
			}
		}

    duration = options.end - options.start;

    if (isNaN(options.fadeIn)) {
      options.fadeIn = Math.min(0.25, duration / 8);
    } else if (options.fadeIn > duration) {
      options.fadeIn = duration;
    }

    duration -= options.fadeIn;
    if (isNaN(options.fadeOut)) {
      options.fadeOut = Math.min(0.25, (options.end - options.start) / 8);
    } else if (options.fadeOut > duration) {
      options.fadeIn = duration;
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
        
        if (!options.id) {
        	return;
        }
        
        container = document.createElement('div');
        container.style.display = 'none';
        
        if (options.target && options.target.tagName) {
          target = options.target;
        } else {
          target = document.getElementById( options.target || 'image-container' );
        }

        if ( target ) {
          target.appendChild( container );
        }
        
		if (typeof options.onSetup === 'function') {
			options.onSetup(options);
		}

        load();

      },
  
      /**
       * @member fli 
       * The start function will be executed when the currentTime 
       * of the video  reaches the start time provided by the 
       * options variable
       */
      start: function( event, options ) {
        if (loaded) {
          container.style.display = '';
        }

        if (typeof options.onStart === 'function') {
          options.onStart(options);
        }
      },
      /**
       * @member image 
       * The start function will be executed when the currentTime 
       * of the video  reaches the start time provided by the 
       * options variable
       */
      frame: function(event, options, time){
        if (!loaded) {
          return;
        }

      	var t = time - options.start, fraction = t / (options.end - options.start);
      	var opacity = 1;
      	if (t < options.fadeIn) {
      		opacity = t / options.fadeIn;
      	} else if (time > options.end - options.fadeOut) {
      		opacity = (options.end - time) / options.fadeOut;
      	}
        container.style.opacity = opacity;

        if (destination) {
          container.style.top = fraction * (destination.top - position.top) + position.top + '%';
          container.style.left = fraction * (destination.left - position.left) + position.left + '%';
          container.style.width = fraction * (destination.scale - position.scale) + position.scale + '%';
        }
        if (typeof options.onFrame === 'function') {
          options.onFrame(options, time);
        }
      },
      /**
       * @member image 
       * The end function will be executed when the currentTime 
       * of the video  reaches the end time provided by the 
       * options variable
       */
      end: function( event, options ) {
        container.style.display = 'none';

        if (typeof options.onEnd === 'function') {
          options.onEnd(options);
        }
      },
      _teardown: function( options ) {
        options.target.removeChild(container);
      },
      manifest: {
        about:{
          name: "Popcorn Ken Burns Flickr Plugin",
          version: "0.1",
          author: "Brian Chirls",
          website: "http://chirls.com/"
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
          fadeIn: {
            elem: "input",
            type: "number",
            label: "Fade In"
          },
          fadeOut: {
            elem: "input",
            type: "number",
            label: "Fade Out"
          },
          id: {
            elem: "input",
            type: "text",
            label: "Photo ID"
          },
          target: "image-container",
          startPosition: {
            elem: "input",
            type: "text",
            label: "Start Position and Size"
          },
          endPosition: {
            elem: "input",
            type: "text",
            label: "End Position and Size"
          },
          apikey: {
            elem: "input", 
            type: "text",   
            label: "Flickr API Key (optional)"
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
