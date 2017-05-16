module.exports = function(app, passport) {
    var User = require('../app/models/user');
    var graph = require('fbgraph');
    var Twitter = require('twitter');
    var configAuth = require('../config/auth');
    var OAuth2 = require('OAuth').OAuth2;
    const data = require("../data");
    var pages = data.pages;
    const sampleData = require("../sampleData.json");

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    app.get('/home', function(req, res) {
        pages.getAllPages().then((pagesList) => {
            res.render('home.ejs', {
                pages: pagesList
            });
        }).catch(() => {
            // Something went wrong with the server!
            res.sendStatus(500);
        });
        // res.render('home.ejs', {
        //     pages: sampleData
        // });
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user
        });
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

        // handle the callback after facebook has authenticated the user
        app.get('/auth/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

        // handle the callback after twitter has authenticated the user
        app.get('/auth/twitter/callback',
            passport.authenticate('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

        // the callback after google has authenticated the user
        app.get('/auth/google/callback',
            passport.authenticate('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', passport.authorize('facebook', {authType: 'rerequest', scope : ['email', 'user_friends', 'public_profile'] }));

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback',
            passport.authorize('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));
        app.post('/analyze', function(req, res){
            console.log(req.user);
            /*
            var access_token = req.user.facebook.token;
            graph.setAccessToken(access_token);
            var options = {
                timeout:  3000
                , pool:     { maxSockets:  Infinity }
                , headers:  { connection:  "keep-alive" }
                };

            graph
            .setOptions(options)
            .get("me/friends?limit=50", function(err, res) {
                console.log(res); // { id: '4', name: 'Mark Zuckerberg'... }
            });*/
            var oauth2 = new OAuth2(configAuth.twitterAuth.consumerKey, configAuth.twitterAuth.consumerSecret, 'https://api.twitter.com/', null, 'oauth2/token', null);
            var bearer_token;
            oauth2.getOAuthAccessToken('', {
                'grant_type': 'client_credentials'
            }, function (e, access_token) {
                //console.log(access_token); //string that we can use to authenticate request
                bearer_token = access_token;
            });
            var Twitter = require('twitter');
            console.log(bearer_token);
            var client = new Twitter({
            consumer_key: configAuth.twitterAuth.consumerKey,
            consumer_secret: configAuth.twitterAuth.consumerSecret,
            bearer_token: "AAAAAAAAAAAAAAAAAAAAAPq40gAAAAAA8%2BWzg0FOhSNVRuR%2F%2FP4PMplbAf4%3D7QFKd7nUDL8aPKESoAXldb1VA6oaFMjMVOSG17dQ3buFAZKeaE"
            /*
            access_token_key: '381105033-hvPqQNAs3BAKSNB3QDzcHxzsq9FQgGlnOEhO3JJI',
            access_token_secret: 'yTDI8XzoOnU4i8WCKDeIT4NUKs3fXIZjwIfGgCTb2qCZm'*/
            });
            
            var params = {screen_name: req.user.twitter.username};
            client.get('statuses/user_timeline', params, function(error, tweets, response) {
            if (!error) {
                console.log(tweets);
            }
            else
            {
                console.log(error);
            }
            });
            res.redirect('/profile');
        });

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

        // handle the callback after twitter has authorized the user
        app.get('/connect/twitter/callback',
            passport.authorize('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

        // the callback after google has authorized the user
        app.get('/connect/google/callback',
            passport.authorize('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', isLoggedIn, function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', isLoggedIn, function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });


};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
