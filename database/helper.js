'use strict';

var Q = require('q');

class Helper {

    constructor (database) {
        this.database = database;
        this.convertCamelCaseToUnderscore = true;
    }

    buildSqlParts (table, values) {

        var namedParams = [],
            combined = [],
            columns;

        columns = Object.keys(values);

        columns.forEach(function (key) {
            namedParams.push(`:${key}`);
        });

        if (this.convertCamelCaseToUnderscore) {
            columns = columns.map(this.camelCaseToUnderscore);
        }

        for (let i = 0; i < columns.length; i++) {
            combined.push(`${columns[i]} = ${namedParams[i]}`);
        }

        columns = columns.join(', ');
        namedParams = namedParams.join(', ');
        combined = combined.join(', ');

        return {
            columns: columns,
            namedParams: namedParams,
            combined: combined
        };
    }

    camelCaseToUnderscore (text) {
        return text.replace(/([A-Z])/,"_$1").toLowerCase();
    }

    updateSql (table, values, where) {
        var parts = this.buildSqlParts(table, values),
            sql;

        sql = `UPDATE ${table} SET ${parts.combined} WHERE ${where}`;

        return sql;
    }

    insertSql (table, values, primaryKey) {
        var parts = this.buildSqlParts(table, values),
            sql;

        primaryKey = primaryKey || 'id';

        sql = `INSERT INTO ${table} (${parts.columns}) VALUES (${parts.namedParams}) RETURNING ${primaryKey}`;

        return sql;
    }

    performQuery (query) {
        return Q.ninvoke(this.database, 'query', query).catch(this.errorHandler);
    }

    performUpdate (query, record) {
        return Q.ninvoke(this.database, 'query', query, record).catch(this.errorHandler);
    }

    errorHandler (error) {
        console.error(error);
    }

    getFirstResult (results) {
        return results[0];
    }

    getAllPlayerLifetimeStats () {
        return this.performQuery("SELECT * FROM player_lifetime_stats");
    }

    getPlayerLifetimeStats (username) {
        return this.performQuery(`SELECT * FROM player_lifetime_stats WHERE github_login = '${username}'`);
    }

    getLatestGameResultByUsername (username) {
        return this.performQuery(`SELECT * FROM game_results WHERE '${username}' = ANY(players) ORDER BY game_id DESC LIMIT 1`);
    }

    getAllGameResultsByUsername (username) {
        return this.performQuery(`SELECT * FROM game_results WHERE '${username}' = ANY(players) ORDER BY game_id DESC`);
    }

    getPlayer (username) {
        return this.performQuery(`SELECT * FROM player WHERE github_login = '${username}'`);
    }

    updatePlayer (record) {
        let updateSql = this.updateSql('player', record, `github_login = '${record.github_login}'`);

        return this.performUpdate(updateSql, record);
    }

    insertPlayer (record) {
        let insertSql = this.insertSql('player', record, 'github_login');

        return this.performUpdate(insertSql, record);
    }

}

module.exports = Helper;