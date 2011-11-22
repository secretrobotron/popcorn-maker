// PLUGIN: lightbox

(function (Popcorn) {

"use strict";

	var nop = {
		start: function() {},
		end: function() {}
	},
		styleSheet;

	Popcorn.plugin( 'lightbox' , function(options) {
		var popcorn,
			video,
			target,
			container,
			lightboxContainer,
			close,
			playing,
			classes,
			i;
		
		if (!options) {
			return nop;
		}

		if (!options.target || !options.html) {
			return nop;
		}

		popcorn = this;
		video = popcorn.media;

		target = options.target;

		if (typeof target === 'string') {

			target = document.getElementById(target);
			
			if (!target) {
				return nop;
			}
		}
		
		//default style our tweet buttons in a style sheet so they can be overridden
		if (!styleSheet) {
			styleSheet = document.createElement('style');
			styleSheet.setAttribute('type', 'text/css');
			styleSheet.appendChild(document.createTextNode('.popcorn-lightbox { overflow: auto; }\n' +
			'.popcorn-lightbox-link { cursor: pointer; }\n' +
			'.popcorn-lightbox-lightbox { position: fixed; padding: 40px; background-color: rgba(0, 0, 0, 0.7); color: white; border: 4px solid rgba(255, 255, 255, 0.6); border-radius: 8px; z-index: 999999; margin: 0 auto; max-width: 90%; max-height: 90%; }\n' +
			'.popcorn-lightbox-lightbox > .close { position:absolute; top: 4px; right: 4px; cursor: pointer; text-decoration: underline; }'
			));
			document.head.appendChild(styleSheet);
		}
		
		container = document.createElement('div');
		container.style.cssText = options.style || '';

		i = options.top;
		if (i || i === 0) {
			if (!isNaN(i)) {
				i += 'px';
			}
			container.style.top = i;
			container.style.position = 'absolute';
		}

		i = options.left;
		if (i || i === 0) {
			if (!isNaN(i)) {
				i += 'px';
			}
			container.style.left = i;
			container.style.position = 'absolute';
		}
		
		i = options.right;
		if (i || i === 0) {
			if (!isNaN(i)) {
				i += 'px';
			}
			container.style.right = i;
			container.style.position = 'absolute';
		}
		
		i = options.bottom;
		if (i || i === 0) {
			if (!isNaN(i)) {
				i += 'px';
			}
			container.style.bottom = i;
			container.style.position = 'absolute';
		}
		
		if (options.align) {
			container.style.textAlign = options.align;
		}
		

		container.style.display = 'none';
		if (options.classes) {
			if (options.classes.length && options.classes.join) {
				//an array works
				classes = 'popcorn-lightbox ' + options.classes.join(' ');
			} else {
				classes = 'popcorn-lightbox ' + options.classes.split(/,\s\n\r/).join(' ');
			}
		} else {
			classes = 'popcorn-lightbox';
		}
		container.setAttribute('class', classes);
		
		container.innerHTML = options.html;
		
		if (options.lightbox) {
			container.classList.add('popcorn-lightbox-link');
			
			lightboxContainer = document.createElement('div');
			lightboxContainer.setAttribute('class', classes + ' popcorn-lightbox-lightbox');
			lightboxContainer.innerHTML = options.lightbox;
			lightboxContainer.style.display = 'none';

			container.addEventListener('click', function() {
				playing = !video.paused;
				video.pause();
				
				if (lightboxContainer) {
					lightboxContainer.style.display = '';
					
					lightboxContainer.style.maxHeight = window.innerHeight * 0.7 + 'px';

					var top = Math.max((window.innerHeight - lightboxContainer.offsetHeight) / 2, 0);
					top = Math.min(top, window.innerHeight * 0.15);

					lightboxContainer.style.top = top + 'px';

					lightboxContainer.style.left = Math.max((window.innerWidth - lightboxContainer.offsetWidth) / 2, 0) + 'px';
					
				}
			}, false);
			
			close = document.createElement('div');
			close.setAttribute('class','close');
			close.innerHTML = 'Close';
			close.addEventListener('click', function() {
				lightboxContainer.style.display = 'none';
				if (playing) {
					video.play();
				}
			}, false);
			lightboxContainer.insertBefore(close, lightboxContainer.firstChild);

			document.body.appendChild(lightboxContainer);
		}
		
		target.appendChild(container);
		options.container = container;
		options.lightboxContainer = lightboxContainer;

		//if event callbacks are strings, swap them out for functions
		(function() {
			var i, event, events = ['onLoad', 'onStart', 'onFrame', 'onEnd'];
			for (i = 0; i < events.length; i++) {
				event = events[i];
				if (options[event] && typeof options[event] === 'string') {
					if (window[ options[event] ] && typeof window[ options[event] ] === 'function') {
						options[event] = window[ options[event] ];
					}
				}
			}
		}());

		if (typeof options.onLoad === 'function') {
			options.onLoad(options);
		}

		return {
			start: function( event, options ) {
				if (options.container) {
					options.container.style.display = '';
				}

				if (typeof options.onStart === 'function') {
					try {
						options.onStart(options);
					} catch (e) {
					}
				}
			},
			frame: function(event, options, time){
				if (typeof options.onFrame === 'function') {
					try {
						options.onFrame(options, time);
					} catch (e) {
					}
				}
			},
			end: function( event, options ) {
				if (options.container) {
					options.container.style.display = 'none';
				}
				
				if (options.lightboxContainer) {
					options.lightboxContainer = 'none';
				}
				
				if (typeof options.onEnd === 'function') {
					try {
						options.onEnd(options);
					} catch (e) {
					}
				}
			},
			_teardown: function( options ) {
				if (options.container && options.container.parentNode) {
					options.container.parentNode.removeChild(options.container);
					container = null;
					delete options.container;
				}

				if (options.lightboxContainer && options.lightboxContainer.parentNode) {
					options.lightboxContainer.parentNode.removeChild(options.lightboxContainer);
					lightboxContainer = null;
					delete options.lightboxContainer;
				}
			}
		};
	},
	{
		about: {
			name: 'Popcorn Lightbox Plugin',
			version: 0.1,
			author: 'Brian Chirls',
			website: 'http://chirls.com'
		},
		options: {
			start: {elem:'input', type:'text', label:'In'},
			end: {elem:'input', type:'text', label:'Out'},
			html: {
				elem:'input',
				type:'text',
				label:'HTML'
			},
			lightbox: {
				elem:'input',
				type:'text',
				label:'Lightbox contents (HTML)'
			},
			classes: {
				elem:'input',
				type:'text',
				label:'List of classes to apply to text container'
			},
			style: {
				elem:'input',
				type:'text',
				label:'CSS to apply to text'
			},
			align: {
				elem:'select',
				label:'CSS to apply to text'
			},
			top: {
				elem:'input',
				type:'number',
				label:'Top position'
			},
			left: {
				elem:'input',
				type:'number',
				label:'Left position'
			},
			bottom: {
				elem:'input',
				type:'number',
				label:'Bottom position'
			},
			right: {
				elem:'input',
				type:'number',
				label:'Right position'
			}/*,
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
			}*/
		}
	});
})( Popcorn );
