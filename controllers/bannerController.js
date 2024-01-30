const express = require("express");
const nocache = require("nocache");
const path = require("path");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const router = express.Router();
const mongoose = require("mongoose");
const session = require("express-session");
//const files = require('../public/uploads');
const usercollection = require("../model/account");
const CatCollection = require("../model/category");
const productcollection = require("../model/product");
const orderdb = require('../model/order')
const banner =require('../model/banner')
const { log } = require("console");
const multer = require("multer");
const PDFDocument = require("pdfkit-table");
const ExcelJS = require("exceljs");

require("dotenv").config();

router.use(
  session({
    secret: "secret key",
    resave: false,
    saveUninitialized: true,
  })
);

router.use(nocache());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());


exports.bannermang = async(req,res)=>{
    try {
      const banners = await banner.find();
      res.render('bannermang', { banners: banners });
    } catch (error) {
      // Handle the error appropriately
      console.error('Error fetching banners:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  exports.addbanner = async(req,res)=>{
    try {
      const banners = await banner.find();
      res.render('addbanner', { banners: banners });
    } catch (error) {
      // Handle the error appropriately
      console.error('add banners:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  exports.postBanner = async (req, res) => {
    console.log("file",req.file);
    const newBanner = new banner({
      image: req.file.path.substring(6),
    })
    newBanner.save()
    res.redirect("/admin/banner");
  }