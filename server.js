const proxy = require("redbird")({port:80});
const forever = require("forever");
const express = require("express");
const bodyParser = require("body-parser");
const cmd = require("node-cmd");
const mysql = require("mysql2");
const fs = require("fs");

const PORT = 2998;

const app = express();

let portCount;

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
	console.log(req.body.repository.name,req.body.sender.login);
	
	var repoName,username, newDB;
	if(!req.body.ref){
		repoName = req.body.repository.name;
		username = req.body.sender.login;
		newDB = true;
		portCount++;
		connection.query(`UPDATE counter SET count=${portCount} WHERE id=1`,(err,results)=>{});
	}
	else{
		reponame = "";
		username = req.body.sender.login;
		newDB = false;
	}
	
	setTimeout(()=>{
		connection.query(`SELECT * FROM Projects WHERE repoName = "${repoName}" AND username = "${username}"`,(err, results) => {
			if(err) console.log(err);
			console.log(results);
			newDB ? addProject(results[0]) : updateProject(results[0]);
		})	
	},1500);
	
		//make sql db "username-projectname"
		//make mongodb "username-projectname"
		//git clone into ../"username-projectname"
		//add to envs port, production, mongo, sql address
		//if front end
			//copy project into /un-pn/public
			//copy server template into username-projectname
			//if react git clone 
	
	res.send("got it");
})

//get latest port assignment
connection.query(`SELECT * FROM counter`,(err, results) => {
	if(err) console.log(err);
	portCount = results[0].count;
	console.log("port:"+portCount);
})	

function addProject(dbInfo){
	let address = dbInfo.username + "-" + dbInfo.repoName;
	//proxy.register(`${address}.hernoku.us`,`http://127.0.0.1:${portCount}`);
	//TODO add server info to envs
	let newEnvs = dbInfo.envs + `\nPORT=${portCount}\nNODE_ENV=production`;
	connection.query(`UPDATE Projects SET envs = "${newEnvs}" WHERE gitLink = "${dbInfo.gitLink}"`,(err,results)=>{});
	cmd.get(`
		cd ~/code/hosted
		git clone ${dbInfo.gitLink}
		mv ${dbInfo.repoName} address
		`,
		(err, data, stderr)=>{
			const relAddr = `../hosted/${address}`;
			//create env file
			fs.writeFile(relAddr,JSON.stringify(newEnvs),(err)=>{});
			
			//full stack and react
			if(dbInfo.fullStack && dbInfo.react){
			
			}
			//full stack no react
			else if(dbInfo.fullStack && !dbInfo.react){
				cmd.get(`forever start -c "npm start" ${relAddr}`,()=>{});
			}
			//front end and react
			else if(!dbInfo.fullstack && dbInfo.react){
			
			}
			//front end no react
			else{
			
			}
		}
	)
	//git clone
	//add an env

}

function updateProject(dbInfo){
	let address = dbInfo.username + "-" + dbInfo.repoName;
	connection.query(`SELECT * FROM Projects`).then((err,results)=>{
		console.log("waited",results);
	})	
}

proxy.register("hernoku.us/api/pushNotice","http://127.0.0.1:2998");
proxy.register("hernoku.us","localhost:3000");


app.listen(PORT,err=>{
	if (err) throw err;
	console.log("Program started on port " + PORT);
});

