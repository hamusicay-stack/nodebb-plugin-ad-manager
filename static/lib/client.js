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

			let $target;
			let injectionMode = 'prepend'; // 'prepend' or 'append'
			let customCss = {
				'display': 'block',
				'position': 'static',
				'margin': '15px 0',
				'clear': 'both',
				'width': '100%',
				'box-sizing': 'border-box',
				'text-align': 'center'
			};

			const loc = ad.location || 'top';

			if (loc === 'top') {
				$target = $('#content, [component="header"], main').first();
				injectionMode = 'prepend';
			} else if (loc === 'bottom') {
				$target = $('#content, main').first();
				injectionMode = 'append';
			} else if (loc === 'sidebar-right') {
				$target = $('[component="sidebar"], .sidebar-right, .sidebar').first();
				if ($target.length) {
					injectionMode = 'prepend';
					customCss['width'] = '100%';
				} else {
					$target = $('#content, main').first();
					injectionMode = 'prepend';
					customCss['float'] = 'right';
					customCss['width'] = 'auto';
					customCss['max-width'] = '300px';
					customCss['margin-left'] = '15px';
					customCss['clear'] = 'none';
				}
			} else if (loc === 'sidebar-left') {
				$target = $('[component="sidebar"], .sidebar-left, .sidebar').first();
				if ($target.length) {
					injectionMode = 'prepend';
					customCss['width'] = '100%';
				} else {
					$target = $('#content, main').first();
					injectionMode = 'prepend';
					customCss['float'] = 'left';
					customCss['width'] = 'auto';
					customCss['max-width'] = '300px';
					customCss['margin-right'] = '15px';
					customCss['clear'] = 'none';
				}
			} else if (loc === 'custom' && ad.selector) {
				$target = $(ad.selector);
				injectionMode = 'prepend';
			}

			if (!$target || !$target.length) {
				// Fallback to #content
				$target = $('#content');
				injectionMode = 'prepend';
			}

			if (!$target.length) {
				return;
			}

			// Create static, non-floating container
			const $container = $('<div></div>')
				.attr('id', adContainerId)
				.attr('data-ad-id', ad.id)
				.addClass('nodebb-ad-manager-unit')
				.css(customCss)
				.html(ad.html);

			if (injectionMode === 'append') {
				$target.append($container);
			} else {
				$target.prepend($container);
			}

			// Attach click tracking listener
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
