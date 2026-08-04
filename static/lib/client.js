'use strict';

/* global $, config */

$(document).ready(function () {
	// Listen to NodeBB navigation hook
	$(window).on('action:ajaxify.end action:topics.loaded', function () {
		initAdManager();
	});

	$(window).on('resize scroll', function () {
		adjustSideBannerLayout();
	});

	function initAdManager() {
		fetch(config.relative_path + '/api/plugins/ad-manager/ads')
			.then(function (response) {
				return response.json();
			})
			.then(function (data) {
				if (data && data.success && Array.isArray(data.ads)) {
					injectAds(data.ads);
					setTimeout(adjustSideBannerLayout, 150);
				}
			})
			.catch(function (err) {
				console.error('[Ad Manager] Failed to load ad units:', err);
			});
	}

	function formatGoogleDriveUrl(url) {
		if (!url) return '';
		url = String(url).trim();
		const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/i;
		const match = url.match(driveRegex);
		if (match && match[1]) {
			return 'https://lh3.googleusercontent.com/d/' + match[1];
		}
		return url;
	}

	function shouldShowAdOnCurrentPage(ad) {
		const pageTarget = ad.pageTarget || 'all';
		if (pageTarget === 'all') {
			return true;
		}

		const path = window.location.pathname;
		const tpl = (typeof config !== 'undefined' && config.template) || (typeof ajaxify !== 'undefined' && ajaxify.data && ajaxify.data.template) || '';

		if (pageTarget === 'home') {
			return path === '/' || path === '' || tpl === 'home';
		}
		if (pageTarget === 'recent') {
			return path.indexOf('/recent') !== -1 || tpl === 'recent';
		}
		if (pageTarget === 'topic') {
			return path.indexOf('/topic') !== -1 || tpl.indexOf('topic') === 0;
		}
		if (pageTarget === 'category') {
			return path.indexOf('/category') !== -1 || tpl.indexOf('category') === 0;
		}
		if (pageTarget === 'custom_path' && ad.pagePath) {
			const cleanPattern = ad.pagePath.trim().replace(/\*/g, '.*');
			try {
				const regex = new RegExp(cleanPattern, 'i');
				return regex.test(path);
			} catch (e) {
				return path.indexOf(ad.pagePath.trim()) !== -1;
			}
		}
		return true;
	}

	function shouldShowAdOnCurrentDevice(ad) {
		const deviceTarget = ad.deviceTarget || 'all';
		if (deviceTarget === 'all') {
			return true;
		}

		const isMobile = window.matchMedia('(max-width: 991px)').matches || $(window).width() < 992;
		if (deviceTarget === 'desktop') {
			return !isMobile;
		}
		if (deviceTarget === 'mobile') {
			return isMobile;
		}
		return true;
	}

	function injectAds(ads) {
		const validAds = ads.filter(function (ad) {
			return (ad.html || (ad.image && ad.link)) &&
				shouldShowAdOnCurrentPage(ad) &&
				shouldShowAdOnCurrentDevice(ad);
		});

		if (!validAds.length) {
			return;
		}

		// Separate in-feed ads from fixed location ads
		const recentFeedAds = validAds.filter(function (ad) { return ad.location === 'recent-feed'; });
		const locationAds = validAds.filter(function (ad) { return ad.location !== 'recent-feed'; });

		// Handle in-feed ads
		recentFeedAds.forEach(function (ad) {
			injectRecentFeedAds(ad);
		});

		// Group fixed location ads by their target location key
		const groups = {};
		locationAds.forEach(function (ad) {
			const key = ad.location === 'custom' ? ('custom:' + ad.selector) : ad.location;
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(ad);
		});

		// Inject each group (Single or Rotating Carousel)
		Object.keys(groups).forEach(function (key) {
			const groupAds = groups[key];
			if (!groupAds.length) return;

			const loc = groupAds[0].location || 'top';
			const groupContainerId = 'ad-group-unit-' + key.replace(/[^a-zA-Z0-9_-]/g, '_');

			if ($('#' + groupContainerId).length) {
				return;
			}

			if (groupAds.length === 1) {
				injectSingleAd(groupAds[0], groupContainerId, loc);
			} else {
				injectCarouselAds(groupAds, groupContainerId, loc);
			}
		});

		// Adjust side banner padding layout
		adjustSideBannerLayout();
	}

	function injectSingleAd(ad, adContainerId, loc) {
		let $target;
		let injectionMode = 'prepend';

		const imageUrl = formatGoogleDriveUrl(ad.image);

		// Proportional image rendering
		let innerContent = ad.html;
		if (!innerContent && imageUrl && ad.link) {
			const maxH = (loc === 'top' || loc === 'bottom') ? '180px' : '450px';
			innerContent = `<a href="${ad.link}" target="_blank" rel="noopener noreferrer" style="display:block; width:100%; text-decoration:none;">
				<img src="${imageUrl}" alt="${ad.name || 'Ad'}" style="max-width:100%; max-height:${maxH}; object-fit:contain; border-radius:8px; display:block; margin:0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.12);">
			</a>`;
		}

		const $container = $('<div></div>')
			.attr('id', adContainerId)
			.attr('data-ad-id', ad.id)
			.addClass('nodebb-ad-manager-unit')
			.html(innerContent);

		if (loc === 'top') {
			const $hotTopicsWidget = $(`
				[component="widget/recent_topics"],
				[component="widget/recent-topics"],
				[data-widget="recent_topics"],
				[data-widget="recent-topics"],
				[data-widget-name*="recent"],
				[data-widget-name*="hot"],
				.recent-topics-widget,
				.widget-recent-topics,
				.hot-topics-widget,
				[component="category/hot-topics"],
				.hot-topics,
				.hot-topics-container,
				.recent-topics-teaser,
				.recent-topics-bar,
				[component="breadcrumb"],
				ol.breadcrumb,
				.breadcrumb-container
			`).filter(':visible').last();

			const $categoriesList = $('[component="categories"], #category-list, .categories, [component="category"]').filter(':visible').first();

			if ($hotTopicsWidget.length) {
				$target = $hotTopicsWidget;
				injectionMode = 'after';
			} else if ($categoriesList.length) {
				$target = $categoriesList;
				injectionMode = 'before';
			} else {
				$target = $('#content > div').eq(1);
				if (!$target.length) {
					$target = $('#content, main').first();
				}
				injectionMode = 'prepend';
			}

			$container.css({
				'display': 'block',
				'width': '100%',
				'max-width': '1100px',
				'margin': '15px auto 25px auto',
				'text-align': 'center',
				'clear': 'both'
			});
		} else if (loc === 'bottom') {
			const $footer = $('footer, [component="footer"], .footer-container, #footer').filter(':visible').first();
			if ($footer.length) {
				$target = $footer;
				injectionMode = 'before';
			} else {
				$target = $('#content, main').first();
				injectionMode = 'append';
			}

			$container.css({
				'display': 'block',
				'width': '100%',
				'max-width': '1100px',
				'margin': '25px auto 15px auto',
				'text-align': 'center',
				'clear': 'both'
			});
		} else if (loc === 'sidebar-right') {
			$target = $('body');
			injectionMode = 'append';
			$container.addClass('nodebb-ad-sidebar-right').css({
				'position': 'fixed',
				'top': '100px',
				'right': '70px',
				'width': '150px',
				'z-index': '999',
				'text-align': 'center'
			});
		} else if (loc === 'sidebar-left') {
			$target = $('body');
			injectionMode = 'append';
			$container.addClass('nodebb-ad-sidebar-left').css({
				'position': 'fixed',
				'top': '100px',
				'left': '70px',
				'width': '150px',
				'z-index': '999',
				'text-align': 'center'
			});
		} else if (loc === 'custom') {
			$target = $(ad.selector).first();
			if (!$target.length) {
				return;
			}
			injectionMode = 'prepend';
			$container.css({
				'display': 'block',
				'margin': '10px 0',
				'clear': 'both'
			});
		}

		if (!$target || !$target.length) {
			return;
		}

		if (injectionMode === 'after') {
			$target.after($container);
		} else if (injectionMode === 'before') {
			$target.before($container);
		} else if (injectionMode === 'append') {
			$target.append($container);
		} else {
			$target.prepend($container);
		}

		$container.off('click').on('click', function () {
			trackAdClick(ad.id);
		});
	}

	function injectCarouselAds(groupAds, containerId, loc) {
		let $target;
		let injectionMode = 'prepend';

		if (loc === 'top') {
			const $hotTopicsWidget = $(`
				[component="widget/recent_topics"],
				[component="widget/recent-topics"],
				[data-widget="recent_topics"],
				[data-widget="recent-topics"],
				[data-widget-name*="recent"],
				[data-widget-name*="hot"],
				.recent-topics-widget,
				.widget-recent-topics,
				.hot-topics-widget,
				[component="category/hot-topics"],
				.hot-topics,
				.hot-topics-container,
				.recent-topics-teaser,
				.recent-topics-bar,
				[component="breadcrumb"],
				ol.breadcrumb,
				.breadcrumb-container
			`).filter(':visible').last();

			const $categoriesList = $('[component="categories"], #category-list, .categories, [component="category"]').filter(':visible').first();

			if ($hotTopicsWidget.length) {
				$target = $hotTopicsWidget;
				injectionMode = 'after';
			} else if ($categoriesList.length) {
				$target = $categoriesList;
				injectionMode = 'before';
			} else {
				$target = $('#content > div').eq(1);
				if (!$target.length) {
					$target = $('#content, main').first();
				}
				injectionMode = 'prepend';
			}
		} else if (loc === 'bottom') {
			const $footer = $('footer, [component="footer"], .footer-container, #footer').filter(':visible').first();
			if ($footer.length) {
				$target = $footer;
				injectionMode = 'before';
			} else {
				$target = $('#content, main').first();
				injectionMode = 'append';
			}
		} else if (loc === 'sidebar-right' || loc === 'sidebar-left') {
			$target = $('body');
			injectionMode = 'append';
		} else if (loc === 'custom') {
			$target = $(groupAds[0].selector).first();
			if (!$target.length) return;
			injectionMode = 'prepend';
		}

		if (!$target || !$target.length) return;

		const $carousel = $('<div></div>')
			.attr('id', containerId)
			.addClass('nodebb-ad-manager-unit nodebb-ad-carousel')
			.css({
				'position': (loc === 'sidebar-right' || loc === 'sidebar-left') ? 'fixed' : 'relative',
				'display': 'block',
				'clear': 'both'
			});

		if (loc === 'sidebar-right') {
			$carousel.addClass('nodebb-ad-sidebar-right').css({
				'top': '100px',
				'right': '70px',
				'width': '150px',
				'z-index': '999'
			});
		} else if (loc === 'sidebar-left') {
			$carousel.addClass('nodebb-ad-sidebar-left').css({
				'top': '100px',
				'left': '70px',
				'width': '150px',
				'z-index': '999'
			});
		} else {
			$carousel.css({
				'width': '100%',
				'max-width': '1100px',
				'margin': '15px auto 25px auto',
				'text-align': 'center'
			});
		}

		const maxH = (loc === 'top' || loc === 'bottom') ? '180px' : '450px';
		const $slidesWrapper = $('<div></div>').css({
			'position': 'relative',
			'width': '100%',
			'min-height': (loc === 'top' || loc === 'bottom') ? '90px' : '250px',
			'overflow': 'hidden',
			'border-radius': '10px'
		});

		const $slides = [];
		groupAds.forEach(function (ad, index) {
			let innerContent = ad.html;
			if (!innerContent && ad.image && ad.link) {
				const directImg = formatGoogleDriveUrl(ad.image);
				innerContent = `<a href="${ad.link}" target="_blank" rel="noopener noreferrer" style="display:block; width:100%; text-decoration:none;">
					<img src="${directImg}" alt="${ad.name || 'Ad'}" style="max-width:100%; max-height:${maxH}; object-fit:contain; border-radius:8px; display:block; margin:0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.12);">
				</a>`;
			}

			const $slide = $('<div></div>')
				.addClass('nodebb-ad-slide')
				.attr('data-ad-id', ad.id)
				.css({
					'position': index === 0 ? 'relative' : 'absolute',
					'top': '0',
					'left': '0',
					'width': '100%',
					'opacity': index === 0 ? '1' : '0',
					'z-index': index === 0 ? '2' : '1',
					'transition': 'opacity 0.6s ease-in-out',
					'pointer-events': index === 0 ? 'auto' : 'none'
				})
				.html(innerContent);

			$slide.off('click').on('click', function () {
				trackAdClick(ad.id);
			});

			$slidesWrapper.append($slide);
			$slides.push($slide);
		});

		$carousel.append($slidesWrapper);

		if (injectionMode === 'after') {
			$target.after($carousel);
		} else if (injectionMode === 'before') {
			$target.before($carousel);
		} else if (injectionMode === 'append') {
			$target.append($carousel);
		} else {
			$target.prepend($carousel);
		}

		// Rotation Timer (default 9s or ad specified)
		let currentIdx = 0;
		const intervalSec = Math.max(2, parseInt(groupAds[0].rotateInterval, 10) || 9);
		let timerId = null;

		function showNextSlide() {
			const nextIdx = (currentIdx + 1) % $slides.length;
			$slides[currentIdx].css({ 'opacity': '0', 'z-index': '1', 'pointer-events': 'none' });
			$slides[nextIdx].css({ 'opacity': '1', 'z-index': '2', 'pointer-events': 'auto' });
			currentIdx = nextIdx;
		}

		function startTimer() {
			if (!timerId) {
				timerId = setInterval(showNextSlide, intervalSec * 1000);
			}
		}

		function stopTimer() {
			if (timerId) {
				clearInterval(timerId);
				timerId = null;
			}
		}

		startTimer();
		$carousel.on('mouseenter', stopTimer).on('mouseleave', startTimer);
	}

	function adjustSideBannerLayout() {
		const isDesktop = $(window).width() >= 992;
		const $hasRightAd = $('.nodebb-ad-location-sidebar-right');
		const $hasLeftAd = $('.nodebb-ad-location-sidebar-left');
		const $mainContent = $('#content, [component="brand/wrapper"], main').first();

		if (isDesktop) {
			// Position Right Side Banner next to right vertical navbar (70px from edge)
			$hasRightAd.css({
				'position': 'fixed',
				'top': '120px',
				'right': '70px',
				'left': 'auto',
				'width': '150px',
				'max-height': '450px',
				'z-index': '80',
				'display': 'block',
				'box-sizing': 'border-box',
				'text-align': 'center'
			});

			// Position Left Side Banner next to left vertical navbar (70px from edge)
			$hasLeftAd.css({
				'position': 'fixed',
				'top': '120px',
				'left': '70px',
				'right': 'auto',
				'width': '150px',
				'max-height': '450px',
				'z-index': '80',
				'display': 'block',
				'box-sizing': 'border-box',
				'text-align': 'center'
			});

			// Shift central forum content inward so ads NEVER overlap any forum text/topics
			if ($mainContent.length) {
				$mainContent.css({
					'padding-right': $hasRightAd.length ? '175px' : '',
					'padding-left': $hasLeftAd.length ? '175px' : '',
					'transition': 'padding 0.2s ease'
				});
			}
		} else {
			// Mobile/Tablet fallback: Hide side banners on mobile to avoid cluttering small screens
			$hasRightAd.css({ 'display': 'none' });
			$hasLeftAd.css({ 'display': 'none' });

			if ($mainContent.length) {
				$mainContent.css({
					'padding-right': '',
					'padding-left': ''
				});
			}
		}
	}



	function injectRecentFeedAds(ad) {
		// Filter ONLY top-level topic row items, excluding inner teasers or posts
		const $topics = $('[component="category/topic"], .category-item, ul.topic-list > li.category-item, .topics-list > .topic-row, li[data-tid]')
			.filter(function () {
				return !$(this).closest('[component="topic/teaser"], .teaser, [component="post"]').length;
			});

		const interval = Math.max(1, parseInt(ad.repeatEvery, 10) || 3);

		if ($topics.length > 0) {
			$topics.each(function (index) {
				const isIntervalMatch = (index + 1) % interval === 0;
				const isLastFallback = ($topics.length < interval) && (index === $topics.length - 1);

				if (isIntervalMatch || isLastFallback) {
					const containerId = 'ad-recent-feed-' + ad.id + '-idx-' + index;
					if ($('#' + containerId).length) {
						return;
					}

					let innerContent = ad.html;
					if (!innerContent && ad.image && ad.link) {
						innerContent = `<a href="${ad.link}" target="_blank" rel="noopener noreferrer" style="display:block; width:100%; text-decoration:none;">
							<img src="${ad.image}" alt="${ad.name || 'Ad'}" style="max-width:100%; max-height:160px; object-fit:contain; border-radius:8px; display:block; margin:0 auto;">
						</a>`;
					}

					const $adCard = $('<div></div>')
						.attr('id', containerId)
						.attr('data-ad-id', ad.id)
						.addClass('nodebb-ad-manager-unit nodebb-ad-recent-card')
						.css({
							'display': 'block',
							'width': '100%',
							'margin': '15px 0',
							'padding': '16px 20px',
							'background': 'var(--bs-card-bg, #ffffff)',
							'border': '1px solid var(--bs-card-border-color, rgba(0,0,0,0.12))',
							'border-radius': '12px',
							'box-shadow': '0 2px 8px rgba(0,0,0,0.05)',
							'box-sizing': 'border-box',
							'text-align': 'center',
							'clear': 'both'
						})
						.html(innerContent);

					// Inject after the top-level topic container
					$(this).after($adCard);

					$adCard.off('click').on('click', function () {
						trackAdClick(ad.id);
					});
				}
			});
		} else if (window.location.pathname.indexOf('/recent') !== -1 || $('[component="category"]').length) {
			const containerId = 'ad-recent-feed-fallback-' + ad.id;
			if ($('#' + containerId).length) {
				return;
			}

			let innerContent = ad.html;
			if (!innerContent && ad.image && ad.link) {
				innerContent = `<a href="${ad.link}" target="_blank" rel="noopener noreferrer" style="display:block; width:100%; text-decoration:none;">
					<img src="${ad.image}" alt="${ad.name || 'Ad'}" style="max-width:100%; max-height:160px; object-fit:contain; border-radius:8px; display:block; margin:0 auto;">
				</a>`;
			}

			const $adCard = $('<div></div>')
				.attr('id', containerId)
				.attr('data-ad-id', ad.id)
				.addClass('nodebb-ad-manager-unit nodebb-ad-recent-card')
				.css({
					'display': 'block',
					'width': '100%',
					'margin': '15px 0',
					'padding': '16px 20px',
					'background': 'var(--bs-card-bg, #ffffff)',
					'border': '1px solid var(--bs-card-border-color, rgba(0,0,0,0.12))',
					'border-radius': '12px',
					'box-shadow': '0 2px 8px rgba(0,0,0,0.05)',
					'box-sizing': 'border-box',
					'text-align': 'center',
					'clear': 'both'
				})
				.html(innerContent);

			$('[component="category"], #content, main').first().prepend($adCard);

			$adCard.off('click').on('click', function () {
				trackAdClick(ad.id);
			});
		}
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
