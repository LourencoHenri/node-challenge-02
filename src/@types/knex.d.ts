import "knex";

declare module "knex/types/tables" {
	export interface Tables {
		users: {
			id: string;
			session_id: string;
			name: string;
			created_at: string;
		};

		meals: {
			id: string;
			user_id: string;
			name: string;
			description: string;
			diet: boolean;
			date: number;
		};
	}
}
