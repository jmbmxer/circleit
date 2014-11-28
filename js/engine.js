$(document).ready(function() {

	var cnv = '';
	var ctx = '';
	var copy = '';

	var hidden_cnv = '';
	var hidden_ctx = '';
	var hidden_copy = '';

	var img = new Image();
	var hidden_img = new Image();

	var mouse_down = false;

	var circle_zoom_level = 100;
	var circle_x = 0;
	var circle_y = 0;

	var hidden_circle_zoom_level = 100;
	var hidden_circle_x = 0;
	var hidden_circle_y = 0;
	
	var ratio = 1;

	if ((navigator.userAgent.indexOf("MSIE") != -1 ) || (!!document.documentMode == true )) {
		$('#drop_zone').css('position', 'fixed');
	}

	//Redraw canvas
	function redraw() {
		if (circle_zoom_level < 10) {
			circle_zoom_level = 10;
		}
		//Trick to clear the canvas
		cnv.width = cnv.width;

		//Draw the image to the canvas
		ctx.drawImage(img, 0, 0, cnv.width, cnv.height);

		//Draw circle overlay
		ctx.beginPath();
		ctx.rect(0, 0, cnv.width, cnv.height);
		ctx.arc(circle_x, circle_y, circle_zoom_level, 0, Math.PI * 2, true);
		ctx.fillStyle = "#FFFFFF";
		ctx.fill();

		ctx.closePath();

	}

	function redrawHidden() {
		if (hidden_circle_zoom_level < 10) {
			hidden_circle_zoom_level = 10;
		}
		//Trick to clear the canvas
		hidden_cnv.width = hidden_cnv.width;

		//Draw the image to the canvas
		hidden_ctx.drawImage(img, 0, 0, hidden_cnv.width, hidden_cnv.height);

		//Draw circle overlay
		hidden_ctx.beginPath();
		hidden_ctx.rect(0, 0, hidden_cnv.width, hidden_cnv.height);
		hidden_ctx.arc(hidden_circle_x, hidden_circle_y,(hidden_circle_zoom_level * ratio ), 0, Math.PI * 2, true);
		hidden_ctx.fillStyle = "#FFFFFF";
		hidden_ctx.fill();

		hidden_ctx.closePath();
		// Trim whitespaces that left
		hidden_copy = document.createElement('canvas').getContext('2d');
		var pixels = hidden_ctx.getImageData(0, 0, hidden_cnv.width, hidden_cnv.height), l = pixels.data.length, i, bound = {
			top : null,
			left : null,
			right : null,
			bottom : null
		}, x, y;

		for ( i = 0; i < l; i += 4) {
			if (pixels.data[i] !== 255 && pixels.data[i + 1] !== 255 && pixels.data[i + 1] !== 255) {
				x = (i / 4) % hidden_cnv.width;
				y = ~~((i / 4) / hidden_cnv.width);

				if (bound.top === null) {
					bound.top = y;
				}

				if (bound.left === null) {
					bound.left = x;
				} else if (x < bound.left) {
					bound.left = x;
				}

				if (bound.right === null) {
					bound.right = x;
				} else if (bound.right < x) {
					bound.right = x;
				}

				if (bound.bottom === null) {
					bound.bottom = y;
				} else if (bound.bottom < y) {
					bound.bottom = y;
				}
			}
		}

		var trimHeight = bound.bottom - bound.top, trimWidth = bound.right - bound.left, trimmed = hidden_ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

		hidden_copy.canvas.width = trimWidth;
		hidden_copy.canvas.height = trimHeight;
		hidden_copy.putImageData(trimmed, 0, 0);

		//Prepare download button
		$('#download').attr('href', hidden_copy.canvas.toDataURL('image/png'));
	}

	function insert(src) {
		// Clear previous canvas
		$('#canvas_element').remove();
		$(cnv).off('mousedown mouseup mousemove mousewheel DOMMouseScroll');
		cnv = null;
		ctx = null;
		
		// Clear previous hidden canvas 
		$('#canvas_element_hidden').remove();
		$(hidden_cnv).off('mousedown mouseup mousemove mousewheel DOMMouseScroll');
		hidden_cnv = null;
		hidden_ctx = null;

		//Prepare the image to be inserted in the canvas
		if (navigator.userAgent.indexOf("Firefox") == -1) {
			img.crossOrigin = "Anonymous";
			hidden_img.crossOrigin = "Anonymous";
		}
		
		
		img.src = src;
		hidden_img.src = src;
		hidden_img.onload = function(){
			// Create dynamic hidden canvas
			hidden_cnv = document.createElement("canvas");
			hidden_cnv.setAttribute("id", "canvas_element_hidden");
			hidden_cnv.setAttribute('width', hidden_img.width);
			hidden_cnv.setAttribute('height', hidden_img.height);
			hidden_cnv.style.border = "1px solid #FFFFFF";
			$('#canvas_holder_hidden').append($(hidden_cnv));
			
			// Draw the image in the hidden canvas
			hidden_ctx = hidden_cnv.getContext("2d");
			hidden_ctx.drawImage(hidden_img, 0, 0, hidden_cnv.width, hidden_cnv.height);
			hidden_circle_x = hidden_cnv.width / 2;
			hidden_circle_y = hidden_cnv.height / 2;
			
			redrawHidden();
		};
		img.onload = function() {

			ratio = ((img.width > img.height) ? (img.width / $('#drop_zone').width()) : (img.height / 350) );
			//var ratio = 1;
			// Create dynamic canvas
			cnv = document.createElement("canvas");
			cnv.setAttribute("id", "canvas_element");
			cnv.setAttribute('width', img.width / ratio);
			cnv.setAttribute('height', img.height / ratio);
			cnv.style.border = "1px solid #FFFFFF";


			// Append canvases
			$('#canvas_holder').append($(cnv));

			// Draw the image in the canvas
			ctx = cnv.getContext("2d");
			ctx.drawImage(img, 0, 0, cnv.width, cnv.height);
			circle_x = cnv.width / 2;
			circle_y = cnv.height / 2;

			redraw();
			// Listeners
			$(cnv).on('mousedown', function(evt) {
				mouse_down = true;
			});
			$(cnv).on('mousemove', function(evt) {

				if (mouse_down) {
					circle_x = evt.offsetX;
					circle_y = evt.offsetY;
					
					hidden_circle_x = (evt.offsetX * ratio);
					hidden_circle_y = (evt.offsetY * ratio );
					
					if (circle_x == undefined) {
						circle_x = evt.clientX - $(evt.target).offset().left;
						hidden_circle_x = (evt.clientX - $(evt.target).offset().left) * ratio;
					}
					if (circle_y == undefined) {
						circle_y = evt.clientY - $(evt.target).offset().top;
						hidden_circle_y = (evt.clientY - $(evt.target).offset().top) * ratio;
					}
					redraw();
				}

			});
			$(cnv).on('mouseup', function(evt) {
				mouse_down = false;
			});

			$(cnv).bind('mousewheel DOMMouseScroll', function(event) {
				if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
					circle_zoom_level += 10;
					hidden_circle_zoom_level += 10 ;
				} else {
					circle_zoom_level -= 10;
					hidden_circle_zoom_level -= 10;
				}
				redraw();
			});

		};
	}

	function handleFileSelect(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		var file = {};

		if (evt.dataTransfer) {
			file = evt.dataTransfer.files;
		} else if (evt.target.files) {
			file = evt.target.files;
		} else {
			insert('http://marvilcg.com/proxy/proxy.php?url=' + encodeURI($('#url_files').val()));
			return;
		}
		file = file[0];

		var reader = new FileReader();
		reader.readAsDataURL(file);

		reader.onload = (function(theFile) {
			return function(e) {
				insert(e.target.result);
			};
		})(file);
	}

	function handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		evt.dataTransfer.dropEffect = 'copy';
	}


	$('#download').on('click', function(e) {
		e.preventDefault();
		redrawHidden();
		hidden_copy.canvas.toBlob(function(blob) {
			saveAs(blob, "circle_it.png");
		});

	});
	var dropZone = document.getElementById('drop_zone');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('drop', handleFileSelect, false);

	document.getElementById('url_files').addEventListener('change', handleFileSelect, false);
	document.getElementById('files').addEventListener('change', handleFileSelect, false);

});

