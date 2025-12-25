
const router = require("express").Router();
const {createFaq} = require("../../controllers/Admin/FaqControllers");

router
  .route("/")
  .post(createFaq )

module.exports = router;
