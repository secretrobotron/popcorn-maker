// PLUGIN: Lumakey

(function (Popcorn) {

"use strict";

var Seriously,
	seriousliesByTarget = {},
	nop = {
		start: function() {},
		end: function() {}
	};

	Popcorn.plugin( 'lumakey' , function(options) {
		var popcorn,
			canvas,
			video,
			seriously,
			sSource, //Seriously source object
			sTarget, //Seriously target object
			luma,  //Seriously luma effect node
			target,
			id;
		
		if (!window.WebGLRenderingContext) {
			return nop;
		}
		
		if (!Seriously) {
			Seriously = window.Seriously;
			if (!Seriously) {
				return nop;
			}
		}
			
		if (!options) {
			return nop;
		}

		if (!options.target && !options.seriously) {
			return nop;
		}

		popcorn = this;
		video = popcorn.media;

		if (!video || video.tagName !== 'VIDEO') {
			return nop;
		}
		
		if (options.seriously) {
			seriously = options.seriously;
			
			for (id in seriousliesByTarget) {
				if (seriousliesByTarget[id].seriously === seriously) {
					luma = seriousliesByTarget[id].luma;
					break;
				}
			}
			
			if (!luma) {
				id = Popcorn.guid();
				luma = seriously.effect('lumakey');
				luma.source = video;
				seriousliesByTarget[id] = {
					seriously: seriously,
					luma: luma
				};
			}
		} else {
			target = options.target;

			if (typeof target === 'string') {

				target = document.getElementById(target);
				
				if (!target) {
					return nop;
				}
			}
			
			if (target.tagName === 'CANVAS') {

				canvas = target;

				if (!canvas.id) {
					canvas.id = Popcorn.guid('canvas');
				}

				id = canvas.id;

			} else if (target.nodeType === 1) {

				if (!target.id) {
					target.id = Popcorn.guid('target');
				}

				id = target.id;

				seriously = seriousliesByTarget[id];
				if (seriously && seriously.canvas) {
					canvas = seriously.canvas;
				} else {
					//see if we can find a canvas
					
					var i;
					canvas = target.getElementsByTagName('canvas');
					if (canvas && canvas.length) {
						canvas = canvas[0];
					} else {
						canvas = document.createElement('canvas');
					}
					if (!canvas.getAttribute('width')) {
						canvas.width = video.videoWidth || video.offsetWidth || 640;
					}
					if (!canvas.getAttribute('height')) {
						canvas.height = video.videoHeight || video.offsetHeight || canvas.width * 9/16;
					}
					target.appendChild(canvas);

					if (seriously) {
						seriously.canvas = canvas;
					}
				}
			} else {
				return nop;
			}

			seriously = seriousliesByTarget[id];
			if (seriously) {
				luma = seriously.luma;
				seriously = seriously.seriously;
			} else {
				seriously = new Seriously();

				luma = seriously.effect('lumakey');
				luma.source = video;

				seriousliesByTarget[id] = {
					seriously: seriously,
					luma: luma,
					canvas: canvas
				};

				seriously.go();
			}
			
			sSource = seriously.source(video);
			sTarget = seriously.target(canvas);
			sTarget.source = video;
			
			//validate clipBlack and clipWhite
			if (options.clipBlack === undefined || isNaN(options.clipBlack) ||
				options.clipBlack < 0) {
				options.clipBlack = 0;
			} else if (options.clipBlack > 1) {
				options.clipBlack = 1;
			}
			
			if (options.clipWhite === undefined || isNaN(options.clipWhite) ||
				options.clipWhite > 1) {
				options.clipWhite = 1;
			} else if (options.clipWhite < options.clipBlack) {
				options.clipWhite = options.clipBlack
			}

			options.seriously = seriously;
			options.canvas = canvas;

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
		}

		return {
			start: function( event, options ) {
				luma.clipBlack = options.clipBlack;
				luma.clipWhite = options.clipWhite;
				sTarget.source = luma;

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
				sTarget.source = video;
				
				if (typeof options.onEnd === 'function') {
					try {
						options.onEnd(options);
					} catch (e) {
					}
				}
			},
			_teardown: function( options ) {
			}
		};
	},
	{
		about: {
			name: 'Popcorn Luma Key Plugin',
			version: 0.1,
			author: 'Brian Chirls',
			website: 'http://chirls.com'
		},
		options: {
			start: {elem:'input', type:'text', label:'In'},
			end: {elem:'input', type:'text', label:'Out'},
			clipBlack: {
				elem:'input',
				type:'text',
				label:'Clip Black'
			},
			clipWhite: {
				elem:'input',
				type:'text',
				label:'Clip White'
			}/*,
			seriously: {
				type:'object', label:'Seriously object'
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
			} */
		},
		customEditor: ''
	}
);
})( Popcorn );