'use strict';

const db = require.main.require('./src/database');

const DB_KEY = 'nodebb-plugin-ad-manager:ads';

const adminController = {};

/**
 * Helper to fetch stored ads list from NodeBB database
 */
async function getStoredAds() {
	const rawData = await db.getObjectField(DB_KEY, 'units');
	if (!rawData) {
		return [];
	}
	try {
		return typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
	} catch (err) {
		return [];
	}
}

/**
 * Renders the Admin Control Panel (ACP) template
 */
adminController.render = async function (req, res, next) {
	try {
		const ads = await getStoredAds();
		res.render('admin/plugins/ad-manager', {
			title: 'Ad Manager',
			ads: ads
		});
	} catch (err) {
		next(err);
	}
};

/**
 * API Endpoint: Fetch current ad units (for ACP)
 */
adminController.getAds = async function (req, res, next) {
	try {
		const ads = await getStoredAds();
		res.json({ success: true, ads });
	} catch (err) {
		next(err);
	}
};

/**
 * API Endpoint: Save / Update / Delete ad units list (from ACP)
 */
adminController.saveAds = async function (req, res, next) {
	try {
		const { ads } = req.body;
		if (!Array.isArray(ads)) {
			return res.status(400).json({ error: 'Invalid payload. "ads" must be an array.' });
		}

		// Ensure proper formatting and preserve existing click counts if not explicitly updated
		const formattedAds = ads.map(ad => ({
			id: ad.id || `ad_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
			name: String(ad.name || '').trim(),
			location: String(ad.location || 'top').trim(),
			selector: String(ad.selector || '').trim(),
			image: String(ad.image || '').trim(),
			link: String(ad.link || '').trim(),
			html: String(ad.html || '').trim(),
			clicks: parseInt(ad.clicks, 10) || 0
		}));



		await db.setObjectField(DB_KEY, 'units', JSON.stringify(formattedAds));

		res.json({ success: true, ads: formattedAds });
	} catch (err) {
		next(err);
	}
};

module.exports = adminController;
