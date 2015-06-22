EngineController.prototype.__initUI = function () {
	this.delta = $("#delta");
	this.gen = $("#gen");
	
	/*
	 * Drawing setup 
	 */
	this.pen = {
		shape : "circle",
		lineWidth : 3,
		stroke : true,
		fill : true
	}
	
	var _self = this;
	// show controlls
	$('.controlls').show();
	/*
	 * image library init
	 */
	this.library = $(".library img");
	var imgsLen = this.library.length;
	this.library.on('load', function () {
		imgsLen--;
		if (imgsLen === 0) {
//			var canvas = _self.buffers[_self.activeBufferIndex];
//			_self.contexts[_self.activeBufferIndex].drawImage(
//				_self.image[0],
//				0, 0, _self.image[0].naturalWidth, _self.image[0].naturalHeight,
//				0, 0, canvas.width, canvas.height
//			);
		}
	}).on('click', function () {
		_self.setImage($(this));
	});
	this.image = this.library.first();
	this.image.addClass("active");
	/*
	 * Play/Pause button
	 */
	var btn = $("#play");
	btn.on('click', function (event) {
		if (_self.timer === null) {
			_self.start();
			$(this).html("<i class=\"fa fa-pause\"></i> Pause");
		} else {
			_self.stop();
			$(this).html("<i class=\"fa fa-play\"></i> Play");
		}
	});
	/*
	 * Clear, Reset buttons
	 */
	btn = $("#clear,#reset");
	btn.on('click', function (event) {
		_self.clear(true);
	});

	btn = $("#neighbors_label");
	//	console.log(this.idealCount.toString());
	//	console.log(btn);
	console.log(btn.parent().find('input[name="nmin"]').length);
	btn.parent().find('input[name="nmin"]').val(this.idealCount.toString());
	btn.on('click', function (event) {
		_self.idealCount = $(this).parent().find('input[name="nmin"]').val().split(",");
		for (var i = 0; i < _self.idealCount.length; i++) {
			_self.idealCount[i] *= 1;
		}
		$("#neighbors_label span").first().text('Ideal number of neighbors: ' + _self.idealCount);
	});
	btn = $("#refresh a");
	btn.on('click', function (event) {
		_self.refreshTimeout = $(this).attr('data-val') * 1;
		$("#refresh_label span").first().text('Refresh timeout: ' + $(this).text());
	});

	btn = $('input[name="shape"]');
	btn.on('click', function (event) {
		_self.pen.shape = $(this).val();
	});
	btn = $('input[name="lw"]');
	btn.on('change', function (event) {
		_self.pen.lineWidth = $(this).val() * 1;
	});
	btn = $('input[name="stroke"]');
	btn.on('click', function (event) {
		_self.pen.troke = $(this)[0].checked;
	});
	btn = $('input[name="fill"]');
	btn.on('click', function (event) {
		_self.pen.fill = $(this)[0].checked;
	});

	btn = $("#resize");
	btn.parent().find('input[name="w"]').val(_self.buffers[_self.activeBufferIndex].width);
	btn.parent().find('input[name="h"]').val(_self.buffers[_self.activeBufferIndex].height);
	btn.on('click', function (event) {
		var inputs = $(this).parent().find('input');
		var css = {};
		var l = 0;
		var v;

		for (var i = 0; i < inputs.length; i++) {
			v = $(inputs[i]);
			switch (v.attr('name')) {
				case 'w':
					if (v.val() !== "") {
						css.width = v.val();
						l++;
					}
					break;
				case 'h':
					if (v.val() !== "") {
						css.height = v.val();
						l++;
					}
					break;
			}
		}
		if (l) {
			_self.view.css(css);
			for (var i = 0; i < _self.buffers.length; i++) {
				$(_self.buffers[i]).attr({width: _self.view.width(), height: _self.view.height()});
				_self.contexts[i] = _self.buffers[i].getContext('2d');
			}
			_self.clear();
		}
	});

	btn = $("#add");
	btn.on('click', function (event) {
		var img = $("#file").prop('files');
		if (img.length > 0) {
			if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
				console.log('The File APIs are not fully supported in this browser.');
				return;
			}

			if (!img[0]) {
				alert("Please select a file before clicking 'Load'");
			}
			else {
				var file = img[0];
				var fr = new FileReader();
				fr.onload = function () {
					var newImg = $('<img src="' + this.result + '">');
					$('.library').append(newImg);
					newImg.on('load', function () {
						$("#file").val('');
						$(this).on('click', function () {
							_self.setImage($(this));

						});
					});
				}
				//fr.readAsText(file);
				fr.readAsDataURL(file);
			}

		}
	});
}