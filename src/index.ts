import Express from "express";
import dotenv from "dotenv";
const env = dotenv.config();
import { body, validationResult } from "express-validator";
import { hashPassword } from "./bcrypt_hash";
import { generateToken } from "./secure_token";
import cors from "cors";
import helmet from "helmet";
import validate from "./secure_send";
import cookieParser from "cookie-parser";
import axios from "axios";
import crypto, { hash } from "crypto";
import { dbConnect, registerUserToDB, getUser, connectWithJWT } from "./db";
import "./secure_token";


const csrfTokens = new Map<string, { token: string, timestamp: number }>();
dbConnect();

function checkCsrfTokens(sessionId: string, csrftoken: string): boolean {
    console.log("Checking CSRF tokens for sessionId: ", sessionId, " and csrftoken: ", csrftoken);
    const storedToken = csrfTokens.get(sessionId);
    if (!storedToken || storedToken.token !== csrftoken)
        return false;

    csrfTokens.delete(sessionId);
    return true;
}

const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST']
};

const app = Express();
app.use(Express.json());
app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser())

app.get("/", async (req, res) => {
    const csrftoken = crypto.randomBytes(32).toString("hex");
    const sessionId = crypto.randomBytes(16).toString("hex");
    csrfTokens.set(sessionId, { token: csrftoken, timestamp: Date.now() });

    await axios.post("http://localhost:3000/signIn", {
        username: "nassim92",
        password: "nassim92",
        csrftoken: csrftoken,
        sessionId: sessionId
    }, { withCredentials: true, headers: { "Content-Type": "application/json", "Cookie": `token=${req.cookies['token']}` }
     })
    .then(response => {
        console.log("Response from /signIn: ", response.data);
        res.cookie("token", response.data.token, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 24 * 60 * 60 * 1000});
        res.send("Connected !");
    })
    .catch(error => {
        console.log("Error from /signIn: ", error.response ? error.response.data : error.message);
        res.send("Hello World!");
    });
});

app.post("/signUp", validate([
  body('username').trim().notEmpty().escape().isString().isLength({ min: 8, max: 255 }),
  body('password').trim().notEmpty().escape().isString().isLength({ min: 8, max: 255 }),
  body('csrftoken').trim().notEmpty().escape().isString(),
  body('sessionId').trim().notEmpty().escape().isString()
]), async (req, res) => {
    const result = validationResult(req);
    const { username, password, csrftoken, sessionId } = req.body;

    if (!result.isEmpty())
        return res.status(400).json({ errors: result.array() });

    if (!checkCsrfTokens(sessionId, csrftoken))
        return res.status(403).json({ message: "Invalid CSRF token" });

    const hashedPassword = await hashPassword(password);
    const token = registerUserToDB(username, hashedPassword);

    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 24 * 60 * 60 * 1000});
    res.status(200).json({ message: "User registered successfully" });
});

app.post("/signIn", validate([
    body('username').trim().notEmpty().escape().isString().isLength({ min: 8, max: 255 }),
    body('password').trim().notEmpty().escape().isString().isLength({ min: 8, max: 255 }),
    body('csrftoken').trim().notEmpty().escape().isString(),
    body('sessionId').trim().notEmpty().escape().isString()
]), async (req, res) => {
    let token: string = "";
    const result = validationResult(req);
    const { username, password, csrftoken, sessionId } = req.body;

    if (!result.isEmpty())
        return res.status(400).json({ errors: result.array() });

    if (!checkCsrfTokens(sessionId, csrftoken))
        return res.status(403).json({ message: "Invalid CSRF token" });
    
    if (!req.cookies['token'] || !(await connectWithJWT(req.cookies.token))) {
        const user = await getUser(username, password);
        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        token = generateToken({ "username": username, "user_id": user.user_id });
        console.log("Generated token: ", token);
    }

    res.status(200).json({ message: "User signed in successfully", token: token });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});