const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const Favorites = require('../models/favorites');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    //querying DB for favorites list of the user with user id
    //using _id getter to directly populate user
    Favorites.findOne({ user: req.user._id })
      .populate("dishes")
      .then(
        (faves) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(faves);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({user: req.user._id})
    .then((favorite) => {
        if (favorite.length > 0) {
            //Add dishes to favorite document
            var dishes = req.body;
            for(var i =0; i< dishes.length; i++) {
                if(favorite[0].dishes.indexOf(dishes[i]._id) == -1) {
                    favorite[0].dishes.push(dishes[i]._id);
                }
            }
            favorite[0].save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })            
            }, (err) => next(err));
        }
        else {
            //Create new favorite document and add dishes to it
            var favoriteToCreate = {
                user: req.user._id,
                dishes: req.body
            };

            Favorites.create(favoriteToCreate)
            .then((favorite) => {
                console.log('Favorite Created ', favorite);
                Favorites.findById(favorite._id)
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })     
            }, (err) => next(err))
            .catch((err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /Favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({user: req.user._id})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /Favorites/'+ req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({user: req.user._id})
    .then((favorite) => {
        if (favorite.length > 0) {
            //Add dish to favorite document
            if(favorite[0].dishes.indexOf(req.params.dishId) == -1) {
                favorite[0].dishes.push(req.params.dishId);
            }
            
            favorite[0].save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })            
            }, (err) => next(err));
        }
        else {
            //Create new favorite document and add dishes to it
            var favoriteToCreate = {
                user: req.user._id,
                dishes: req.params.dishId
            };
            Favorites.create(favoriteToCreate)
            .then((favorite) => {
                console.log('Favorite Created ', favorite);
                Favorites.findById(favorite._id)
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })     
            }, (err) => next(err))
            .catch((err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /Favorites/'+ req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({user: req.user._id})
    .then((favorite) => {
        if (favorite.length > 0) {
            if(favorite[0].dishes.indexOf(req.params.dishId) != -1) {
                favorite[0].dishes.splice(favorite[0].dishes.indexOf(req.params.dishId), 1);
            }
            if(favorite[0].dishes.length > 0) {
                favorite[0].save()
                .then((favorite) => {
                    Favorites.findById(favorite._id)
                    .populate('user')
                    .populate('dishes')
                    .then((favorite) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    })            
                }, (err) => next(err));
            } else {
                favorite[0].remove()
                .then((resp) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(resp);
                }, (err) => next(err))
                .catch((err) => next(err));  
            }
       } else {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
       }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoriteRouter;