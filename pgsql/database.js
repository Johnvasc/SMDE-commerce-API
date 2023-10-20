const pg = require('pg')

const client = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'smde-commerce',
    password: '9247',
    port: '5432'
})

module.exports = client