var EngineController = function (view) {
	this.view = $(view);
	
	this.timer = null;
	this.buffers = this.view.find('canvas');

	this.idealCount = [2];
	this.refreshTimeout = 200;

	this.generation = 0;

	this.__initBuffers();
	this.contexts = [];
	this.activeBufferIndex = 0;

	var canvas = this.buffers[0];

	if (canvas && canvas.getContext) {
		for (var i = 0; i < this.buffers.length; i++) {
			this.contexts.push(this.__initGL(this.buffers[i]));

			$(this.buffers[i]).on('mousedown', function(event){ 
				event.preventDefault ? event.preventDefault() : event.returnValue = false; 
			}).on('mousemove', function(event){
//					if (event.buttons === 1) {
//					b2 = _self.contexts[_self.activeBufferIndex];
//					b2.fillStyle = "#000000";
//					b2.stroStyle = "#000000";
//					b2.lineWidth = _self.lineWidth;
//					if (_self.shape == "circle") {
//						b2.beginPath();
//						b2.arc(event.layerX, event.layerY, 20, 0, 2*Math.PI, true); // Create the arc path.
//						if (_self.fill) b2.fill();
//						if (_self.stroke) b2.stroke();
//					} else if (_self.shape == "point") {
//						if (_self.fill) b2.fillRect(event.layerX, event.layerY, _self.lineWidth, _self.lineWidth);
//					} else {
//						if (_self.fill) b2.fillRect(event.layerX-10, event.layerY-10, 20, 20);
//					}
//					}
			});
		}
		
		this.__initialize();
	}
}

EngineController.prototype.__initBuffers =function (){
//		var _self = this;
	if (this.buffers.length === 0) {
		this.buffers = [null];
		var canvas;
		for (var i = 0; i < this.buffers.length; i++) {
			canvas = $('<canvas>').attr({width: this.view.width(), height: this.view.height()});
			canvas.addClass('buffer');
			canvas.addClass((i === 0 ? 'front' : 'back') + '_buffer');

			this.view.append(canvas);
			this.buffers[i] = canvas[0];
		}
	}
}

EngineController.prototype.__initGL = function(canvas) {
	var gl = null;
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	} catch (e) {
	}
	if (!gl) {
		alert("Could not initialise WebGL, sorry :-(");
	}
	return gl;
}

EngineController.prototype.__initialize = function () {
	this.__initUI();
	
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
	this.generation = 0;
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
	this.generation++;
	this.switchBuffers();
	var _self = this;
	delta = new Date().getTime() - delta;
	this.delta.text('FPS: ' + Math.round(((1000/delta)* 100)) / 100);
	this.gen.text('Generation: ' + this.generation);
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
	var ret = false;
	for(var i=0; i < this.idealCount.length; i++) {
		if (pixels[idx] === this.idealCount[i]) {
			return true;
		}
	}
	return ret;
}
EngineController.prototype.drawGeneration = function () {
	var x, y, wh = 0;

	var b1 = this.contexts[this.activeBufferIndex];
	var b2 = this.contexts[1 - this.activeBufferIndex];
	var data = b1.getImageData(0, 0, b1.canvas.width, b1.canvas.height).data;
	var data_out = b2.createImageData(b1.canvas.width, b1.canvas.height);
	var data2 = data_out.data;
	var r, g, b, a, x, y, tmp, tmp2, alive1;
	var nextIdx, dl;
	tmp2 = b1.canvas.width * 4;
	dl = data.length;
	var cw = b1.canvas.width;
	var cww = cw - 1;
	var ch = b1.canvas.height;
	r = 0, g = 1, b = 2, a = 3;
	for (tmp = x = y = 0; r < dl; r+=4, g+=4, b+=4, a+=4, tmp++, x++) {
		if (x >= cw) {
			x = 0;
			y++;
		}
		alive1 = data[r] < 128 ? 1 : 0;
//		r = i, g = i + 1, b = i + 2, a = i + 3;
//		data2[a] = data2[a] % 255;
//		continue;
		if (x < cww) {
			nextIdx = r + 4;// one on the right
			if (data[nextIdx] < 128) data2[a] += 1;
			// let neighbours know, it's alive
			if (alive1) data2[nextIdx + 3] += 1;
		}
		if (y < ch) {
			nextIdx = r + tmp2; //one below
			if (data[nextIdx] < 128) data2[a] += 1;
			// let neighbours know, it's alive
			if (alive1) data2[nextIdx + 3] += 1;
			if (x > 0) {
				nextIdx = r + tmp2 - 4; // one down one left
				if (data[nextIdx] < 128) data2[a] += 1;
				// let neighbours know, it's alive
				if (alive1) data2[nextIdx + 3] += 1;
			}
			if (x < cww) {
				nextIdx = r + tmp2 + 4; // one down one right
				if (data[nextIdx] < 128) data2[a] += 1;
				// let neighbours know, it's alive
				if (alive1) data2[nextIdx + 3] += 1;
			}
		}

		var status = !this.willLive(data2, r) ? 255 : 0;

		data2[r] = data2[g] = data2[b] = status;
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