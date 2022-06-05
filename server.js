require('dotenv').config();

const express = require('express');
const app = express();

const mongoose = require('mongoose');

//connect db
const CONNECTDB = process.env.CONNECTDB;

mongoose.connect(CONNECTDB)
    .then(event => {
        console.log("Database connected.");
        app.emit('connected');
    })
    .catch(e => console.log(e));

//middlewares
app.use(express.urlencoded({extended: true}));
app.use(express.json());

const routes = require('./routes');
app.use(routes)



app.on('connected', event => {
    app.listen(5000, event => {
        console.log('Server running in port 5000.');
    })
})



