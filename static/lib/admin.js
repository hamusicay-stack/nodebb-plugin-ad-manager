'use strict';

/* global define, module, $, config, ajaxify, app */

(function (factory) {
	if (typeof define === 'function' && define.amd) {
		define('admin/plugins/ad-manager', ['alerts'], factory);
	} else if (typeof module === 'object' && module.exports) {
		module.exports = factory(require('alerts'));
	} else {
		window.adManagerACP = factory(window.alerts);
	}
}(function (alerts) {
	const ACP = {};


	ACP.init = function () {
		console.log('[ad-manager-acp] ACP.init() called.');
		const $tbody = $('#ad-units-tbody');
		console.log('[ad-manager-acp] #ad-units-tbody element count in DOM:', $tbody.length);

		// If #ad-units-tbody is not ready in DOM yet, retry shortly
		if ($tbody.length === 0) {
			console.log('[ad-manager-acp] #ad-units-tbody not found in DOM yet. Retrying in 50ms...');
			setTimeout(ACP.init, 50);
			return;
		}

		let ads = null;

		// 1. Try reading ajaxify.data.ads if already populated natively by NodeBB on render
		if (typeof ajaxify !== 'undefined' && ajaxify.data) {
			console.log('[ad-manager-acp] ajaxify.data keys:', Object.keys(ajaxify.data));
			if (Array.isArray(ajaxify.data.ads) && ajaxify.data.ads.length > 0) {
				console.log(`[ad-manager-acp] Found ${ajaxify.data.ads.length} ads in ajaxify.data.ads.`);
				ads = ajaxify.data.ads;
			} else {
				console.log('[ad-manager-acp] ajaxify.data.ads is empty or not an array:', ajaxify.data.ads);
			}
		} else {
			console.log('[ad-manager-acp] ajaxify.data is undefined.');
		}

		// 2. Try reading embedded script tag if ajaxify.data.ads is absent
		if (!ads || !ads.length) {
			const dataElem = document.getElementById('ad-manager-saved-data');
			if (dataElem && dataElem.textContent) {
				const rawText = dataElem.textContent.trim();
				console.log(`[ad-manager-acp] Raw script tag text length: ${rawText.length}`);
				if (rawText) {
					const decoded = rawText
						.replace(/&quot;/g, '"')
						.replace(/&#34;/g, '"')
						.replace(/&amp;/g, '&')
						.replace(/&lt;/g, '<')
						.replace(/&gt;/g, '>');
					try {
						const parsed = JSON.parse(decoded);
						if (Array.isArray(parsed) && parsed.length > 0) {
							console.log(`[ad-manager-acp] Parsed ${parsed.length} ads from embedded script tag.`);
							ads = parsed;
						}
					} catch (e) {
						console.error('[ad-manager-acp] Failed to parse embedded script tag JSON:', e);
					}
				}
			} else {
				console.log('[ad-manager-acp] #ad-manager-saved-data script tag not found or empty.');
			}
		}

		if (Array.isArray(ads) && ads.length > 0) {
			console.log(`[ad-manager-acp] Rendering ${ads.length} ads directly into table.`);
			populateTable(ads);
		} else {
			// 3. Fetch using direct API endpoint with safe relative path
			const relPath = (typeof config !== 'undefined' && config.relative_path) ? config.relative_path : '';
			const apiUrl = relPath + '/api/admin/plugins/ad-manager/ads';
			console.log(`[ad-manager-acp] Fetching ads via GET AJAX: ${apiUrl}`);
			$.ajax({
				url: apiUrl,
				type: 'GET',
				success: function (res) {
					console.log('[ad-manager-acp] GET API response:', res);
					const fetchedAds = (res && res.ads) || [];
					console.log(`[ad-manager-acp] GET API returned ${fetchedAds.length} ads.`);
					populateTable(fetchedAds);
				},
				error: function (xhr, status, error) {
					console.error('[ad-manager-acp] Failed to fetch ACP ads via GET API:', status, error, xhr.status, xhr.responseText);
					if ($('#ad-units-tbody .ad-unit-row').length === 0) {
						console.log('[ad-manager-acp] Table is completely empty after API error. Populating 1 blank row.');
						populateTable([]);
					} else {
						console.log('[ad-manager-acp] Table already has existing rows. Preserving DOM on API error.');
					}
				}
			});
		}
	};

	function populateTable(adList) {
		const $tbody = $('#ad-units-tbody');
		console.log(`[ad-manager-acp] populateTable called with ${adList ? adList.length : 0} items.`);
		if ($tbody.length === 0) {
			console.error('[ad-manager-acp] populateTable failed: #ad-units-tbody not in DOM.');
			return;
		}
		$tbody.empty();
		if (Array.isArray(adList) && adList.length > 0) {
			adList.forEach(function (ad, i) {
				console.log(`[ad-manager-acp] Rendering row ${i + 1}/${adList.length}:`, ad.name || ad.id);
				ACP.addAdRow(ad);
			});
		} else {
			console.log('[ad-manager-acp] adList is empty. Rendering 1 default blank row.');
			ACP.addAdRow();
		}
	}

	// Automatically trigger initialization when NodeBB completes ACP page transition
	$(window).on('action:ajaxify.end', function (ev, data) {
		console.log('[ad-manager-acp] action:ajaxify.end fired. Current URL:', data ? data.url : 'unknown');
		if (data && data.url && data.url.startsWith('admin/plugins/ad-manager')) {
			console.log('[ad-manager-acp] Matched ACP route admin/plugins/ad-manager. Running ACP.init()...');
			ACP.init();
		}
	});












	// Global event delegation on document for #ad-manager-acp elements
	// Ensures buttons always work reliably across all Ajaxify navigations
	$(document).off('click', '#ad-manager-acp .btn-add-ad').on('click', '#ad-manager-acp .btn-add-ad', function (e) {
		e.preventDefault();
		ACP.addAdRow();
	});

	$(document).off('click', '#ad-manager-acp .btn-delete-ad').on('click', '#ad-manager-acp .btn-delete-ad', function (e) {
		e.preventDefault();
		$(this).closest('.ad-unit-row').remove();
	});

	$(document).off('click', '#ad-manager-acp #btn-save-ads').on('click', '#ad-manager-acp #btn-save-ads', function (e) {
		e.preventDefault();
		ACP.saveAds();
	});

	// Handle location change to toggle custom selector & repeatEvery field visibility
	$(document).off('change', '#ad-manager-acp .ad-location').on('change', '#ad-manager-acp .ad-location', function () {
		const $row = $(this).closest('.ad-unit-row');
		const val = $(this).val();
		if (val === 'custom') {
			$row.find('.ad-selector-wrapper').show();
			$row.find('.ad-repeat-wrapper').hide();
		} else if (val === 'recent-feed') {
			$row.find('.ad-selector-wrapper').hide();
			$row.find('.ad-repeat-wrapper').show();
		} else {
			$row.find('.ad-selector-wrapper').hide();
			$row.find('.ad-repeat-wrapper').hide();
		}
	});

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

	// Live preview of image (JPG, PNG, GIF, WEBP, Google Drive) in ACP table
	$(document).off('input change', '#ad-manager-acp .ad-image').on('input change', '#ad-manager-acp .ad-image', function () {
		const rawUrl = $(this).val().trim();
		const directUrl = formatGoogleDriveUrl(rawUrl);
		const $img = $(this).closest('td').find('.ad-preview-img');
		if (directUrl) {
			$img.attr('src', directUrl).show();
		} else {
			$img.hide();
		}
	});

	// Handle page target change to toggle custom path input visibility
	$(document).off('change', '#ad-manager-acp .ad-page-target').on('change', '#ad-manager-acp .ad-page-target', function () {
		const $row = $(this).closest('.ad-unit-row');
		if ($(this).val() === 'custom_path') {
			$row.find('.ad-page-path-wrapper').show();
		} else {
			$row.find('.ad-page-path-wrapper').hide();
		}
	});

	ACP.addAdRow = function (data) {
		const ad = data || {
			id: 'ad_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
			name: '',
			location: 'top',
			pageTarget: 'all',
			pagePath: '',
			deviceTarget: 'all',
			repeatEvery: 5,
			selector: '',
			image: '',
			link: '',
			html: '',
			endDate: '',
			active: true,
			clicks: 0
		};

		const loc = ad.location || 'top';
		const pageTarget = ad.pageTarget || 'all';
		const deviceTarget = ad.deviceTarget || 'all';
		const showSelector = loc === 'custom' ? '' : 'display: none;';
		const showRepeat = loc === 'recent-feed' ? '' : 'display: none;';
		const showPagePath = pageTarget === 'custom_path' ? '' : 'display: none;';
		const directPreviewUrl = formatGoogleDriveUrl(ad.image);
		const showPreview = directPreviewUrl ? 'block' : 'none';
		const isActive = ad.active !== false && ad.active !== 'false';

		const rowHtml = `
			<tr class="ad-unit-row" data-id="${ad.id}">
				<td class="text-center align-middle">
					<div class="form-check form-switch d-flex justify-content-center">
						<input type="checkbox" class="form-check-input ad-active" title="סטטוס פעיל" ${isActive ? 'checked' : ''}>
					</div>
				</td>
				<td>
					<input type="text" class="form-control form-control-sm ad-name mb-1" placeholder="שם היחידה" value="${escapeAttr(ad.name)}">
					<select class="form-select form-select-sm ad-page-target mb-1" title="תצוגה בדפים">
						<option value="all" ${pageTarget === 'all' ? 'selected' : ''}>🌐 כל הדפים</option>
						<option value="home" ${pageTarget === 'home' ? 'selected' : ''}>🏠 דף הבית בלבד</option>
						<option value="recent" ${pageTarget === 'recent' ? 'selected' : ''}>🔥 נושאים אחרונים בלבד</option>
						<option value="topic" ${pageTarget === 'topic' ? 'selected' : ''}>💬 דפי דיונים בלבד</option>
						<option value="category" ${pageTarget === 'category' ? 'selected' : ''}>📁 דפי קטגוריות בלבד</option>
						<option value="custom_path" ${pageTarget === 'custom_path' ? 'selected' : ''}>🔗 נתיב מותאם אישית</option>
					</select>
					<div class="ad-page-path-wrapper mb-1" style="${showPagePath}">
						<input type="text" class="form-control ad-page-path form-control-sm" placeholder="למשל: /topic/*" value="${escapeAttr(ad.pagePath)}">
					</div>
					<select class="form-select form-select-sm ad-device-target mb-1" title="תצוגה במכשירים">
						<option value="all" ${deviceTarget === 'all' ? 'selected' : ''}>💻📱 כל המכשירים</option>
						<option value="desktop" ${deviceTarget === 'desktop' ? 'selected' : ''}>💻 מחשב בלבד</option>
						<option value="mobile" ${deviceTarget === 'mobile' ? 'selected' : ''}>📱 מובייל בלבד</option>
					</select>
					<div class="input-group input-group-sm mt-1" title="זמן רוטציה בשניות אם יש כמה מודעות באותו מיקום">
						<span class="input-group-text">🔄</span>
						<input type="number" min="2" max="120" class="form-control ad-rotate-interval" value="${ad.rotateInterval || 9}">
						<span class="input-group-text">שניות</span>
					</div>
				</td>
				<td>
					<select class="form-select form-select-sm ad-location mb-1">

						<option value="top" ${loc === 'top' ? 'selected' : ''}>באנר עליון (לרוחב)</option>
						<option value="bottom" ${loc === 'bottom' ? 'selected' : ''}>באנר תחתון (לרוחב)</option>
						<option value="sidebar-right" ${loc === 'sidebar-right' ? 'selected' : ''}>סרגל צד ימין (לאורך)</option>
						<option value="sidebar-left" ${loc === 'sidebar-left' ? 'selected' : ''}>סרגל צד שמאל (לאורך)</option>
						<option value="recent-feed" ${loc === 'recent-feed' ? 'selected' : ''}>פיד נושאים אחרונים (/recent)</option>
						<option value="custom" ${loc === 'custom' ? 'selected' : ''}>סלקטור מותאם אישית</option>
					</select>
					<div class="ad-selector-wrapper" style="${showSelector}">
						<input type="text" class="form-control ad-selector form-control-sm" placeholder="סלקטור, למשל: #content" value="${escapeAttr(ad.selector)}">
					</div>
					<div class="ad-repeat-wrapper mt-1" style="${showRepeat}">
						<div class="input-group input-group-sm">
							<span class="input-group-text">כל</span>
							<input type="number" min="1" max="50" class="form-control ad-repeat-every" value="${ad.repeatEvery || 5}">
							<span class="input-group-text">נושאים</span>
						</div>
					</div>
				</td>
				<td>
					<input type="text" class="form-control form-control-sm ad-image mb-1" placeholder="קישור לתמונה או גוגל דרייב" value="${escapeAttr(ad.image)}">
					<div class="text-center">
						<img src="${escapeAttr(directPreviewUrl)}" class="ad-preview-img img-thumbnail" style="max-height: 40px; max-width: 120px; display: ${showPreview}; margin: 0 auto;" alt="תצוגה מקדימה">
					</div>
				</td>
				<td>
					<input type="text" class="form-control form-control-sm ad-link" placeholder="https://example.com/target-page" value="${escapeAttr(ad.link)}">
				</td>
				<td>
					<input type="date" class="form-control form-control-sm ad-end-date" value="${escapeAttr(ad.endDate || '')}" title="תאריך סיום מוצג">
				</td>
				<td>
					<textarea class="form-control form-control-sm ad-html" rows="1" placeholder="קוד HTML חלופי">${escapeHtml(ad.html)}</textarea>
				</td>
				<td class="text-center align-middle">
					<span class="badge bg-info text-dark ad-clicks">${ad.clicks || 0}</span>
				</td>
				<td class="text-center align-middle">
					<button type="button" class="btn btn-sm btn-danger btn-delete-ad" title="מחק">
						<i class="fa fa-trash"></i>
					</button>
				</td>
			</tr>
		`;

		$('#ad-units-tbody').append(rowHtml);
	};

	ACP.saveAds = function () {
		console.log('[ad-manager-acp] ACP.saveAds() called.');
		const ads = [];

		$('.ad-unit-row').each(function (idx) {
			const $row = $(this);
			const adObj = {
				id: $row.attr('data-id'),
				active: $row.find('.ad-active').is(':checked'),
				name: $row.find('.ad-name').val().trim(),
				location: $row.find('.ad-location').val(),
				pageTarget: $row.find('.ad-page-target').val(),
				pagePath: $row.find('.ad-page-path').val().trim(),
				deviceTarget: $row.find('.ad-device-target').val(),
				rotateInterval: parseInt($row.find('.ad-rotate-interval').val(), 10) || 9,
				repeatEvery: parseInt($row.find('.ad-repeat-every').val(), 10) || 5,
				selector: $row.find('.ad-selector').val().trim(),
				image: $row.find('.ad-image').val().trim(),
				link: $row.find('.ad-link').val().trim(),
				endDate: $row.find('.ad-end-date').val().trim(),
				html: $row.find('.ad-html').val().trim(),
				clicks: parseInt($row.find('.ad-clicks').text(), 10) || 0
			};
			console.log(`[ad-manager-acp] Collected row ${idx + 1}:`, adObj.name || adObj.id);
			ads.push(adObj);
		});

		console.log(`[ad-manager-acp] Total ads collected from DOM to save: ${ads.length}`);

		const relPath = (typeof config !== 'undefined' && config.relative_path) ? config.relative_path : '';
		const csrfToken = (typeof config !== 'undefined' && config.csrf_token) ? config.csrf_token : '';
		const saveUrl = relPath + '/api/admin/plugins/ad-manager/ads';

		console.log(`[ad-manager-acp] Sending POST request to ${saveUrl} with ${ads.length} items...`);

		$.ajax({
			url: saveUrl,
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({ ads: ads }),
			headers: {
				'x-csrf-token': csrfToken
			},
			success: function (res) {
				console.log('[ad-manager-acp] Save POST response:', res);
				if (res && res.success) {
					alerts.success('הגדרות Ad Manager נשמרו בהצלחה!');
					if (res.ads && typeof ajaxify !== 'undefined' && ajaxify.data) {
						ajaxify.data.ads = res.ads;
						console.log(`[ad-manager-acp] Updated ajaxify.data.ads with ${res.ads.length} items.`);
					}
				} else {
					console.error('[ad-manager-acp] Save failed on server:', res);
					alerts.error('שגיאה בשמירת ההגדרות.');
				}
			},
			error: function (xhr, status, error) {
				console.error('[ad-manager-acp] Save POST error:', status, error, xhr.status, xhr.responseText);
				alerts.error('שגיאה בשמירה: ' + (xhr.responseJSON ? xhr.responseJSON.error : 'Server Error'));
			}
		});
	};







		const relPath = (typeof config !== 'undefined' && config.relative_path) ? config.relative_path : '';
		const csrfToken = (typeof config !== 'undefined' && config.csrf_token) ? config.csrf_token : '';

		$.ajax({
			url: relPath + '/api/admin/plugins/ad-manager/ads',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({ ads: ads }),
			headers: {
				'x-csrf-token': csrfToken
			},
			success: function (res) {
				if (res && res.success) {
					alerts.success('הגדרות Ad Manager נשמרו בהצלחה!');
					if (res.ads && typeof ajaxify !== 'undefined' && ajaxify.data) {
						ajaxify.data.ads = res.ads;
					}
				} else {
					alerts.error('שגיאה בשמירת ההגדרות.');
				}
			},
			error: function (err) {
				alerts.error('שגיאה בשמירה: ' + (err.responseJSON ? err.responseJSON.error : 'Server Error'));
			}
		});
	};



	function escapeHtml(str) {
		return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	function escapeAttr(str) {
		return String(str || '').replace(/"/g, '&quot;');
	}

	if (typeof window !== 'undefined' && window.location && window.location.pathname.includes('/admin/plugins/ad-manager')) {
		$(function () {
			console.log('[ad-manager-acp] Direct pathname match. Running ACP.init() on document ready...');
			ACP.init();
		});
	}

	return ACP;
}));


