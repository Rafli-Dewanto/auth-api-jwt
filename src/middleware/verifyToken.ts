import {Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../app/config"

function verifyToken(req: Request, res: Response, next: NextFunction) {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) return res.sendStatus(401);

    const token = auth.replace("Bearer ", "");
    
    try {
        const decode = jwt.verify(token, config.ACCESS_KEY as string) as {email: string};
        req.user = decode.email
        return next();
    } catch (error) {
        return res.status(401).json(error)
    }

}

export default verifyToken;