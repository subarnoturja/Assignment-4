import express, { Application, Request, Response } from "express";
import { authRoutes } from "./modules/auth/auth.route";
import { categoryRoutes } from "./modules/category/category.route";

const app : Application = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.send("Assignment server is running now");
})

// Auth route
app.use("/api/auth", authRoutes)
// Category route
app.use("/api/category", categoryRoutes)

export default app;