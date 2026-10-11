/**
 * registration controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::registration.registration', () => ({
	async find(ctx) {
		if (!ctx.state.user) return ctx.unauthorized();
		return super.find(ctx);
	},

	async findOne(ctx) {
		if (!ctx.state.user) return ctx.unauthorized();
		return super.findOne(ctx);
	},
}));
