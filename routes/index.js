var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", {
    title: "Local Library",
    subtitle: "Local Library Tutorial for Express",
  });
});

module.exports = router;
