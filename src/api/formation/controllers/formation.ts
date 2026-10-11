/**
 * formation controller
 */

import { factories } from '@strapi/strapi';

type FormationResponse = {
	data?: Array<{ id?: number; registeredStudents?: number }>;
};

export default factories.createCoreController('api::formation.formation', ({ strapi }) => ({
	async find(ctx) {
		const response = await super.find(ctx) as FormationResponse;
		if (!Array.isArray(response?.data)) return response;

		await Promise.all(response.data.map(async (formation) => {
			if (!formation.id) return;
			formation.registeredStudents = await strapi.db.query('api::registration.registration').count({
				where: { formations: { id: formation.id } },
			});
		}));

		return response;
	},
}));
