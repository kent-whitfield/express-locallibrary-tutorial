const bookinstance = require("../models/bookinstance");
var BookInstance = require("../models/bookinstance");
var Book = require("../models/book");

var async = require("async");
const { body, validationResult } = require("express-validator");

// Display list of all BookInstances
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate("book")
    .exec(function (err, list_bookinstances) {
      if (err) {
        return next(err);
      }
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance
exports.bookinstance_detail = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function (err, bookinstance) {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        var err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }

      res.render("bookinstance_detail", {
        title: "Copy: " + bookinstance.book.title,
        bookinstance: bookinstance,
      });
    });
};

// Display BookInstance create form on GET
exports.bookinstance_create_get = function (req, res, next) {
  Book.find({}, "title").exec(function (err, books) {
    if (err) {
      return next(err);
    }
    // successful, render form
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books,
    });
  });
};

// Handle BookInstance create on POST
exports.bookinstance_create_post = [
  // validate and sanitize fields
  body("book", "Book must be specified.").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date.")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // process request
  (req, res, next) => {
    // extract validation errors
    const errors = validationResult(req);

    // create bookInstance with trimmed and escaped data
    var bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // errors encountered, render form again with sanitized data and error messages
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // successful, so render form
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
        });
      });
      return;
    } else {
      // form data is valid

      bookinstance.save(function (err) {
        if (err) {
          return next(err);
        }
        // successful, redirect to new record
        res.redirect(bookinstance.url);
      });
    }
  },
];

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = function (req, res, next) {
  async.parallel(
    {
      bookinstance: function (callback) {
        BookInstance.findById(req.params.id).populate("book").exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.bookinstance == null) {
        // book instance not found, redirect to list
        res.redirect("/catalog/bookinstances");
      }

      // Successful, so render form
      res.render("bookinstance_delete", {
        title: "Delete Book Instance",
        bookinstance: results.bookinstance,
      });
    }
  );
};

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = function (req, res, next) {
  async.parallel(
    {
      bookinstance: function (callback) {
        BookInstance.findById(req.body.bookinstanceid)
          .populate("book")
          .exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }

      // Success, remove book instance and redirect to list of book instances
      BookInstance.findByIdAndRemove(
        req.body.bookinstanceid,
        function deleteBookInstance(err) {
          if (err) {
            return next(err);
          }

          // success - go to bookinstance list
          res.redirect("/catalog/bookinstances");
        }
      );
    }
  );
};

// Display BookInstance update form on GET
exports.bookinstance_update_get = function (req, res) {
  res.send("NOT IMPLEMENTED: BookInstance update GET");
};

// Handle bookinstance update on POST
exports.bookinstance_update_post = function (req, res) {
  res.send("NOT IMPLEMENTED: BookInstance update POST");
};
