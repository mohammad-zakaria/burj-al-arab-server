const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");

require('dotenv').config();
console.log(process.env.DB_PASS)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8hqot.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const port = 5000;

const app = express();

app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./configs/burj-al-arab-after-auth-zack-firebase-adminsdk-1evpq-2d1451bdf0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});

const password = "arabianPass";

const MongoClient = require("mongodb").MongoClient;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookings = client.db("burjAlArab").collection("bookings");
  // perform actions on the collection object
  console.log("db connected successfully");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      console.log(result);
      res.send(result.insertedCount > 0);
    });
    console.log(newBooking);
  });

  app.get("/bookings", (req, res) => {
    // console.log(req.headers.authorization);
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      console.log({ idToken });

      // idToken comes from the client app
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          // const uid = decodedToken.uid;
          // console.log({ uid });
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(tokenEmail, queryEmail)
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail }).toArray((err, documents) => {
              res.send(documents);
            });
          }
          // ...
        }).catch((error) => {
          // Handle error
          res.status(401).send('unauthorized access')
        });
    }
    else{
      res.status(401).send('unauthorized access')
    }
  });
  //   client.close();
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port);
