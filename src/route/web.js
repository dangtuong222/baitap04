import express from "express"; //gọi Express
import homeController from "../controller/homeController"; //gọi controller

let router = express.Router(); //khởi tạo Route

let initWebRoutes = (app) => {
    router.get('/login', auth.controller); 

    return app.use("/", router); //url mặc định
}

module.exports = initWebRoutes;