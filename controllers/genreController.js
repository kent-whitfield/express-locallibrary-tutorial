var Genre = require("../models/genre");
var Book = require("../models/book");

var async = require("async");
const { body, validationResult } = require("express-validator");

// Display list of all Genres
exports.genre_list = function (req, res, next) {
  Genre.find()
    .sort([["name", "ascending"]])
    .exec(function (err, list_genres) {
      if (err) {
        next(err);
      }
      res.render("genre_list", {
        title: "Genre List",
        genre_list: list_genres,
      });
    });
};

// Display detail page for a specific Genre
exports.genre_detail = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        var err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      //successful, so render
      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Display Genre create form on GET
exports.genre_create_get = function (req, res) {
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST
exports.genre_create_post = [
  // Validate and sanitize the name field
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and santization
  (req, res, next) => {
    // Extract validation errors from request
    const errors = validationResult(req);

    // Create a new genre object with escaped and trimmed data
    var genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // if there are errors, render the form again with sanitized values and error messages
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid

      // check if genre with same name already exists
      Genre.findOne({ name: req.body.name }).exec(function (err, found_genre) {
        if (err) {
          return next(err);
        }

        if (found_genre) {
          // Genre exists, redirect to its detail page
          res.redirect(found_genre.url);
        } else {
          genre.save(function (err) {
            if (err) {
              return next(err);
            }

            // Genre saved, redirect to detail page
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

// Display Genre delete form on GET
exports.genre_delete_get = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genres_books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        res.redirect("/catalog/genres");
      }

      // successful, so render
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: results.genre,
        genre_books: results.genres_books,
      });
    }
  );
};

// Handle Genre delete on POST
exports.genre_delete_post = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.body.genreid).exec(callback);
      },
      genres_books: function (callback) {
        Book.find({ genre: req.body.genreid }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }

      if (results.genres_books.length > 0) {
        // genre has books, render in the same way as for GET route
        res.render("genre_delete", {
          title: "Delete Genre",
          genre: results.genre,
          genre_books: results.genres_books,
        });
        return;
      } else {
        // genre has no books, delete and return to genre list
        Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
          if (err) {
            return next(err);
          }
          // success - go to genre list
          res.redirect("/catalog/genres");
        });
      }
    }
  );
};

// Display Genre update form on GET
exports.genre_update_get = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        var err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }

      // success
      res.render("genre_form", { title: "Update Genre", genre: results.genre });
    }
  );
};

// Handle Genre update on POST
exports.genre_update_post = [
  // sanitize fields
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  // process request
  (req, res, next) => {
    // extract validation errors
    const errors = validationResult(req);

    var genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // validation errors, render form with sanitized values/error messages
      res.render("genre_form", {
        title: "Update Genre",
        genre: genre,
        errors: errors.array(),
      });
    } else {
      // form data is valid, update genre
      Genre.findByIdAndUpdate(
        req.params.id,
        genre,
        {},
        function (err, thegenre) {
          if (err) {
            return next(err);
          }

          // genre updated - redirect to genre detail page
          res.redirect(thegenre.url);
        }
      );
    }
  },
];
