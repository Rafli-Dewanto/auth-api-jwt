import { Request, Response, NextFunction } from 'express'
import data from "../../data/users.json";
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import config from "../config";
import createFile from '../../utils/createFile';

interface payloadType {
    email: string;
    password: string;
}

class Auth{
    async register(req: Request, res: Response, next: NextFunction){
        const payload = req.body as payloadType;

        if (payload.email.length < 1 || payload.password.length < 1) {
            return res.status(400).json({
                code: 400,
                status: "BAD_REQUEST",
                message: "email/password required"
            })
        }

        const user = data.filter((item: { email: string; }) => item.email === payload.email);

        if (user.length) return res.status(409).json({
            code: 409,
            status: "CONFLICT",
            message: "email already exists"
        })

        try {
            const encrypt = await argon2.hash(payload.password);
            // object baru dari payload
            const newUser = {...payload, password: encrypt};
            const setUser = [...data, newUser]
            await createFile(setUser);            

            return res.status(200).json({
                code: 200,
                status: "OK",
                message: "register success"
            });
        } catch (error) {
            return next(error);
        }
    }

    async login (req: Request, res: Response, next: NextFunction) {
        const payload = req.body as payloadType;

        if (payload.email.length < 1 || payload.password.length < 1) {
            return res.status(400).json({
                code: 400,
                status: "BAD_REQUEST",
                message: "email/password must not be null"
            })
        }

        const user = data.filter(item => item.email === payload.email); // returns an array of object, containing one user

        if (user.length < 1) {
            return res.status(404).json({
                code: 404,
                status: "NOT_FOUND",
                message: "wrong email/password"
            })
        }
        
        try {
            const match = await argon2.verify(user[0].password, payload.password)
            
            if (!match) return res.status(404).json({
                code: 404,
                status: "NOT_FOUND",
                message: "wrong email/password"
            })

            const accessToken = jwt.sign({email: payload.email}, config.ACCESS_KEY as string, {expiresIn: "30s"});
            const refreshToken = jwt.sign({email: payload.email}, config.REFRESH_KEY as string, {expiresIn: "1d"});
            
            const otherUser = data.filter(item => item.email !== payload.email); // exclude currently log in user
            const currentUser = {...user[0], refreshToken}; // add refresh token to the current user that logged in
            const setUser = [...otherUser, currentUser]; // add all user
            await createFile(setUser); // save user to db

            const oneDay = 24 * 60 * 60 * 1000;
            res.cookie('jwt', refreshToken, {httpOnly: true, maxAge: oneDay, secure: false}) // set secure to true if in production
            return res.status(200).json({
                token: accessToken,
            })

        } catch (error) {
            return next(error)
        }
    }

    refreshToken(req: Request, res: Response, next: NextFunction) {
        const cookie = req.cookies as {jwt: string};

        if (!cookie?.jwt) return res.sendStatus(401);

        const refreshToken = cookie.jwt;

        const user = data.filter(item => item.refreshToken === refreshToken);

        if (user.length < 1) return res.sendStatus(401);

        try {
            const decode = jwt.verify(refreshToken, config.REFRESH_KEY as string) as {email: string};
            const accessToken = jwt.sign({email: decode.email}, config.ACCESS_KEY as string, {expiresIn: "30s"});
            return res.status(200).json({accessToken});
        } catch (error) {
            return next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        const cookie = req.cookies as {jwt: string};
        
        if (!cookie?.jwt) return res.sendStatus(204);

        const refreshToken = cookie.jwt;

        const user = data.filter(item => item.refreshToken === refreshToken);

        if (user.length < 1){
            res.clearCookie("jwt", {httpOnly: true});
            return res.sendStatus(204);
        } 
        
        const otherUser = data.filter(item => item.refreshToken !== refreshToken);
        const currentUser = {...user[0], refreshToken: ""};
        const setUser = [...otherUser, currentUser];

        try {
            await createFile(setUser);
            res.clearCookie("jwt", {httpOnly: true});
            return res.sendStatus(204);
        } catch (error) {
            return next(error);
        }

    } 
}

export default Auth;