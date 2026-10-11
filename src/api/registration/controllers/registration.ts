/**
 * registration controller
 */

import { factories } from '@strapi/strapi';

const fullMessage = 'Les inscriptions sont complètes. Veuillez attendre la prochaine session.';

export default factories.createCoreController('api::registration.registration', ({ strapi }) => ({
	async create(ctx) {
		const data = ctx.request.body?.data;
		if (!data || typeof data !== 'object') return ctx.badRequest('Les informations d’inscription sont invalides.');

		const relation = data.formation ?? data.formations;
		const connectValue = Array.isArray(relation?.connect) ? relation.connect : relation?.connect ? [relation.connect] : undefined;
		const reference = Array.isArray(relation) ? relation[0] : connectValue?.[0] ?? relation;
		const identifier = typeof reference === 'object' && reference !== null
			? reference.documentId ?? reference.id
			: reference;
		const numericId = Number(identifier);
		if ((typeof identifier !== 'string' && typeof identifier !== 'number') || !identifier) {
			return ctx.badRequest('La formation sélectionnée est invalide.');
		}
		const formationEntry = await strapi.db.query('api::formation.formation').findOne({
			where: Number.isInteger(numericId) && numericId > 0 ? { id: numericId } : { documentId: String(identifier) },
			select: ['id'],
		});
		if (!formationEntry) return ctx.notFound('Cette formation n’existe plus.');
		const formationId = formationEntry.id;

		return strapi.db.transaction(async ({ trx }) => {
			const formation = await trx('formations').where({ id: formationId }).forUpdate().first();
			if (!formation) return ctx.notFound('Cette formation n’existe plus.');

			const isOpen = Boolean(formation.is_open ?? formation.isOpen);
			const capacity = Number(formation.student_capacity ?? formation.studentCapacity ?? 0);
			const registeredStudents = Number(formation.registered_students ?? formation.registeredStudents ?? 0);
			if (!isOpen || (capacity > 0 && registeredStudents >= capacity)) {
				return ctx.throw(409, fullMessage);
			}

			const nextCount = registeredStudents + 1;
			const update: Record<string, number | boolean> = { registered_students: nextCount };
			if (capacity > 0 && nextCount >= capacity) update['is_open'] = false;
			await trx('formations').where({ id: formationId }).update(update);

			data.formation = { connect: [formationId] };
			delete data.formations;
			ctx.request.body = { ...(ctx.request.body ?? {}), data };
			return super.create(ctx);
		});
	},

	async find(ctx) {
		if (!ctx.state.user) return ctx.unauthorized();
		return super.find(ctx);
	},

	async findOne(ctx) {
		if (!ctx.state.user) return ctx.unauthorized();
		return super.findOne(ctx);
	},
}));
