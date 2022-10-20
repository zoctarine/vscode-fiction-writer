(function ($) {
	const getGif = function () {
		const gif = [];
		$('img').each(function () {
			let data = $(this).attr('src');
			if (data.endsWith('.gif')) {
				let png = data.replace('.gif', '.png');
				gif.push(data);
				$(this).attr('src', png);
				$(this).toggleClass('play');
			}
		});
		return gif;
	}

	const gif = getGif();

	// Preload all the gif images.
	var image = [];

	$.each(gif, function (index) {
		image[index] = new Image();
		image[index].src = gif[index];
	});

	// Change the image to .gif when clicked and vice versa.
	$('img').on('click', function (e) {
		let img = $(this);
		let src = img.attr('src');
		let ext = src.split('.');
    let realExt = ext[ext.length - 1];

		if (realExt === 'gif') {
      ext[ext.length - 1] = 'png';
		} else if (realExt === 'png') {
      ext[ext.length - 1] = 'gif';
		}
		img.attr('src', ext.join('.'));
		img.toggleClass('play');
	});
})(jQuery);