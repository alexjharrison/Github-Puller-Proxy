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

app.post("/delete",(req,res)=>{
	console.log(req.body.proj);
	cmd.get(`
		sudo rm -rf /home/pi/code/hosted/*-${req.body.proj}/ 
		sudo forever stopall
		`,()=>{
			startAllPrograms();
		})
})

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
	},2000);
	
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
	proxy.register(`${address}.hernoku.us`,`http://127.0.0.1:${portCount}`);
	//No longer needed
	let newEnvs = "\n" + dbInfo.envs + `\nPORT=${portCount}\nNODE_ENV=production` + "\n";
	connection.query(`UPDATE Projects SET envs = "${newEnvs}" WHERE gitLink = "${dbInfo.gitLink}"`,(err,results)=>{});
	console.log(address);
	cmd.get(`
		sudo git clone ${dbInfo.gitLink} /home/pi/code/hosted/${address}
		`,
		(err, data, stderr)=>{
			console.log("data",data);
			console.log("error",err);
			const relAddr = `/home/pi/code/hosted/${address}/`;
			
			//create env file
			fs.writeFile(`/home/pi/code/hosted/${address}/.env`,newEnvs,(err)=>{});
			
			//full stack and react
			if(dbInfo.fullStack && dbInfo.react){
			cmd.get(`
					cd /home/pi/code/hosted/${address}
					sudo npm i dotenv
					sudo npm i
					//forever start -c "npm start" ${relAddr}
					`,()=>{}
				);
			}
			//full stack no react
			else if(dbInfo.fullStack && !dbInfo.react){
				cmd.get(`
					cd /home/pi/code/hosted/${address}
					sudo npm i
					//forever start -c "npm start" ${relAddr}
					`,()=>{}
				);
			}
			//front end and react
			else if(!dbInfo.fullstack && dbInfo.react){
				cmd.get(`
						cd /home/pi/code/hosted/${address}
						sudo npm i
						//forever start -c "npm start" ${relAddr}
						`,()=>{}
					);
				}
			//front end no react
			else{
				cmd.get(`
						sudo cp -r /home/pi/code/hosted/${address}/ /home/pi/code/hosted/${address}/public
						sudo mv -r /home/pi/code/hosted/${address}/.git /home/pi/code/hosted/${address}/public/.git
						sudo mv -r /home/pi/code/hosted/${address}/.vscode /home/pi/code/hosted/${address}/public/.vscode
						sudo cp /home/pi/code/backendtemplate/* /home/pi/code/hosted/${address}
						sudo cp -r /home/pi/code/backendtemplate/node_modules /home/pi/code/hosted/${address}/node_modules
						sudo rm -rf /home/pi/code/hosted/${address}/.git
						sudo rm -rf /home/pi/code/hosted/${address}/.vscode
						cd /home/pi/code/hosted/${address}
						forever start -c "npm start" ./
						`,()=>{}
					);
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

function startAllPrograms() {
	connection.query(`SELECT * FROM Projects`,(err, results) => {
		if(err) console.log(err);
		results.forEach(project=>{
			//front end no react
			if(!project.fullStack && !project.react){
				cmd.get(`
						forever start -c "npm start" /home/pi/code/hosted/${project.username}-${project.repoName}
					`,()=>{}
				);
			}
		})
	})	
}

proxy.register("hernoku.us/api/pushNotice","http://127.0.0.1:2998/");
proxy.register("hernoku.us/api/delete","http://127.0.0.1:2998/delete");
proxy.register("hernoku.us","localhost:3000");


app.listen(PORT,err=>{
	if (err) throw err;
	console.log("Program started on port " + PORT);
});

