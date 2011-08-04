 $(document).ready(function(){

            $('.enable-scroll').tinyscrollbar();	

			

			// 

			$(".collapse-btn").toggle(function() {

				$('.collapse-btn a').css('backgroundPosition','6px 7px');
				
				//$("body").addClass('collapsed');
				
				$(".toolbox").animate({ width: "46px" }, 500);

				$('.collapse-btn a').text("");

				$(".timeline").stop().animate({ paddingRight:'86px'}, 500);
				
				$(".qtip").hide();

				

			},function() {

				$('.collapse-btn a').css('backgroundPosition','6px -9px');
				
				//$("body").removeClass('collapsed');

				$(".toolbox").animate({ width: "120px" }, 500);

				$('.collapse-btn a').text("collapse"); 

				$(".timeline").stop().animate({ paddingRight:'160px'}, 500);

			});

		

			// 

			$(".hide-timeline a").toggle(function() {

				$(this).css('backgroundPosition','20px -10px');

				$(".hide-timeline").animate({ bottom: '36px' }, 500);

				$("#properties-panel").animate({ height: '38px' }, 500);

				$(this).text("Show Timeline"); 

							},function() {

				$(this).css('backgroundPosition','20px 7px');

				$(this).text("Hide Timeline"); 

				$(".hide-timeline").animate({ bottom: "268px" }, 500);

				$("#properties-panel").animate({ height: "270px" }, 500);

			});

			

			// 

			$(".play-btn a").toggle(function() {

				$(".play-btn a span").css('backgroundPosition','0 -25px');

			},function() {

				$(".play-btn a span").css('backgroundPosition','0 0');

			});

			

			$(".sound-btn a").toggle(function() {

				$(".sound-btn a span").css('backgroundPosition','0 -16px');

			},function() {

				$(".sound-btn a span").css('backgroundPosition','0 0');

			});

			

			

		

		//

		try {

				$(".websites2").msDropDown();

		

				} catch(e) {

					alert("Error: "+e.message);

				}

				

		// Popup

		  $('.timeline-heading .edit a').click(function(){

			  $('.close-div').fadeOut('fast');

			  $('.popupDiv').fadeIn('slow');

			  $('#popup-1').show();
			  
			  $(' .balck-overlay ').hide();

			});

		  $('.layer-btn .edit a').click(function(){

			  $('.close-div').fadeOut('fast');

			  $('.popupDiv').fadeIn('slow');

			  $('#popup-2').show();
			  
			  $(' .balck-overlay ').hide();

			});

		  $('.p-3').click(function(){

			  $('.close-div').fadeOut('fast');

			  $('.popupDiv').fadeIn('slow');

			  $('#popup-3').show();
			  
			  $(' .balck-overlay ').show();
			  
			});

		  $('.track-event').click(function(){

			  $('.close-div').fadeOut('fast');

			  $('.popupDiv').fadeIn('slow');

			  $('#popup-4').show();
			  
			  $(' .balck-overlay ').hide();
			  
			});

		  $('.popup-close-btn, .balck-overlay').click(function(){

			  $('.close-div').fadeOut('fast');

			  $('.popups').hide();

			});

			

			

			//

			$('a#slickbox-toggle').click(function() {

				$('#slickbox').slideToggle(400);

				$(this).text($(this).text() == 'Show box' ? 'Hide box' : 'Show box'); // <- HERE

				return false;

			});

			

			

			$(function(){ $("label").inFieldLabels(); });

			

			$(function() {
				$( ".draggable" ).draggable();
			});

			
			
			
//qtip


    var d = {
        links: {
            position: {
                at: "top right",
                my: "bottom left",
                viewport: $(window)
            }
        },
                


    },
    c = $("#contentheader");
    $('a[title!=""]', c).qtip(d.links);			

        });	  
 
