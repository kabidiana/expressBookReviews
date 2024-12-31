const express = require('express');
let books = require("./booksdb.js");
let { isValid, users } = require("./auth_users.js");
const public_users = express.Router();
const jwt = require('jsonwebtoken');
const regd_users = express.Router();
const axios = require('axios');

// User registration
regd_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Both username and password are required." });
  }

  if (isValid(username)) {
    return res.status(400).json({ message: "Username already exists." });
  }

  users.push({ username, password });

  return res.status(200).json({ message: "User successfully registered!" });
});

// Get book list
public_users.get('/', async (req, res) => {
  try {
    const bookList = await new Promise((resolve) => {
      setTimeout(() => {
        const simplifiedBooks = Object.keys(books).map(isbn => {
          const { title, author, reviews } = books[isbn];
          return { title, author, reviews };
        });
        resolve(simplifiedBooks);
      }, 1000);
    });

    return res.status(200).send(JSON.stringify(bookList, null, 4));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve book list.' });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  new Promise((resolve, reject) => {
    if (books[isbn]) {
      const { title, author, reviews } = books[isbn];
      resolve({ title, author, reviews });
    } else {
      reject('Book not found');
    }
  })
    .then(bookDetails => {
      return res.status(200).json(bookDetails);
    })
    .catch(error => {
      return res.status(404).json({ message: error });
    });
});

// Get books by author
public_users.get('/author/:author', async (req, res) => {
  const author = req.params.author;

  try {
    const booksByAuthor = await new Promise((resolve, reject) => {
      const booksList = Object.values(books)
        .filter(book => book.author.toLowerCase() === author.toLowerCase())
        .map(({ title, author, reviews }) => ({ title, author, reviews }));

      if (booksList.length > 0) {
        resolve(booksList);
      } else {
        reject('No books found by this author');
      }
    });

    return res.status(200).json(booksByAuthor);
  } catch (error) {
    return res.status(404).json({ message: error });
  }
});

// Get books by title
public_users.get('/title/:title', async (req, res) => {
  const title = req.params.title;

  try {
    const booksByTitle = await new Promise((resolve, reject) => {
      const filteredBooks = Object.values(books)
        .filter(book => book.title.toLowerCase().includes(title.toLowerCase()))
        .map(({ title, author, reviews }) => ({ title, author, reviews }));

      if (filteredBooks.length > 0) {
        resolve(filteredBooks);
      } else {
        reject('No books found by this title');
      }
    });

    return res.status(200).json(booksByTitle);
  } catch (error) {
    return res.status(404).json({ message: error });
  }
});

// Get book reviews by ISBN
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  if (books[isbn]) {
    const reviews = books[isbn].reviews;
    return res.status(200).json({ reviews });
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});

module.exports.general = public_users;
module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
