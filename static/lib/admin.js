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

	ACP.addAdRow = function (data) {
		const ad = data || {
			id: 'ad_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
			name: '',
			html: '',
			selector: '',
			clicks: 0
		};

		const rowHtml = `
			<tr class="ad-unit-row" data-id="${ad.id}">
				<td>
					<input type="text" class="form-control ad-name" placeholder="למשל: Header Banner" value="${escapeAttr(ad.name)}">
				</td>
				<td>
					<input type="text" class="form-control ad-selector" placeholder="למשל: #content" value="${escapeAttr(ad.selector)}">
				</td>
				<td>
					<textarea class="form-control ad-html" rows="2" placeholder="<div class='my-ad'>קוד פרסומת</div>">${escapeHtml(ad.html)}</textarea>
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
				selector: $row.find('.ad-selector').val().trim(),
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

