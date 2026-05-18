import express from "express";// cú pháp khác tương đương: var express = require('express');
//javascript theo ES6
let configViewEngine = (app) => {
    app.use(express.static("./src/public"));//Thiết lập thư mục tĩnh chứa images, css,..
    app.use("/public", express.static("./ReactJS/public")); // Phục vụ ảnh từ ReactJS/public/images
    app.use(express.static("./ReactJS/public")); // Cũng serve từ root
    app.set("view engine", "ejs"); //thiết lập viewEngine
    app.set("views", "./src/views") //thư mục chứa views
}

module.exports = configViewEngine; //xuất hàm ra