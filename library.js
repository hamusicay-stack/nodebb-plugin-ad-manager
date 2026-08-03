'use strict';

const adminController = require('./src/controllers/admin');
const apiController = require('./src/controllers/api');

const plugin = {};

/**
 * Initializes plugin routes and controllers when NodeBB loads
 */
plugin.init = async function (params) {
	const { router, middleware } = params;

	// Admin Control Panel (ACP) view route
	router.get('/admin/plugins/ad-manager', middleware.admin.buildHeader, adminController.render);
	router.get('/api/admin/plugins/ad-manager', adminController.render);

	// ACP API routes for ad units management
	router.get('/api/admin/plugins/ad-manager/ads', middleware.admin.checkPrivileges, adminController.getAds);
	router.post('/api/admin/plugins/ad-manager/ads', middleware.admin.checkPrivileges, adminController.saveAds);

	// Public API routes for client ad fetching & click tracking
	router.get('/api/plugins/ad-manager/ads', apiController.getAds);
	router.post('/api/plugins/ad-manager/click', apiController.trackClick);
};

/**
 * Adds the plugin link to the ACP navigation menu
 */
plugin.addAdminNavigation = async function (header) {
	header.plugins.push({
		route: '/plugins/ad-manager',
		icon: 'fa-bullhorn',
		name: 'Ad Manager'
	});
	return header;
};

module.exports = plugin;
