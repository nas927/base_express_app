import { verifyPassword }from "./bcrypt_hash"
import { generateToken, verifyToken } from "./secure_token";

const host: String | undefined = process.env.POSTGRE_HOST;
const port: String | undefined = process.env.POSTGRE_PORT;
const dbname: String | undefined = process.env.POSTGRE_DB;
const username: String | undefined = process.env.POSTGRE_USER;
const password: String | undefined = process.env.POSTGRE_PASSWORD;

const pgp = require('pg-promise')(/* options */)
const db = pgp(`postgres://${username}:${password}@${host}:${port}/${dbname}`)

function dbConnect(): void {
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
}

async function registerUserToDB(username: string, password: string): Promise<string> {
    const {PreparedStatement: PS} = require('pg-promise');
    const userId = Math.floor((Math.random() * 1000000) + (Math.random() * 10000));
    await db.query(`SET app.current_user_id = $1`, [userId]);
    const addUser = new PS({name: 'add-user', text: 'INSERT INTO Users(username, password_hash, created_at, user_id) VALUES($1, $2, $3, $4)'});

    addUser.values = [username, password, new Date().toISOString(), userId];

    await db.none(addUser)
        .then((data: any) => {
            console.log("User added to database", data);
        })
        .catch((error: any) => {
            console.log("Error adding user to database: ", error);
        });

    return generateToken({ "username": username, "user_id": userId });
}

async function getUser(username: string, password: string): Promise<any> {
    const {PreparedStatement: PS} = require('pg-promise');
    const getUser = new PS({name: 'get-user', text: 'select user_id, password_hash FROM Users WHERE username = $1'});
    let passwordHash: string = "";
    let userId: string = "";

    getUser.values = [username];
    
    await db.one(getUser)
        .then((data: any) => {
            console.log("User retrieved from database: ", data["user_id"]);
            passwordHash = data["password_hash"];
            userId = data["user_id"];
        })
        .catch((error: any) => {
            console.log("Error retrieving user from database: ", error);
        });

    if (await verifyPassword(password, passwordHash))
        return { success: true, message: "User authenticated successfully", user_id: userId };
    else
        return null;
}

async function connectWithJWT(token: string): Promise<boolean> {
    let payload: any = null;
    if (!token)
        return false;

    payload = verifyToken(token);
    console.log("Payload from token verification: ", payload);
    if (payload === null)
        return false;
    console.log("Token payload: ", payload);
    const {PreparedStatement: PS} = require('pg-promise');
    await db.query(`SET app.current_user_id = $1`, [payload.user_id]);
    const getUser = new PS({name: 'get-user-id', text: 'select * FROM Users'});

    console.log("Verifying token for user_id: ", payload.user_id);
    await db.one(getUser)
        .then((data: any) => {
            console.log("ok that here");
        })
        .catch((error: any) => {
            console.log("Error retrieving user from database: ", error);
        });

    console.log("Token is valid and user exists in database. Payload: ", payload);
    return true;
}

export { dbConnect, registerUserToDB, getUser, connectWithJWT };