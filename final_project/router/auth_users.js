const express = require('express');
const jwt = require('jsonwebtoken');
const regd_users = express.Router();
const router = express.Router();

require('dotenv').config();

let users = [];
let booksDb = require('./booksdb');

const isValid = (username) => {
  return users.some(user => user.username === username);
};

const authenticatedUser = (username, password) => {
  const user = users.find(user => user.username === username);
  return user && user.password === password;
};

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

regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  if (authenticatedUser(username, password)) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    return res.status(200).json({ message: "User login successful", token });
  } else {
    return res.status(401).json({ message: "Invalid username or password." });
  }
});

regd_users.post('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const { review } = req.body;

  const book = booksDb[isbn];

  if (!book) {
    return res.status(404).json({ message: 'Book not found with the provided ISBN.' });
  }

  if (!review) {
    return res.status(400).json({ message: 'Review content is required.' });
  }

  const reviewId = new Date().getTime();
  book.reviews[reviewId] = { review };

  const reviewUrl = `http://localhost:5000/customer/auth/review/${isbn}?review=${encodeURIComponent(review)}`;

  return res.status(200).json({
    message: `Review successfully added to book "${book.title}", "${book.author}".`,
    reviewUrl,
    review
  });
});

regd_users.delete('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const { review } = req.query;

  const book = booksDb[isbn];

  if (!book) {
    return res.status(404).json({ message: 'Book not found with the provided ISBN.' });
  }

  const reviewExists = Object.values(book.reviews).some(r => r.review === review);

  if (!reviewExists) {
    return res.status(404).json({ message: 'Review not found for the provided content.' });
  }

  const reviewId = Object.keys(book.reviews).find(key => book.reviews[key].review === review);
  delete book.reviews[reviewId];

  return res.status(200).json({
    message: `Review successfully deleted from book "${book.title}", "${book.author}".`,
    review
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
