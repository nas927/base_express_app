import Express from "express";
import dotenv from "dotenv";
const env = dotenv.config();
import { body, validationResult } from "express-validator";
import { hashPassword } from "./bcrypt_hash";
import { generateToken } from "./secure_token";
import cors from "cors";
import helmet from "helmet";
import sendToDatabase from "./db";
import validate from "./secure_send";
import axios from "axios";
import crypto from "crypto";
import "./db";
import "./secure_token";


const csrfTokens = new Map<string, { token: string, timestamp: number }>();

const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST']
};

const app = Express();
app.use(Express.json());
app.use(helmet());
app.use(cors());

app.get("/", (req, res) => {
    const csrfToken = crypto.randomBytes(32).toString("hex");
    const sessionId = crypto.randomBytes(16).toString("hex");
    csrfTokens.set(sessionId, { token: csrfToken, timestamp: Date.now() });

    res.send("Hello World!");
    axios.post("http://localhost:3000/signUp", {
        username: "nassim92",
        password: "nassim92",
        csrfToken: csrfToken,
        sessionId: sessionId
    })
    .then(response => {
        console.log("Response from /signIn: ", response.data);
    })
    .catch(error => {
        console.log("Error from /signIn: ", error.response ? error.response.data : error.message);
    });
});

app.post("/signUp", validate([
  body('username').trim().notEmpty().escape().isString().isLength({ min: 8, max: 255 }),
  body('password').trim().notEmpty().escape().isString().isLength({ min: 8, max: 255 }),
  body('csrfToken').trim().notEmpty().escape().isString(),
  body('sessionId').trim().notEmpty().escape().isString()
]), async (req, res) => {
    const result = validationResult(req);
    const { username, password, csrfToken, sessionId } = req.body;

    if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
    }

    const storedToken = csrfTokens.get(sessionId);
    if (!storedToken || storedToken.token !== csrfToken) {
        return res.status(403).json({ error: "Invalid CSRF token" });
    }

    csrfTokens.delete(sessionId);

    const hashedPassword = await hashPassword(password);
    sendToDatabase(username, hashedPassword);
    const token = generateToken({ "username": username, "password": hashedPassword });

    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 24 * 60 * 60 * 1000});
    res.status(200).json({ message: "User registered successfully" });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});