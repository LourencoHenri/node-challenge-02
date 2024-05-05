import { FastifyInstance } from "fastify";
import { knex } from "../database";
import { z } from "zod";
import { randomUUID } from "crypto";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

export async function usersRoutes(app: FastifyInstance) {
	app.get(
		"/",
		{
			preHandler: [checkSessionIdExists],
		},
		async (request) => {
			const { sessionId } = request.cookies;

			const users = await knex("users").where("session_id", sessionId).select();

			return { users };
		}
	);

	app.get(
		"/:id",
		{
			preHandler: [checkSessionIdExists],
		},
		async (request) => {
			const getUserParamsSchema = z.object({
				id: z.string().uuid(),
			});

			const { id } = getUserParamsSchema.parse(request.params);

			const { sessionId } = request.cookies;

			const user = await knex("users")
				.where({
					session_id: sessionId,
					id,
				})
				.first();

			return { user };
		}
	);

	app.post("/", async (request, reply) => {
		const createUserBodySchema = z.object({
			name: z.string(),
		});

		const { name } = createUserBodySchema.parse(request.body);

		let sessionId = request.cookies.sessionId;

		if (!sessionId) {
			sessionId = randomUUID();
			reply.setCookie("sessionId", sessionId, {
				path: "/",
				maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
			});
		}

		await knex("users").insert({
			id: randomUUID(),
			name,
			session_id: sessionId,
		});

		return reply.status(201).send;
	});
}
