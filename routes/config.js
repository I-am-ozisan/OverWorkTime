let { Client } = require("pg");

function connect(paramQuery) {
    return new Promise((resolve, reject) => {
        let client;
        if (process.env.DEVELOP_FLG == 0) {
            //本番環境
            client = new Client({
                user: process.env.DATABASE_USER,
                host: process.env.DATABASE_HOST,
                database: process.env.DATABASE,
                password: process.env.DATABASE_PASSWORD,
                url: process.env.DATABASE_URL,
                port: process.env.DATABASE_PORT,
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            });
        } else {
            //ローカル環境
            client = new Client({
                user: "postgres",
                host: "localhost",
                database: "postgres",
                password: "password",
            });
        }
        client.connect().then(() => {
            let query = {
                text: paramQuery
            }
            client.query(query)
                .then(res => {
                    client.end();
                    resolve(res.rows);
                })
                .catch(e => {
                    console.error(e.stack);
                    client.end();
                });
        }).catch(e => {
            console.log("コネクト失敗");
            console.error(e);
        })
    });

}


module.exports = connect;