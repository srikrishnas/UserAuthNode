const express = require('express');
const mongodb = require('mongodb');
require('dotenv').config();
const bcrypt = require('bcrypt');
var cors = require("cors");
const nodemailer = require("nodemailer");
const Mail = require('nodemailer/lib/mailer');

const app = express();
const mongoClient = mongodb.MongoClient;
// const objectId = mongodb.ObjectId;

const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017";
const port = process.env.PORT || 4000

app.use(express.json());
app.use(cors());

//get all users
app.get('/', async (req, res) => {
    console.log("get request")
    try {
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db("User_db");
        let data = await db.collection("user").find().project({ password: 0 }).toArray();
        res.status(200).json(data);
        clientInfo.close();
    }
    catch (error) {
        console.log(error);
    }
})

app.post('/register', async (req, res) => {
    try {
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db("User_db");
        let found = await db.collection("user").findOne({ email: req.body.email });
        if (found) {
            res.status(400).json({ message: "user already exists" })
        } else {
            let salt = await bcrypt.genSalt(10);
            let hash = await bcrypt.hash(req.body.password, salt);
            console.log(salt);
            req.body.password = hash;
            await db.collection('user').insertOne(req.body);
            res.status(200).json({ message: "user registered" });
            MailUser(req.body.email,req.body.name)
        }
        // res.status(200).json();
        // clientInfo.close();
    }
    catch (error) {
        console.log(error);
    }
})

app.post('/login', async (req, res) => {
    try {
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db("User_db");
        let found = await db.collection("user").findOne({ email: req.body.email });
        if (found) {
            let isValid = await bcrypt.compare(req.body.password, found.password)
            if (isValid) {
                res.status(200).json({ message: "login successful" })
            } else {
                //401 Unauthorized
                res.status(401).json({ message: "login Unsuccessful" })
            }
        } else {
            //400
            res.status(404).json({ message: "user not registered" })
        }
        clientInfo.close();
    }
    catch (error) {
        console.log(error);
    }
})

async function MailUser(email,name) {
    console.log(name)
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "01.srikrishna.08@gmail.com", // generated ethereal user
            pass: "asusvivobook", // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '01.srikrishna.08@gmail.com', // sender address
        to: "01.srikrishna.08@gmail.com,"+ email, // list of receivers
        subject: "welcome "+name, // Subject line
        text: "Hello "+name, // plain text body
        html: "Hello "+name+" Thank you for Registering withh us!", // html body
    });

    // verify connection configuration
    transporter.verify(function (error, success) {
        if (error) {
            console.log(error);
        } else {
            console.log("Mailed!!");
        }
    });

}

app.listen(port, () => console.log("CORS-enabled web server listening on port", port));