import express, { Application, Request, Response } from "express";

const app : Application = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.send("Assignment server is running now");
})

export default app;