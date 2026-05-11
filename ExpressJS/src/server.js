import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import viewEngine from "./config/viewEngine.js";
import initWebRoutes from "./route/web.js";
import connectDB from "./config/configdb.js";

// config dotenv
dotenv.config();

const app = express();

// connect database
connectDB();

// middleware
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cookieParser());

app.use((req, res, next) => {
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// view engine
viewEngine(app);

// routes
initWebRoutes(app);

// port
const port = process.env.PORT || 8080;

// start server
app.listen(port, () => {
    console.log(
        `Backend Nodejs is running on port: ${port}`
    );
});