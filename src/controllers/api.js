'use strict';

const db = require.main.require('./src/database');

const DB_KEY = 'nodebb-plugin-ad-manager:ads';

const apiController = {};

/**
 * Helper to fetch stored ads list
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
 * Public API: Fetch active ad units for client-side injection
 */
apiController.getAds = async function (req, res, next) {
	try {
		const ads = await getStoredAds();
		// Only return active ads that have both HTML and CSS selector defined
		const activeAds = ads.filter(ad => ad.html && ad.selector);
		res.json({ success: true, ads: activeAds });
	} catch (err) {
		next(err);
	}
};

/**
 * Public API: Track click on a specific ad unit
 */
apiController.trackClick = async function (req, res, next) {
	try {
		const { id } = req.body;
		if (!id) {
			return res.status(400).json({ error: 'Missing ad unit ID' });
		}

		const ads = await getStoredAds();
		const targetAd = ads.find(ad => ad.id === id);

		if (!targetAd) {
			return res.status(404).json({ error: 'Ad unit not found' });
		}

		targetAd.clicks = (parseInt(targetAd.clicks, 10) || 0) + 1;

		await db.setObjectField(DB_KEY, 'units', JSON.stringify(ads));

		res.json({ success: true, id: targetAd.id, clicks: targetAd.clicks });
	} catch (err) {
		next(err);
	}
};

module.exports = apiController;
