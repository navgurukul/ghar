
exports.up = async function(knex) {
    await knex.schema.createTable('ghar_users', function (table) {
      table.increments('id').primary();
      table.string('email').notNullable();
    });
  };
  
  exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('ghar_users');
  };
  