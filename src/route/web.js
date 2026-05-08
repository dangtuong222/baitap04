import express from "express";
import authRoutes from "./auth.routes.js";

let router = express.Router(); 

let initWebRoutes = (app) => {
    app.use("/", authRoutes);

    return app.use("/", router);
}

module.exports = initWebRoutes;