const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// استيراد مكتبة الذكاء الاصطناعي المجانية
const { pipeline, cos_sim } = require("@xenova/transformers");

const passport = require("./config/passport");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();




// ==================================
// @desc Start new chat
// @route /api/v1/chat
// @method POST
// @access public ( for logged in users )
// ==================================

