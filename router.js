const path = require('path');
const express = require("express");
// определяем Router
const bookingRouter = express.Router();
 
// определяем маршруты и их обработчики внутри роутера
bookingRouter.use("/about", function (request, response) {
	  response.sendFile(path.join(__dirname, "about.html"));
});

bookingRouter.use("/booking", function (request, response) {
	  response.sendFile(path.join(__dirname, "booking.html"));
});

bookingRouter.use("/", function (request, response) {
	response.sendFile(path.join(__dirname, "main_page.html"));
});

module.exports = bookingRouter;