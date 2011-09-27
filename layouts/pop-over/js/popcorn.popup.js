// PLUGIN: popup
// http://www.youtube.com/watch?v=CwnnSSs0kFA
/*

todo: animate top, left and other styles (color, font size, etc.)

*/

(function (Popcorn) {

"use strict";

	var styleSheet,
		svg, clipPath, ellipse,
		sounds = {},
		events = [],
		nop = {
			start: function() {},
			end: function() {}
		},
		MAX_AUDIO_TIME = 2;

	function createSVGElement(name) {
		return document.createElementNS("http://www.w3.org/2000/svg",name);
	}

	Popcorn.plugin( 'popup' , function(options) {
		var popcorn,
			video,
			target,
			container,
			textContainer,
			innerDiv,
			lastScale = 1,
			lastOpacity = 1,
			text, node, i,
			duration, fadeTime = 0.3,
			img, audio;
		
		function selectAudio(src) {
			var i, j, n, event, diff,
				eligibleAudio,
				audio;
			
			if (!sounds[src]) {
				audio = document.createElement('audio');
				audio.src = src;
				audio.preload = true;
				audio.style.display = 'none';
				audio.addEventListener('ended', function() {
					this.pause();
					this.currentTime = 0;
				}, false);
				document.body.appendChild(audio);
				sounds[src] = [audio];
				return audio;
			}
			
			audio = sounds[src][0];
			if (audio.duration) {
				diff = Math.min(audio.duration, MAX_AUDIO_TIME);
			} else {
				diff = MAX_AUDIO_TIME;
			}
			
			//make sure there are no other events using this sound at the same time
			eligibleAudio = sounds[src].slice(0);
			for (i = 0; i < events.length; i++) {
				event = events[i];
				if (event.sound === options.sound &&
					event.start <= options.start + diff &&
					event.start + diff >= options.start) {

					j = eligibleAudio.indexOf(event.audio);
					if (j >= 0) {
						eligibleAudio.splice(j, 1);
					}
				}
			}
			
			if (eligibleAudio.length) {
				audio = eligibleAudio[0];
			} else {
				audio = sounds[src][0].cloneNode(true);
				audio.addEventListener('ended', function() {
					this.pause();
					this.currentTime = 0;
				}, false);
				document.body.appendChild(audio);
				sounds[src].push(audio);
			}
			
			return audio;
		}
		
		if (!options) {
			return nop;
		}

		if (!options.target || !options.text && !options.image) {
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
		
		//default styles in a style sheet so they can be overridden
		//todo: load font using api instead to avoid FOUT
		if (!styleSheet) {
			styleSheet = document.createElement('style');
			styleSheet.setAttribute('type', 'text/css');
			styleSheet.appendChild(document.createTextNode("@font-face { font-family: 'Varela Round'; font-style: normal; font-weight: normal; src: local('Varela Round'), local('VarelaRound-Regular'), url('http://themes.googleusercontent.com/static/fonts/varelaround/v1/APH4jr0uSos5wiut5cpjrqRDOzjiPcYnFooOUGCOsRk.woff') format('woff');}\n" +
			'.popcorn-popup { background-color: black; border: 4px solid black; border-radius: 12px; color: black; padding: 0 5px; font-family: \'Varela Round\', sans-serif; font-size: 16px; }\n' +
			'.popcorn-popup > div { background-color: white; border-radius: 8px; padding: 4px; position: relative; }\n' +
			'.popcorn-popup .image { clip-path: url("#popcorn-popup-clip-path"); }\n' +
			'.popcorn-popup .icon { position: absolute; z-index: 2; top: -50%;}\n' +
			'.popcorn-popup .icon + div { padding-left: 12px; }\n' +
			'#popcorn-popup-svg { display:none; }'
			));
			document.head.appendChild(styleSheet);
			
			//making a dummy placeholder to force the font to load
			node = document.createElement('div');
			node.style.visibility = 'hidden';
			node.style.fontFamily = 'Varela Round';
			node.innerHTML = 'I have no responsibilities here whatsoever';
			document.body.appendChild(node);
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
				container.setAttribute('class', 'popcorn-popup ' + options.classes.join(' '));
			} else {
				container.setAttribute('class', 'popcorn-popup ' + options.classes.split(/,\s\n\r/).join(' '));
			}
		} else {
			container.setAttribute('class', 'popcorn-popup');
		}
		
		innerDiv = document.createElement('div');
		container.appendChild(innerDiv);
		
		if (options.link) {
			textContainer = document.createElement('a');
			textContainer.setAttribute('href', options.link);
			if (options.linkTarget) {
				textContainer.setAttribute('target', options.linkTarget);
			} else {
				textContainer.setAttribute('target', '_new');
			}

			//pause video when link is clicked
			textContainer.addEventListener('click', function() {
				video.pause();
			}, false);

			innerDiv.appendChild(textContainer);
		} else {
			textContainer = innerDiv;
		}
		
		text = options.text.split(/[\n\r]/);
		for (i = 0; i < text.length; i++) {
			if (i) {
				textContainer.appendChild(document.createElement('br'));
			}
			textContainer.appendChild(document.createTextNode(text[i]));
		}
		
		if (options.image) {
			if (!svg) {
				svg = createSVGElement('svg');
				svg.id = 'popcorn-popup-svg';

				clipPath = createSVGElement('clipPath');
				clipPath.id = 'popcorn-popup-clip-path';
				clipPath.setAttribute('clipPathUnits', 'objectBoundingBox');
				svg.appendChild(clipPath);

				ellipse = createSVGElement('clipPath');
				ellipse.setAttribute('cx', 0.5);
				ellipse.setAttribute('cy', 0.5);
				ellipse.setAttribute('rx', 0.95);
				ellipse.setAttribute('ry', 0.95);
				svg.appendChild(clipPath);
				
				document.body.appendChild(svg);
			}
		} else if (options.icon) {
			img = document.createElement('img');
			img.setAttribute('class', 'icon');
			img.src = options.icon;
			img.addEventListener('load', function() {
				var width = img.width || img.naturalWidth,
					height = img.height || img.naturalHeight;
				
				if (height > 60) {
					width = 60 * width / height;
					height = 60;
					img.style.width = width + 'px';
				}
				
				img.style.left = -(width - 16) + 'px';
			}, false);
			container.insertBefore(img, container.firstChild);
		}
		
		target.appendChild(container);
		options.container = container;
		
		//load up sound.
		if (options.sound !== false) {
			if (!options.sound) {
				options.sound = 'sounds/bottle_pop_3.wav'; //temporary default
			} else if (options.sound instanceof HTMLMediaElement) {
				audio = options.sound;
				options.sound = audio.currentSrc;
			}
			
			if (!audio) {
				audio = selectAudio(options.sound);
				options.audio = audio;
			}
		}
		
		events.push(options);

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
		
		if (options.exit !== undefined && !isNaN(options.exit)) {
			fadeTime = options.exit;
			options.exit = 'fade';
		} else if (!options.exit ||
			['fade', 'cut', 'fly'].indexOf(options.exit) < 0) {

			options.exit = 'fade';
		}

		duration = Math.min(0.25, options.end - options.start - 0.25);		
		fadeTime = Math.min(fadeTime, options.end - options.start - 0.25 - fadeTime);

		if (typeof options.onLoad === 'function') {
			options.onLoad(options);
		}

		return {
			start: function( event, options ) {
				options.container.style.display = '';
				
				if (audio && audio.duration) {
					audio.play();
					if (!audio.duration || isNaN(audio.duration) || audio.duration > MAX_AUDIO_TIME) {
						setTimeout(function() {
							audio.pause();
							audio.currentTime = 0;
						}, MAX_AUDIO_TIME);
					}
				}

				if (typeof options.onStart === 'function') {
					try {
						options.onStart(options);
					} catch (e) {
					}
				}
			},
			frame: function(event, options, time){
				var scale = 1, opacity = 1,
					t = time - options.start,
					div = options.container,
					transform;

				if (t < duration) {
					scale = ( 1 - Math.pow( (t / duration) / 0.7 - 1, 2) ) / 0.8163;
				} else if (options.exit === 'fade') {
					t = time - (options.end - fadeTime);
					
					if (t > 0) {
						opacity = 1 - (t / fadeTime);
					}
				}
				
				if (lastScale !== scale) {
					transform = 'scale(' + scale + ')';
					container.style.MozTransform = transform;
					container.style.webkitTransform = transform;
					container.style.ieTransform = transform;
					container.style.oTransform = transform;
					container.style.transform = transform;
					lastScale = scale;
				}

				if (lastOpacity !== opacity) {
					container.style.opacity = opacity;
					lastOpacity = opacity;
				}

				if (typeof options.onFrame === 'function') {
					try {
						options.onFrame(options, time);
					} catch (e) {
					}
				}
			},
			end: function( event, options ) {
				options.container.style.display = 'none';
				
				if (typeof options.onEnd === 'function') {
					try {
						options.onEnd(options);
					} catch (e) {
					}
				}
			},
			_teardown: function( options ) {
				if (options.container.parentNode) {
					options.container.parentNode.removeChild(options.container);
					container = null;
					delete options.container;
				}
			}
		};
	},
	{
		about: {
			name: 'Popcorn "Pop-Over" Video Plugin',
			version: 0.1,
			author: 'Brian Chirls',
			website: 'http://chirls.com'
		},
		options: {
			start: {elem:'input', type:'text', label:'In'},
			end: {elem:'input', type:'text', label:'Out'},
			text: {
				elem:'input',
				type:'text',
				label:'Text'
			},
			link: {
				elem:'input',
				type:'text',
				label:'Link (URL)'
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