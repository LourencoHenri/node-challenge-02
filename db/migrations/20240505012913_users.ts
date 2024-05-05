import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("users", (table) => {
		table.uuid("id").primary();
		table.string("session_id").notNullable().unique();
		table.text("name").notNullable();
		table.timestamp("created_at").notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable("users");
}
