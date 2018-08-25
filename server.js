const proxy = require("redbird")({port:80});
const forever = require("forever");
const express = require("express");
const bodyParser = require("body-parser");
const cmd = require("node-cmd");
const mysql = require("mysql2");

const PORT = 2998;

const app = express();

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "root",
  database: "hernoku"
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.post("/",(req,res)=>{
	console.log("hi\n");
	console.log(req);
	res.send("got it");
})

proxy.register("hernoku.us/api/pushNotice","127.0.0.1:2998");
proxy.register("http://hernoku.us","127.0.0.1:3000/api/pushNotice");


app.listen(PORT,err=>{
	if (err) throw err;
	console.log("Program started on port " + PORT);
});

