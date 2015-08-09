var request = require('request')
var mqtt = require('mqtt')
var _ = require('lodash')
var colorMap = require('./colorMap')
var playlistMap = require('./playlistMap')
var Firebase = require('firebase')

var FIREBASE_TOKEN = process.env.FIREBASE_TOKEN

var presentInRoom = false
var playlistTheme = ''

function moodToColor(level) {
	return colorMap[level]
}

function updateColor(level) {
	var color = moodToColor(level)
	console.log('Mood at',level,'Will set color to',color)
	client.publish('lights/color',color)
}

function changeMusic(level) {
	playlistTheme = playlistMap[level]
	console.log('Set music to %s',playlistTheme)
}

function checkMood() {
	var ref = new Firebase("https://moodtrackerapp.firebaseio.com/moodlogNumbers/simplelogin:43");
	ref.authWithCustomToken(FIREBASE_TOKEN, function(err, authData) {
		if (err) return console.error(err)
		console.log('Authed with firebase.',authData)
		
		ref.limitToLast(1).on('child_added', function(latestMood) {
			updateColor(latestMood.val().level)

			changeMusic(latestMood.val().level)	  
		})
	})
}

var client = mqtt.connect("mqtt://localhost")

client.on('message', function(topic, payload) {
	presentInRoom = true
	var beforeBedtime = moment().isBefore(moment().endOf('day').subtract(2,'hours'))
	var afterWaking = moment().isAfter(moment().startOf('day').add(10,'hours'))
	if (afterWaking && beforeBedtime) {
		client.publish('music/playlist', playlistTheme)
	}
})

client.on('connect', function(err) {
	if (err) return console.error(err)
	console.log('Connected to MQTT broker')

	client.subscribe('motion/#')

	checkMood()
})

client.on('close', function() {
	console.log("fail!!! close")
})		

client.on('offline', function() {
	console.log("fail!!! offline")
})	