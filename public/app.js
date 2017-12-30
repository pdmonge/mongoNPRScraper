// Grab the articles as a json
$.getJSON("/articles", function(data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Use JQuery to build the new row
    let newRow = formatArticle(data[i]);
    
    // Display the apropos information on the page
    $("#articles").append(newRow);
  }
});

// Scrape button
$("#scrape-button").click(function(){
  $.getJSON("/scrape").done(function(data){
    console.log(JSON.stringify(data,null,2));
    location.assign("/");
  });
});

// Whenever someone clicks a .toggle-notes button
$(document).on("click", ".toggle-notes", function(event) {

});

// Whenever someone clicks a .new-note button show the modal-new-note
$(document).on("click", ".new-note", function(event) {
  newNoteModal = $("#modal-new-note");
  newNoteModal.data("id", $(this).data("id"));
  newNoteModal.modal("show");
});
/*
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .done(function(data) {
      console.log(data);
      // The title of the article
      $("#notes").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#notes").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

      // If there's a note in the article
      if (data.notes) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data.note.body);
      }
    });
 */


// When you click the savenote button
$(document).on("click", "#save-note", function() {
  // Grab the id associated with the article from the submit button
  let articleID = $("#modal-new-note").data("id");
  let newNote = {
    // Value taken from title input
    title: $("#note-title").val().trim(),
    // Value taken from note textarea
    body: $("#note-body").val().trim()
  }
  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: `/articles/${articleID}`,
    data: newNote
  }).done(function(aArticle) {
    // Log the response
    // console.log(aArticle);
    // Alert that the add was successful
    bootbox.alert("Note was added!");
    let sel = `#well-notes-${aArticle._id}`;
    // Add the new note to the notes section for the article
    let noteArea = $(sel);
    noteArea.empty();
    $.ajax({
      method: "GET",
      url: `/articles/${aArticle._id}`
    })
    // With that done, add the note information to the page
    .done(function(data) {
      console.log(data);

      data.notes.forEach(function(note) {
        noteArea.append(formatNote(data._id, note));
      });
    });
  });

  // Also, remove the values entered in the input and textarea for note entry
  $("#note-title").val("");
  $("#note-body").val("");
  $("#modal-new-note").data("id","");
  $("#modal-new-note").modal("hide");
});

// Helper Functions

// Create article HTML
function formatArticle(aArticle) {
  let formattedArticle = "";

  formattedArticle += `<div class="row">
      <div class="col-md-1"></div>
      <div class="col-md-10">
        <div data-id="${aArticle._id}" class="panel panel-primary">
          <div class="panel-heading article-heading">
            <h2 class="panel-title pull-left">${aArticle.title}</h2>
            <button class="btn btn-default btn-sm pull-right">Delete</button>
            <div class="clearfix"></div>
          </div>
          <div class="panel-body">
            <p><a href="${aArticle.link}">${aArticle.link}</a></p>
            <p>${aArticle.teaser}</p>
            <br />
            <button id="toggle-notes-${aArticle._id}" data-id="${aArticle._id}" class="btn btn-primary toggle-notes" type="button" data-toggle="collapse" data-target="#collapse-notes-${aArticle._id}" aria-expanded="false" aria-controls="collapse-notes">
              Show Notes
            </button>
            <button id="new-note-${aArticle._id}" data-id="${aArticle._id}" class="btn btn-warning new-note" type="button">
              New Note
            </button>
            <p></p>
            <div id="collapse-notes-${aArticle._id}" class="collapse">
              <div id="well-notes-${aArticle._id}" class="well">`;
    
  if (aArticle.notes.length > 0) {
    aArticle.notes.forEach(note => {
      formattedArticle += formatNote(aArticle, note);
    });
  } else {

  }

  /*   //*********************  For testing only
  formattedArticle += formatNote(aArticle, null); */

  // Add the remaining closing divs
  formattedArticle += `</div></div></div></div></div>`;

  return formattedArticle;
}

// Create note HTML
function formatNote(articleID, aNote) {
  let formattedNote="";

  formattedNote += `<div id="note-${aNote._id}" data-id="${aNote._id}" data-parentid="${articleID}" class="row"><div class="col-md-12">
    <div class="panel panel-success">
      <div class="panel-heading note-heading">
        <h3 class="panel-title pull-left">${aNote.title}</h3>
        <button class="btn btn-default btn-sm pull-right btn-delete-note" data-id="${aNote._id}">Delete</button>
        <div class="clearfix"></div>
      </div>
      <div class="panel-body">
        <p>${aNote.body}</p>
      </div>
    </div></div></div>`;
  
  return formattedNote;
}