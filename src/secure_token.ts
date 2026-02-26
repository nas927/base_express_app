import jwt from "jsonwebtoken";

const secretKey: string = process.env.JWT_SECRET_KEY as string;

const generateToken = (payload: object, expiresIn: string | number = "1h") => {
    return jwt.sign(payload, secretKey, { algorithm: "HS384" });
};

const verifyToken = (token: string) => {
    let payload: any = null;
    jwt.verify(token, secretKey, { algorithms: ['HS384'] }, function (err, data) {
        if (err)
            console.log("Token verification failed: ", err);
        else
        {
            console.log("Token is valid. Payload: ", data);
            payload = data;
        } 
    });
    return payload;
}

export { generateToken, verifyToken };