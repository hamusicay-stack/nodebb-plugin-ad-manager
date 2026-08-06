'use strict';

const db = require.main.require('./src/database');

const DB_KEY = 'nodebb-plugin-ad-manager:ads';

const adminController = {};

/**
 * Helper to fetch stored ads list from NodeBB database
 */
async function getStoredAds() {
	try {
		let rawData = await db.getObjectField(DB_KEY, 'units');
		let source = 'getObjectField(units)';
		if (!rawData) {
			rawData = await db.get(DB_KEY + ':units_raw');
			source = 'get(units_raw)';
		}
		if (!rawData) {
			console.log('[ad-manager-server] getStoredAds: Database returned empty/null for both keys.');
			return [];
		}
		const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
		const result = Array.isArray(parsed) ? parsed : [];
		console.log(`[ad-manager-server] getStoredAds: Retrieved ${result.length} ads from DB via ${source}.`);
		return result;
	} catch (err) {
		console.error('[ad-manager-server] Error reading stored ads:', err);
		return [];
	}
}

/**
 * Renders the Admin Control Panel (ACP) template
 */
adminController.render = async function (req, res, next) {
	try {
		console.log(`[ad-manager-server] adminController.render called for URL: ${req.originalUrl || req.url}`);
		const ads = await getStoredAds();
		const adsJsonStr = JSON.stringify(ads);
		console.log(`[ad-manager-server] Rendering ACP template with ${ads.length} ads. adsJson length: ${adsJsonStr.length}`);
		res.render('admin/plugins/ad-manager', {
			title: 'Ad Manager',
			ads: ads,
			adsJson: adsJsonStr
		});
	} catch (err) {
		console.error('[ad-manager-server] Error in adminController.render:', err);
		next(err);
	}
};

/**
 * API Endpoint: Fetch current ad units (for ACP)
 */
adminController.getAds = async function (req, res, next) {
	try {
		console.log(`[ad-manager-server] adminController.getAds called via GET API.`);
		const ads = await getStoredAds();
		console.log(`[ad-manager-server] Returning ${ads.length} ads in getAds API response.`);
		res.json({ success: true, ads });
	} catch (err) {
		console.error('[ad-manager-server] Error in adminController.getAds:', err);
		next(err);
	}
};

/**
 * API Endpoint: Save / Update / Delete ad units list (from ACP)
 */
adminController.saveAds = async function (req, res, next) {
	try {
		console.log('[ad-manager-server] adminController.saveAds POST request received.');
		let ads = req.body ? req.body.ads : null;
		if (typeof ads === 'string') {
			try {
				ads = JSON.parse(ads);
			} catch (e) {
				ads = null;
			}
		}
		if (!ads && typeof req.body === 'string') {
			try {
				const parsed = JSON.parse(req.body);
				ads = parsed.ads;
			} catch (e) {
				ads = null;
			}
		}

		if (!Array.isArray(ads)) {
			console.error('[ad-manager-server] saveAds failed: req.body.ads is not an array. Body:', req.body);
			return res.status(400).json({ error: 'Invalid payload. "ads" must be an array.' });
		}

		console.log(`[ad-manager-server] Saving ${ads.length} ad units to DB...`);

		// Ensure proper formatting and preserve existing click counts
		const formattedAds = ads.map((ad, idx) => ({
			id: ad.id || `ad_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
			name: String(ad.name || '').trim(),
			location: String(ad.location || 'top').trim(),
			pageTarget: String(ad.pageTarget || 'all').trim(),
			pagePath: String(ad.pagePath || '').trim(),
			deviceTarget: String(ad.deviceTarget || 'all').trim(),
			rotateInterval: Math.max(2, parseInt(ad.rotateInterval, 10) || 9),
			repeatEvery: Math.max(1, parseInt(ad.repeatEvery, 10) || 5),
			selector: String(ad.selector || '').trim(),
			image: String(ad.image || '').trim(),
			link: String(ad.link || '').trim(),
			html: String(ad.html || '').trim(),
			endDate: String(ad.endDate || '').trim(),
			active: ad.active === true || ad.active === 'true' || ad.active === 'on' || ad.active === 1,
			clicks: parseInt(ad.clicks, 10) || 0
		}));

		// Persist to NodeBB Database
		await db.setObjectField(DB_KEY, 'units', JSON.stringify(formattedAds));
		await db.set(DB_KEY + ':units_raw', JSON.stringify(formattedAds));

		console.log(`[ad-manager-server] Successfully persisted ${formattedAds.length} ads to DB keys "${DB_KEY}:units" and "${DB_KEY}:units_raw".`);

		res.json({ success: true, ads: formattedAds });
	} catch (err) {
		console.error('[ad-manager-server] Error in adminController.saveAds:', err);
		next(err);
	}
};

module.exports = adminController;

