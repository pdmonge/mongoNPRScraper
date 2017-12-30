const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const path = require("path");
const moment = require("moment");

const axios = require("axios");
const cheerio = require("cheerio");

// Database Constants
const db = require("./models");
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/nprscraper";
const PORT = 3000;

// Initialize Express
const app = express();

// Configure middleware
// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
// app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, '/node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, '/node_modules/bootbox/')));

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

// Routes

// Helper functions

// Select NPR articles from a passed in axios response,
// And pass back an array of article objects
const createArticleList = (response) => {
  // Load the data into cheerio and save it to $ for a shorthand selector
  let $ = cheerio.load(response.data);
  /* 
    NPR structure as of 12/2017:
      <div class="story-text">
        <div class="slug-wrap">
          <h2 class="slug">
            <a href = "section link">Section Name</a>
          </h2>
        </div>
        <a href="story link">
          <h1 class="title">Story Title</h1>
        </a>
        <a href="story link">
          <p class = "teaser">Teaser text...</p>
        </a>
      </div>
  */
  let articleList = [];
  let dbLookupPromises = [];
  $('h1.title').each(function(i, element) {
    if (element.parent.name === "a") {
      let aArticle = {
        title:  element.children[0].data.trim(),
        link:   element.parent.attribs.href,
        teaser: $(element.parent).siblings('a').children('p.teaser').text().trim()
      }
      // Look for an existing article within articleList that matches the current article title
      // Only add to list if the title does not already exist
      let articleExists = articleList.find((element)=>{
        return element.title === aArticle.title
      });
      if (!articleExists) {
        articleList.push(aArticle);
        dbLookupPromises.push(db.Article.findOne({ link: aArticle.link }));
      }
    }
  });

  return Promise.all(dbLookupPromises)
    .then(dbResults => {
      // Filter out articles that found a match in the db
      return articleList.filter((article, aIndex) => {
        return !dbResults[aIndex];
      });
    })
};

// A GET route for scraping the NPR website
app.get("/scrape", function(req, res) {
  // Request the html with axios
  axios.get("https://www.npr.org/").then(function(response) {

    createArticleList(response).then(articleList => {

      db.Article
      // Create new Articles by passing in articleList
      .create(articleList)
      .then(function(newArticles) {
        // Send response if all articles were created
        res.json(newArticles);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
    });
    })
  .catch(function(err) {
    res.send(err)
  });

});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article
    .find({})
    .populate("notes")
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's notes
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article
    .findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("notes")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      // If the note creation was successful, update the Article's "notes" array by adding the new note id
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { notes: dbNote._id } }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log(moment().format());
  console.log("App running on port " + PORT + "!");
});
