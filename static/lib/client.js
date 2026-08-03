'use strict';

/* global $, config */

$(document).ready(function () {
	// Listen to NodeBB navigation hook
	$(window).on('action:ajaxify.end', function () {
		initAdManager();
	});

	function initAdManager() {
		fetch(config.relative_path + '/api/plugins/ad-manager/ads')
			.then(function (response) {
				return response.json();
			})
			.then(function (data) {
				if (data && data.success && Array.isArray(data.ads)) {
					injectAds(data.ads);
				}
			})
			.catch(function (err) {
				console.error('[Ad Manager] Failed to load ad units:', err);
			});
	}

	function injectAds(ads) {
		ads.forEach(function (ad) {
			if (!ad.html && !(ad.image && ad.link)) {
				return;
			}

			const adContainerId = 'ad-unit-container-' + ad.id;
			if ($('#' + adContainerId).length) {
				return;
			}

			const loc = ad.location || 'top';
			let $target;
			let injectionMode = 'prepend';

			// Proportional image rendering
			let innerContent = ad.html;
			if (!innerContent && ad.image && ad.link) {
				const maxH = (loc === 'top' || loc === 'bottom') ? '180px' : '460px';
				innerContent = `<a href="${ad.link}" target="_blank" rel="noopener noreferrer" style="display:block; width:100%; text-decoration:none;">
					<img src="${ad.image}" alt="${ad.name || 'Ad'}" style="max-width:100%; max-height:${maxH}; object-fit:contain; border-radius:8px; display:block; margin:0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.12);">
				</a>`;
			}

			const $container = $('<div></div>')
				.attr('id', adContainerId)
				.attr('data-ad-id', ad.id)
				.addClass('nodebb-ad-manager-unit nodebb-ad-location-' + loc)
				.html(innerContent);

			const isDesktop = $(window).width() >= 1200;

			if (loc === 'top') {
				$target = $('#content, [component="header"], main').first();
				injectionMode = 'prepend';
				$container.css({
					'display': 'block',
					'width': '100%',
					'max-width': '1000px',
					'margin': '15px auto',
					'text-align': 'center',
					'clear': 'both'
				});
			} else if (loc === 'bottom') {
				$target = $('#content, main').first();
				injectionMode = 'append';
				$container.css({
					'display': 'block',
					'width': '100%',
					'max-width': '1000px',
					'margin': '20px auto 15px auto',
					'text-align': 'center',
					'clear': 'both'
				});
			} else if (loc === 'sidebar-right') {
				$target = $('body');
				injectionMode = 'append';
				if (isDesktop) {
					// Positioned on the right side, offset 75px from the edge to NOT cover the fixed right icon toolbar
					$container.css({
						'position': 'fixed',
						'top': '110px',
						'right': '75px',
						'left': 'auto',
						'width': '160px',
						'max-height': '480px',
						'z-index': '80',
						'box-sizing': 'border-box',
						'text-align': 'center'
					});
				} else {
					$target = $('#content, main').first();
					injectionMode = 'prepend';
					$container.css({
						'display': 'block',
						'width': '100%',
						'max-width': '300px',
						'margin': '15px auto',
						'text-align': 'center'
					});
				}
			} else if (loc === 'sidebar-left') {
				$target = $('body');
				injectionMode = 'append';
				if (isDesktop) {
					// Positioned on the left side, offset 75px from the edge to NOT cover the fixed left icon toolbar
					$container.css({
						'position': 'fixed',
						'top': '110px',
						'left': '75px',
						'right': 'auto',
						'width': '160px',
						'max-height': '480px',
						'z-index': '80',
						'box-sizing': 'border-box',
						'text-align': 'center'
					});
				} else {
					$target = $('#content, main').first();
					injectionMode = 'prepend';
					$container.css({
						'display': 'block',
						'width': '100%',
						'max-width': '300px',
						'margin': '15px auto',
						'text-align': 'center'
					});
				}
			} else if (loc === 'custom' && ad.selector) {
				$target = $(ad.selector);
				injectionMode = 'prepend';
				$container.css({
					'display': 'block',
					'margin': '15px auto',
					'text-align': 'center'
				});
			}

			if (!$target || !$target.length) {
				$target = $('#content');
				injectionMode = 'prepend';
			}

			if (!$target.length) {
				return;
			}

			if (injectionMode === 'append') {
				$target.append($container);
			} else {
				$target.prepend($container);
			}

			// Attach click tracking
			$container.off('click').on('click', function () {
				trackAdClick(ad.id);
			});
		});
	}


	function trackAdClick(adId) {
		fetch(config.relative_path + '/api/plugins/ad-manager/click', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-csrf-token': config.csrf_token
			},
			body: JSON.stringify({ id: adId })
		}).catch(function (err) {
			console.error('[Ad Manager] Click tracking failed:', err);
		});
	}
});
