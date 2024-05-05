import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { knex } from "../database";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

export async function mealsRoutes(app: FastifyInstance) {
	app.get(
		"/",
		{
			preHandler: [checkSessionIdExists],
		},
		async () => {
			const meals = await knex("meals").select();

			return { meals };
		}
	);

	app.get(
		"/:id",
		{
			preHandler: [checkSessionIdExists],
		},
		async (request, reply) => {
			const paramsSchema = z.object({ id: z.string().uuid() });

			const { id } = paramsSchema.parse(request.params);

			const meal = await knex("meals").where({ id: id }).first();

			if (!meal) {
				return reply.status(404).send({ error: "Meal not found" });
			}

			return { meal };
		}
	);

	app.get(
		"/summary",
		{
			preHandler: [checkSessionIdExists],
		},
		async (request, reply) => {
			const totalMeals = await knex("meals")
				.where({ user_id: request.user?.id })
				.orderBy("date", "desc");

			const totalMealsOnDiet = await knex("meals")
				.where({ user_id: request.user?.id, diet: true })
				.count("id", { as: "total" })
				.first();

			const totalMealsOffDiet = await knex("meals")
				.where({ user_id: request.user?.id, diet: false })
				.count("id", { as: "total" })
				.first();

			const { bestOnDietSequence } = totalMeals.reduce(
				(acc, meal) => {
					if (meal.diet) {
						acc.currentSequence += 1;
					} else {
						acc.currentSequence = 0;
					}

					if (acc.currentSequence > acc.bestOnDietSequence) {
						acc.bestOnDietSequence = acc.currentSequence;
					}

					return acc;
				},
				{ bestOnDietSequence: 0, currentSequence: 0 }
			);

			return reply.send({
				bestOnDietSequence,
				meals: totalMeals,
				totalMeals: totalMeals.length,
				totalMealsOnDiet: totalMealsOnDiet?.total,
				totalMealsOffDiet: totalMealsOffDiet?.total,
			});
		}
	);

	app.post(
		"/",
		{ preHandler: [checkSessionIdExists] },
		async (request, reply) => {
			const createMealBodySchema = z.object({
				name: z.string(),
				description: z.string(),
				diet: z.boolean(),
			});

			const { name, description, diet } = createMealBodySchema.parse(
				request.body
			);

			await knex("meals").insert({
				id: randomUUID(),
				name,
				description,
				diet,
				user_id: request.user?.id,
				date: Date.now(),
			});

			return reply.status(201).send;
		}
	);

	app.put(
		"/:id",
		{ preHandler: [checkSessionIdExists] },
		async (request, reply) => {
			const paramsSchema = z.object({
				id: z.string().uuid(),
			});

			const { id } = paramsSchema.parse(request.params);

			const updateMealBodySchema = z.object({
				name: z.string(),
				description: z.string(),
				diet: z.boolean(),
				date: z.coerce.date(),
			});

			const { name, description, diet, date } = updateMealBodySchema.parse(
				request.body
			);

			await knex("meals").where({ id: id }).update({
				name,
				description,
				diet,
				date: date.getTime(),
			});

			return reply.status(201).send;
		}
	);

	app.delete(
		"/:id",
		{ preHandler: [checkSessionIdExists] },
		async (request, reply) => {
			const paramsSchema = z.object({
				id: z.string().uuid(),
			});

			const { id } = paramsSchema.parse(request.params);

			await knex("meals").where({ id: id }).del();

			return reply.status(201).send;
		}
	);
}
