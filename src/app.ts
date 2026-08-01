import express, { Application, Request, Response } from "express";
import { authRoutes } from "./modules/auth/auth.route";

const app : Application = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.send("Assignment server is running now");
})

// Auth route
app.use("/api/auth", authRoutes)

export default app;