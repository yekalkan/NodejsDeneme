var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/SSPdatabase');

var index = require('./routes/index');
var users = require('./routes/users');
var login = require('./routes/login');
var signup = require('./routes/signup');
var mainpage = require('./routes/mainpage');
var temsilcibilgileri = require('./routes/temsilcibilgileri');
var profile= require('./routes/profile');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'ssshhhhh', saveUninitialized: true , resave: true}));


app.use(function(req,res,next){
    req.db = db;
    next();
});

app.use('/', index);
app.use('/users', users);
app.use('/login', login);
app.use('/signup', signup);
app.use('/mainpage', mainpage);
app.use('/temsilcibilgileri', temsilcibilgileri);
app.use('/profile', profile);

app.post('/loginprovider',function(req,res){
    var e_mail=req.body.email.trim();
    var password=req.body.password;

    var db = req.db;
    var users = db.get('users');
    users.find({"email":e_mail,"password":password}, function(err, result) {
        if (err) throw err;
        console.log(result);

        if(result.length > 0) {
            if (result[0].usertype === "temsilci" && result[0].signupstatus === "infoneeded") {
                req.session.email = e_mail;
                req.session.loggedin = true;
                res.redirect('/temsilcibilgileri');
            }
            else {
                req.session.email = e_mail;
                req.session.loggedin = true;
                res.redirect('/mainpage');
            }
        }
        else{
            res.redirect('/login');
        }
    });
});

app.post('/yenikullanici',function(req,res){
    var e_mail=req.body.email.trim();
    var password=req.body.password;
    var password2=req.body.password2;
    var userType=req.body.usertype;


    var db = req.db;
    var users = db.get('users');
    users.insert({"email":e_mail,"password":password,"usertype":userType, "signupstatus":"infoneeded"}, function(err, result) {
        if (err) throw err;

        if(userType === "temsilci"){
            req.session.email = e_mail;
            req.session.loggedin = true;
            req.session.infoneeded = true;
            res.redirect('/temsilcibilgileri');
        }
        else {
            req.session.email = e_mail;
            //res.render('bagiscibilgileri');
        }

    });
});

app.post('/kullanicibilgileri',function(req,res){
    var e_mail=req.session.email;
    var userType=req.body.usertype;

    if(userType === "temsilci") {
        req.session.infoneeded = false;
        var db = req.db;
        var users = db.get('users');
        users.update({"email": e_mail}, {
            $set: {
                "signupstatus": "confirmneeded",
                "school": req.body.school,
                "name": req.body.name,
                "birthdate": req.body.birthdate,
                "address": {
                    "localaddress": req.body.address,
                    "district": req.body.district,
                    "city": req.body.city
                },
                "phone": req.body.phone
            }
        }, function (err, result) {
            if (err) throw err;

            res.redirect('/mainpage');
        });
    }
    else{
        // bağışçı
    }
});

app.get('/logout',function(req,res){
    req.session.destroy();
     res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
