'use strict';

/* global define, $, config */

define('admin/plugins/ad-manager', ['alerts'], function (alerts) {
	const ACP = {};

	ACP.init = function () {
		// Module initialization if needed
	};

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

	// Live preview of image (JPG, PNG, GIF, WEBP) in ACP table
	$(document).off('input change', '#ad-manager-acp .ad-image').on('input change', '#ad-manager-acp .ad-image', function () {
		const url = $(this).val().trim();
		const $img = $(this).closest('td').find('.ad-preview-img');
		if (url) {
			$img.attr('src', url).show();
		} else {
			$img.hide();
		}
	});

	ACP.addAdRow = function (data) {
		const ad = data || {
			id: 'ad_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
			name: '',
			location: 'top',
			selector: '',
			image: '',
			link: '',
			html: '',
			clicks: 0
		};

		const loc = ad.location || 'top';
		const showSelector = loc === 'custom' ? '' : 'display: none;';
		const showPreview = ad.image ? 'block' : 'none';

		const rowHtml = `
			<tr class="ad-unit-row" data-id="${ad.id}">
				<td>
					<input type="text" class="form-control ad-name" placeholder="שם היחידה" value="${escapeAttr(ad.name)}">
				</td>
				<td>
					<select class="form-select ad-location mb-1">
						<option value="top" ${loc === 'top' ? 'selected' : ''}>באנר עליון (לרוחב)</option>
						<option value="bottom" ${loc === 'bottom' ? 'selected' : ''}>באנר תחתון (לרוחב)</option>
						<option value="sidebar-right" ${loc === 'sidebar-right' ? 'selected' : ''}>סרגל צד ימין (לאורך)</option>
						<option value="sidebar-left" ${loc === 'sidebar-left' ? 'selected' : ''}>סרגל צד שמאל (לאורך)</option>
						<option value="custom" ${loc === 'custom' ? 'selected' : ''}>סלקטור מותאם אישית</option>
					</select>
					<div class="ad-selector-wrapper" style="${showSelector}">
						<input type="text" class="form-control ad-selector form-control-sm" placeholder="סלקטור, למשל: #content" value="${escapeAttr(ad.selector)}">
					</div>
				</td>
				<td>
					<input type="text" class="form-control ad-image" placeholder="קישור לתמונה (JPG, PNG, GIF, WEBP)" value="${escapeAttr(ad.image)}">
					<div class="mt-1 text-center">
						<img src="${escapeAttr(ad.image)}" class="ad-preview-img img-thumbnail" style="max-height: 40px; max-width: 120px; display: ${showPreview}; margin: 0 auto;" alt="תצוגה מקדימה">
					</div>
				</td>
				<td>
					<input type="text" class="form-control ad-link" placeholder="https://example.com/target-page" value="${escapeAttr(ad.link)}">
				</td>
				<td>
					<textarea class="form-control ad-html" rows="1" placeholder="קוד HTML חלופי">${escapeHtml(ad.html)}</textarea>
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
		const ads = [];

		$('.ad-unit-row').each(function () {
			const $row = $(this);
			ads.push({
				id: $row.attr('data-id'),
				name: $row.find('.ad-name').val().trim(),
				location: $row.find('.ad-location').val(),
				selector: $row.find('.ad-selector').val().trim(),
				image: $row.find('.ad-image').val().trim(),
				link: $row.find('.ad-link').val().trim(),
				html: $row.find('.ad-html').val().trim(),
				clicks: parseInt($row.find('.ad-clicks').text(), 10) || 0
			});
		});



		$.ajax({
			url: config.relative_path + '/api/admin/plugins/ad-manager/ads',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({ ads: ads }),
			headers: {
				'x-csrf-token': config.csrf_token
			},
			success: function (res) {
				if (res && res.success) {
					alerts.success('הגדרות Ad Manager נשמרו בהצלחה!');
				} else {
					alerts.error('שגיאה בשמירת ההגדרות.');
				}
			},
			error: function (err) {
				alerts.error('שגיאה בשמירה: ' + (err.responseJSON ? err.responseJSON.error : err.statusText));
			}
		});
	};

	function escapeHtml(str) {
		return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	function escapeAttr(str) {
		return String(str || '').replace(/"/g, '&quot;');
	}

	return ACP;
});

