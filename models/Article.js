const mongoose = require("mongoose");

// Schema constructor
const Schema = mongoose.Schema;

// Article Schema
const ArticleSchema = new Schema({
  // `title` is required and of type String
  title: {
    type: String,
    required: true
  },
  // `link` is required and of type String
  link: {
    type: String,
    required: true
  },
  // teaser is longer description and is of type String
  teaser: {
    type: String
  },
  // An array of id's for associated notes
  notes: [
    {
      type: Schema.Types.ObjectId,
      ref: "Note"
    }
  ]
});

// Create the actual model
const Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;
