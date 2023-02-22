const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config()

const app = express()

const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;

mongoose.set('strictQuery', false);
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
  if(err){
    console.log('connection to mongoDB failed');
    console.log(err);
  }
  else{
    console.log('mongoDB connected');
  }
});
let userSchema = new mongoose.Schema({
  username: String,
  exercises: [{
    description: String,
    duration: Number,
    date: Date
  }]
})
let User = mongoose.model('User', userSchema);

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.post('/api/users', (req, res) => {
  let newUser = new User({username: req.body.username});
  newUser.save((err, data) => {
    if(err)
    {
      console.log(err);
    }
    else
    {
      console.log('successful');
      res.json({username: data.username, _id: data.id})
    }
  })
})

app.get('/api/users', (req, res) => {
  User.find((err, data) => {
    if(err)
    {
      console.log(err);
    }
    else
    {
      res.json(data);
    }
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  let dateToSet = req.body.date ? new Date(req.body.date) : new Date();
  if(isNaN(dateToSet))
  {
    res.send('Invalid date!');
    return;
  }
  let newExercise = { description: req.body.description, duration: req.body.duration, date: dateToSet };
  User.findById(req.params._id, (err, data) => {
    if(err)
    {
      console.log(err);
    }
    else
    {
      data.exercises.push(newExercise);
      data.save((savingErr, savedData) => {
        if(savingErr)
        {
          console.log(savingErr);
        }
        else
        {
          res.json({
            _id: savedData._id,
            username: savedData.username,
            date: newExercise.date.toDateString(),
            duration: newExercise.duration,
            description: newExercise.description 
          })
        }
      })
    }
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  User.findById(req.params._id, (err, user) => {
    if(err){
      console.log(err);
    }
    else{
      var exercisesToDisplay = user.exercises.filter(el => {
        return (!req.query.from || 
          new Date(req.query.from).setHours(0, 0, 0, 0) < new Date(el.date).setHours(0, 0, 0, 0)) &&
        (!req.query.to || 
          new Date(req.query.to).setHours(0, 0, 0, 0) >= new Date(el.date).setHours(0, 0, 0, 0));
      });
      for (let i = 0; i < exercisesToDisplay.length; i++){
        let el = exercisesToDisplay[i];
        let dateToDisplay = new Date(el.date).toDateString();
        let elToDisplay = { description: el.description, duration: el.duration, date: dateToDisplay };
        exercisesToDisplay[i] = elToDisplay;
      }
      if(req.query.limit)
      {
        exercisesToDisplay.length = Math.min(req.query.limit, exercisesToDisplay.length);
      }
      res.json({
        _id: user._id,
        username: user.username,
        count: exercisesToDisplay.length,
        log: exercisesToDisplay
      })
    }
  })
})

const listener = app.listen(port, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
