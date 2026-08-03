'use strict';

/* global define, $, config */

define('admin/plugins/ad-manager', ['alerts'], function (alerts) {
	const ACP = {};

	ACP.init = function () {
		const $root = $('#ad-manager-acp');

		if (!$root.length) {
			return;
		}

		// Ensure we don't bind duplicate listeners across Ajaxify transitions
		$root.off('click');

		// Event Delegation directly on the root ACP element for maximum stability across Ajaxify navigations
		$root.on('click', function (e) {
			const $target = $(e.target);

			// Handle "Add Ad Unit" button
			if ($target.closest('.btn-add-ad').length) {
				e.preventDefault();
				ACP.addAdRow();
				return;
			}

			// Handle "Delete Ad Unit" button
			if ($target.closest('.btn-delete-ad').length) {
				e.preventDefault();
				const $row = $target.closest('.ad-unit-row');
				$row.remove();
				return;
			}

			// Handle "Save All Changes" button
			if ($target.closest('#btn-save-ads').length) {
				e.preventDefault();
				ACP.saveAds();
				return;
			}
		});
	};

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
					<input type="text" class="form-control ad-name" placeholder="e.g. Header Banner" value="${escapeAttr(ad.name)}">
				</td>
				<td>
					<input type="text" class="form-control ad-selector" placeholder="e.g. #content or .topic" value="${escapeAttr(ad.selector)}">
				</td>
				<td>
					<textarea class="form-control ad-html" rows="2" placeholder="<div class='my-ad'>Ad Code</div>">${escapeHtml(ad.html)}</textarea>
				</td>
				<td class="text-center align-middle">
					<span class="badge bg-info text-dark ad-clicks">${ad.clicks || 0}</span>
				</td>
				<td class="text-center align-middle">
					<button type="button" class="btn btn-sm btn-danger btn-delete-ad" title="Delete">
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
					alerts.success('Ad Manager settings saved successfully!');
				} else {
					alerts.error('Failed to save settings.');
				}
			},
			error: function (err) {
				alerts.error('Error saving settings: ' + (err.responseJSON ? err.responseJSON.error : err.statusText));
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
