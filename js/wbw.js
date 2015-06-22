
var EngineController = function (view) {
	this.view = $(view);
	this.delta = $("#delta");
	this.timer = null;
	this.buffers = this.view.find('canvas');
	
	this.idealCount = [2];
	this.refreshTimeout = 200;
	
	this.shape = "circle";
	this.lineWidth = 3;
	this.stroke = true;
	this.fill = true;
	
	var _self = this;
	if (this.buffers.length === 0) {
		this.buffers = [null, null];
		var canvas;
		for (var i = 0; i < this.buffers.length; i++) {
			canvas = $('<canvas>').attr({width: this.view.width(), height: this.view.height()});
			canvas.addClass('buffer');
			canvas.addClass((i === 0 ? 'front' : 'back') + '_buffer');

			this.view.append(canvas);
			this.buffers[i] = canvas[0];
		}
	}
	this.contexts = [];
	this.activeBufferIndex = 0;

	var canvas = this.buffers[0];
	var b2;
	if (canvas && canvas.getContext) {
		for (var i = 0; i < this.buffers.length; i++) {
			this.contexts.push(this.buffers[i].getContext('2d'));
			this.buffers[i].addEventListener('mousedown', function(event){ 
				event.preventDefault ? event.preventDefault() : event.returnValue = false; 
			});
			this.buffers[i].addEventListener('mousemove', function(event){
				if (event.buttons === 1) {
					b2 = _self.contexts[_self.activeBufferIndex];
					b2.fillStyle = "#000000";
					b2.stroStyle = "#000000";
					b2.lineWidth = _self.lineWidth;
					if (_self.shape == "circle") {
						b2.beginPath();
						b2.arc(event.layerX, event.layerY, 20, 0, 2*Math.PI, true); // Create the arc path.
						if (_self.fill) b2.fill();
						if (_self.stroke) b2.stroke();
					} else {
						if (_self.fill) b2.fillRect(event.layerX-10, event.layerY-10, 20, 20);
						
						
					}
					
				}
			}, false);
		}
		this.initialize();
	}
}

EngineController.prototype.initialize = function () {

	this.initUI();
	var _self = this;
	var imgs = $('.library img');
	var imgsLen = imgs.length;
	imgs.on('load', function () {
		imgsLen--;
		$(this).on('click', function () {
			_self.setImage($(this));
		});
		if (imgsLen === 0) {
			var canvas = _self.buffers[_self.activeBufferIndex];
			_self.contexts[_self.activeBufferIndex].drawImage(
				_self.image[0],
				0, 0, _self.image[0].naturalWidth, _self.image[0].naturalHeight,
				0, 0, canvas.width, canvas.height
			);
		}
	});
	this.image = imgs.first();
	this.image.addClass("active");
	
}

EngineController.prototype.initUI = function () {
	var _self = this;

	$('.panel-primary *').css({ visibility: "visible" });

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

	btn = $("#clear,#reset");
	btn.on('click', function (event) {
		_self.clear(true);
	});
	
	btn = $("#neighbors a");
	btn.on('click', function (event) {
		_self.idealCount = $(this).attr('data-val').split('|');
		_self.idealCount[0] *= 1;
		if (_self.idealCount.length > 1)
			_self.idealCount[1] *= 1;
		$("#neighbors_label span").first().text('Ideal number of neighbors: '+_self.idealCount);
	});
	btn = $("#refresh a");
	btn.on('click', function (event) {
		_self.refreshTimeout = $(this).attr('data-val') * 1;
		$("#refresh_label span").first().text('Refresh timeout: '+$(this).text());
	});
	
	btn = $('input[name="shape"]');
	btn.on('click', function (event) { _self.shape = $(this).val(); });
	btn = $('input[name="lw"]');
	btn.on('change', function (event) { _self.lineWidth = $(this).val()*1; });
	btn = $('input[name="stroke"]');
	btn.on('click', function (event) { _self.troke = $(this)[0].checked; });
	btn = $('input[name="fill"]');
	btn.on('click', function (event) { _self.fill = $(this)[0].checked; });
	
	btn = $("#resize");
	btn.parent().find('input[name="w"]').val(_self.buffers[_self.activeBufferIndex].width);
	btn.parent().find('input[name="h"]').val(_self.buffers[_self.activeBufferIndex].height);
	btn.on('click', function (event) {
		var inputs = $(this).parent().find('input');
		var css = {};
		var l = 0;
		var v;
		
		for(var i=0; i < inputs.length; i++) {
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
			for(var i=0; i < _self.buffers.length; i++) {
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

EngineController.prototype.start = function () {
	this.update();
}

EngineController.prototype.stop = function () {
	if (this.timer !== null) {
		clearTimeout(this.timer);
	}
	this.timer = null;
}

EngineController.prototype.clear = function (clearBackBuffer) {
	var b1 = this.contexts[this.activeBufferIndex];
	var b2 = this.contexts[1 - this.activeBufferIndex];

	b1.drawImage(
		this.image[0],
		0, 0, this.image[0].naturalWidth, this.image[0].naturalHeight,
		0, 0, b1.canvas.width, b1.canvas.height
	);
	if (clearBackBuffer === true) {
		b2.fillStyle = "#FFFFFF";
		b2.clearRect(0, 0, b2.canvas.width, b2.canvas.height);
	}
}

EngineController.prototype.setImage = function (newImage) {
	if (newImage) {
		this.image = newImage;
		this.image.parent().find('img').removeClass('active');
		this.image.addClass('active');
		this.clear(true);
	}
}
EngineController.prototype.update = function () {
	
	var delta = new Date().getTime();
	
	this.drawGeneration();
	this.switchBuffers();
	var _self = this;
	delta = new Date().getTime() - delta;
	this.delta.text('FPS: ' + Math.round(((1000/delta)* 100)) / 100);
	this.timer = setTimeout(function () {
		_self.update();
	}, this.refreshTimeout >= delta ? this.refreshTimeout - delta : 1 );
}

EngineController.prototype.alive = function (pixels, idx) {
//	return ((pixels[idx] + pixels[idx + 1] + pixels[idx + 2])/3 < 128);
	return (pixels[idx] < 128);
//	return (pixels[idx] < 128 && pixels[idx + 1] < 128 && pixels[idx + 2] < 128);
}
EngineController.prototype.willLive = function (pixels, idx) {
	idx += 3;
	
	if (this.idealCount.length === 1) {
		return pixels[idx] === this.idealCount[0];
	} else if(this.idealCount.length === 2) {
		return pixels[idx] >= this.idealCount[0] && pixels[idx] <= this.idealCount[1];
	}
}
EngineController.prototype.drawGeneration = function () {
	var x, y, wh = 0;

	var b1 = this.contexts[this.activeBufferIndex];
	var b2 = this.contexts[1 - this.activeBufferIndex];
	var data = b1.getImageData(0, 0, b1.canvas.width, b1.canvas.height).data;
	var data_out = b2.createImageData(b1.canvas.width, b1.canvas.height);
	var data2 = data_out.data;
	var r, g, b, a, x, y, tmp, tmp2, alive1;
	var nextIdx;
	tmp2 = b1.canvas.width * 4;

	for (var i = tmp = x = y = 0;
			i < data.length;
			i += 4, tmp++, x++
			) {
		if (x >= b1.canvas.width) {
			x = 0;
			y++;
		}
		alive1 = this.alive(data, i);
		r = i, g = i + 1, b = i + 2, a = i + 3;
		data2[a] = data2[a] % 255;
		if (x < b1.canvas.width - 1) {
			nextIdx = i + 4;// one on the right
			if (this.alive(data, nextIdx))
				data2[a] += 1;
			// let neighbours know, it's alive
			data2[nextIdx + 3] += alive1 ? 1 : 0;
		}
		if (y < b1.canvas.height) {
			nextIdx = i + tmp2; //one below
			if (this.alive(data, nextIdx))
				data2[a] += 1;
			// let neighbours know, it's alive
			data2[nextIdx + 3] += alive1 ? 1 : 0;
			if (x > 0) {
				nextIdx = i + tmp2 - 4; // one down one left
				if (this.alive(data, nextIdx))
					data2[a] += 1;
				// let neighbours know, it's alive
				data2[nextIdx + 3] += alive1 ? 1 : 0;
			}
			if (x < b1.canvas.width - 1) {
				nextIdx = i + tmp2 + 4; // one down one right
				if (this.alive(data, nextIdx))
					data2[a] += 1;
				// let neighbours know, it's alive
				data2[nextIdx + 3] += alive1 ? 1 : 0;
			}
		}

		var status = !this.willLive(data2, i);
		data2[r] = status ? 255 : 0;
		data2[g] = status ? 255 : 0;
		data2[b] = status ? 255 : 0;
		data2[a] = 255;

		// TODO: process cell status
		// if is alive:
		//   if has more or less than 2 neighbours: it withers and dies.
		//   :else: it survives
		// :else is dead:
		//   if has exactly 2 neighbours: it springs to life
		//
	}
	b2.putImageData(data_out, 0, 0);
}

EngineController.prototype.switchBuffers = function () {
	this.buffers[this.activeBufferIndex].className = "buffer back_buffer";
	this.activeBufferIndex = 1 - this.activeBufferIndex;
	this.buffers[this.activeBufferIndex].className = "buffer front_buffer";
}
