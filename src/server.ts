import express from "express";
import config from './app/config';
import authRouter from "./app/auth/router";
import commentRouter from "./app/comment/router";
import cookieParser from "cookie-parser";

const app = express();
const port = 3000 || config.PORT;
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1", authRouter);
app.use("/api/v1", commentRouter);
app.listen(port, () => console.log(`running on http://127.0.0.1:${port}`));
