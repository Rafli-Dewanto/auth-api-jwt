import { Request, Response, NextFunction } from 'express'

export default class Comment {
    get(req: Request, res: Response, _next: NextFunction) {
        res.status(200).json({
            message: `hello there with email ${req.user}`
        })
    }
}