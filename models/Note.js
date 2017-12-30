const mongoose = require("mongoose");

// Schema constructor
const Schema = mongoose.Schema;

// Note Schema
const NoteSchema = new Schema({
  // `title` is of type String and is required
  title: {
    type: String,
    required: true
  },
  // `body` is of type String and is required
  body: {
    type: String,
    required: true
  }
});

// Create the Note model
const Note = mongoose.model("Note", NoteSchema);

// Export the Note model
module.exports = Note;
