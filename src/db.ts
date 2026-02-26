import { send } from "node:process";

const host: String | undefined = process.env.POSTGRE_HOST;
const port: String | undefined = process.env.POSTGRE_PORT;
const dbname: String | undefined = process.env.POSTGRE_DB;
const username: String | undefined = process.env.POSTGRE_USER;
const password: String | undefined = process.env.POSTGRE_PASSWORD;

const pgp = require('pg-promise')(/* options */)
const db = pgp(`postgres://${username}:${password}@${host}:${port}/${dbname}`)

db.connect()
    .then((obj: any) => {
        console.log("Connected to database");
    })
    .then((data: any) => {
        console.log("Database connection successful");
    })
    .catch((error: any) => {
        console.log("Error connecting to database: ", error);
    });

async function sendToDatabase(username: string, password: string): Promise<void> {
    const {PreparedStatement: PS} = require('pg-promise');
    const userId = Math.floor((Math.random() * 1000000) + (Math.random() * 10000));
    await db.query(`SET app.current_user_id = $1`, [userId]);
    const addUser = new PS({name: 'add-user', text: 'INSERT INTO Users(username, password_hash, created_at, user_id) VALUES($1, $2, $3, $4)'});

    addUser.values = [username, password, new Date().toISOString(), userId];

    db.none(addUser)
        .then(() => {
            console.log("User added to database");
        })
        .catch((error: any) => {
            console.log("Error adding user to database: ", error);
        });
}

export default sendToDatabase;