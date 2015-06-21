
var Atom = function (width, height, angle) {
	this.width = width;
	this.height = height;
	this.angle = angle;
}

var Segment = function (children) {
	this.children = children ? children : [];
}


var EngineController = function (view) {
	this.view = $(view);
	this.delta = $("#delta");
	this.timer = null;
	this.buffers = this.view.find('canvas');
	
	this.idealCount = 2;
	this.refreshTimeout = 200;
	var _self = this;
	if (this.buffers.length === 0) {
		this.buffers = [null, null];
		var canvas;
		//<canvas class="buffer front_buffer"  width="800" height="600"></canvas>
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
//					console.log(event.offsetX, event.offsetY);
					b2 = _self.contexts[_self.activeBufferIndex];
					b2.fillStyle = "#ffffff";
					b2.lineWidth = 3;
					b2.beginPath();
					b2.arc(event.offsetX, event.offsetY, 50, 0, 2*Math.PI, true); // Create the arc path.
//					b2.fill();
					b2.stroke();
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
		})
//		console.log('one loaded');
		if (imgsLen === 0) {
//			console.log('all loaded');
			var canvas = _self.buffers[_self.activeBufferIndex];
			_self.contexts[_self.activeBufferIndex].drawImage(
					_self.image[0],
					0, 0, _self.image[0].naturalWidth, _self.image[0].naturalHeight,
					0, 0, canvas.width, canvas.height
					);
		}
	});
	this.image = imgs.first().addClass("active");



//	window.addEventListener('resize', function(event){
//		console.log('resize');
//	}, false);
}

EngineController.prototype.initUI = function () {
	var _self = this;

	$('.panel-footer *').css({ visibility: "visible" });

	var btn = $("#btn");
	btn.on('click', function (event) {
		if (_self.timer === null) {
			_self.start();
			$(this).html("<i class=\"fa fa-pause\"></i> Pause");
		} else {
			_self.stop();
			$(this).html("<i class=\"fa fa-play\"></i> Play");
		}
	});

	btn = $("#clear");
	btn.on('click', function (event) {
		_self.clear(true);
	});
	
	btn = $("#neighbors a");
	btn.on('click', function (event) {
		_self.idealCount = $(this).attr('data-val') * 1;
		$("#neighbors_label").text('Ideal number of neighbors: '+_self.idealCount);
	});
	btn = $("#refresh a");
	btn.on('click', function (event) {
		_self.refreshTimeout = $(this).attr('data-val') * 1;
		$("#refresh_label").text('Refresh timeout: '+$(this).text());
	});
	
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
//	b1.fillStyle = "#FFFFFF";
//	b1.clearRect(0, 0, b2.canvas.width, b2.canvas.height);
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
	// console.log("Updating");
	// _self.context.clearRect(0, 0, _self.context.innerWidth, _self.context.innerHeight);

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
	return (pixels[idx] < 128 && pixels[idx + 1] < 128 && pixels[idx + 2] < 128);
}
EngineController.prototype.willLive = function (pixels, idx) {
//		console.log(pixels[idx + 3]);
	return pixels[idx + 3] === this.idealCount;
}
EngineController.prototype.drawGeneration = function () {
	var x, y, wh = 0;

	var b1 = this.contexts[this.activeBufferIndex];
	var b2 = this.contexts[1 - this.activeBufferIndex];
	// b1.clearRect(0, 0, b1.innerWidth, b1.innerHeight);
	// b2.fillStyle = "#FFFFFF";
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
//	data_out.data = data2;
	b2.putImageData(data_out, 0, 0);
}

EngineController.prototype.switchBuffers = function () {
	this.buffers[this.activeBufferIndex].className = "buffer back_buffer";
	this.activeBufferIndex = 1 - this.activeBufferIndex;
	this.buffers[this.activeBufferIndex].className = "buffer front_buffer";
}