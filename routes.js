const router = require('express').Router();

//controller;
const UserController = require('./src/controllers/UserController');

//User
router.post('/register', UserController.register);
router.get('/confirm/:token', UserController.confirm);
router.post('/login', UserController.login);
router.get('/list/users');


module.exports = router;