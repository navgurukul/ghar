exports.up = async function (knex) {
  await knex.schema.createTable("ghar_discordId", function (table) {
    table.increments("id").primary();
    table.string("email").notNullable();
    table.string("discordId").unique();
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("ghar_discordId");
};
