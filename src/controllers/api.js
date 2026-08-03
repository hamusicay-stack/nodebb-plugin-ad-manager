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
		const now = new Date();

		const activeAds = ads
			.filter(ad => {
				// 1. Check active status toggle
				if (ad.active === false || ad.active === 'false') {
					return false;
				}
				// 2. Check expiration date if set
				if (ad.endDate) {
					const expDate = new Date(ad.endDate + 'T23:59:59');
					if (now > expDate) {
						return false; // Expired
					}
				}
				// 3. Active ads must have content (HTML or image+link) and a location or custom selector
				return (ad.html || (ad.image && ad.link)) && (ad.location || ad.selector);
			})
			.map(ad => {
				let effectiveHtml = ad.html;
				if (!effectiveHtml && ad.image && ad.link) {
					const maxH = (ad.location === 'recent-feed' || ad.location === 'top' || ad.location === 'bottom') ? '160px' : '460px';
					effectiveHtml = `<a href="${ad.link}" target="_blank" rel="noopener noreferrer" style="display:block; width:100%;"><img src="${ad.image}" alt="${ad.name || 'Ad'}" style="max-width:100%; max-height:${maxH}; object-fit:contain; border-radius:6px; display:block; margin:0 auto;"></a>`;
				}
				return {
					id: ad.id,
					name: ad.name,
					location: ad.location || 'top',
					repeatEvery: parseInt(ad.repeatEvery, 10) || 5,
					selector: ad.selector,
					image: ad.image,
					link: ad.link,
					html: effectiveHtml
				};
			});
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
