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
			if (!ad.selector || !ad.html) {
				return;
			}

			const $target = $(ad.selector);
			if (!$target.length) {
				return;
			}

			// Prevent duplicate injection of the same ad unit into the target element
			const adContainerId = 'ad-unit-container-' + ad.id;
			if ($('#' + adContainerId).length) {
				return;
			}

			// Create static, non-floating container (position: static, display: block)
			const $container = $('<div></div>')
				.attr('id', adContainerId)
				.attr('data-ad-id', ad.id)
				.addClass('nodebb-ad-manager-unit')
				.css({
					'display': 'block',
					'position': 'static',
					'margin': '15px 0',
					'clear': 'both',
					'width': '100%',
					'box-sizing': 'border-box'
				})
				.html(ad.html);

			// Inject inside target container
			$target.prepend($container);

			// Attach click tracking listener to the injected container
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
