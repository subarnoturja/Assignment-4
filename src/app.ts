import express, { Application, Request, Response } from "express";
import { authRoutes } from "./modules/auth/auth.route";
import { categoryRoutes } from "./modules/category/category.route";
import { serviceRoutes } from "./modules/service/service.route";
import { technicianRoutes } from "./modules/technician/technician.route";
import { bookingRoutes } from "./modules/booking/booking.route";

const app : Application = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.send("Assignment server is running now");
})

// Auth route
app.use("/api/auth", authRoutes)

// Category route
app.use("/api/category", categoryRoutes)

// service route
app.use("/api/service", serviceRoutes)

// technician route
app.use("/api/technician", technicianRoutes)

// booking route
app.use("/api/booking", bookingRoutes)

export default app;