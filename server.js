const dotenv = require('dotenv');
dotenv.config();
var express  = require('express')
  , session  = require('express-session')
  , passport = require('passport')
  , Strategy = require('./lib').Strategy
  , path     = require('path')
  , ejs      = require('ejs')
  , req      = require('request')
  , https    = require("https")
  , app      = express();

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

var scopes = ['identify', 'email', 'guilds'];

passport.use(new Strategy({
    clientID: process.env.client_id,
    clientSecret: process.env.client_secret,
    callbackURL: process.env.callback_url,
    scope: scopes
}, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
        return done(null, profile);
    });
}));

app.use(session({
    secret:  process.env.app_secret,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views',__dirname+'/views');
app.get('/', passport.authenticate('discord', { scope: scopes }), function(req, res) {});
app.get('/callback',
    passport.authenticate('discord', { failureRedirect: '/fail' }), function(req, res) { res.redirect('/auth') } // auth success
);
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});
app.get('/auth', checkAuth, function(req, res) {
    var i, x = "";
    var d = req.user;
    var guild = d.guilds;
    var myguild = process.env.my_guild;
    var uname = (d.username + "#" + d.discriminator);
    var uid = d.id;
    var email = d.email;
    for (i in guild) {  // check user is in my guild
        if (guild[i].id == myguild) {
            x = d.guilds[i].id;
        }
    }
    if (x == myguild) { // if user in my guild - grant access
        req.session.name = uname;
        req.session.email = email;
        req.session.uid = uid;
        res.render(process.env.ejs_template,{uname:req.session.name}); // send discord username with template
    } else {
        res.redirect(process.env.invite_link); // if user is not in my guild, redirect to invite
    }
});

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
        res.send('not logged in...try again.');
}


app.listen(process.env.listen_port, function (err) {
    if (err) return console.log(err)
    console.log('Listening at ' + process.env.listen_port)
})
