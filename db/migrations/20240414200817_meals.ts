import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("meals", (table) => {
		table.uuid("id").primary();
		table.uuid("user_id").references("users.id").notNullable();
		table.text("name").notNullable();
		table.text("description").notNullable();
		table.boolean("diet").notNullable();
		table.date("date").notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable("meals");
}
