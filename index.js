const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8265;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		res.header("Access-Control-Allow-Methods", "*");
		res.header("Content-Type", "application/json;charset=utf-8");
		next();
});

const sql = require('mssql');

sql.on('error', err => {
	console.error(err);
});

const config80 = {
	    user: 'sa',
	    password: 'sina.com.1',
	    server: '192.168.100.80',
	    database: 'MyWebFlow',
	    options: {
		            useUTC: true
		        }
};

let pool;
let connect_func = async function() {
	pool = await sql.connect(config80);
}
connect_func();

app.get('/api/idv/tds', function(req, res) {
	const g = req.query['gender'];
	let f = async function() {
		try {
			const result1 = await pool.request().input('gender',g).query('select * from TB_PD_TargetSisease where TSSex <> @gender');
			if (result1.recordset.length === 0) {
				res.status(404).end();
		        } else {
				res.status(200).json({data:result1.recordset});
			}
		} catch(err) {
			console.error(err);
		}
	};
	f();
});

app.get('/api/idv/pepkg', function(req, res) {
	const sqlstr = 'select TB_PD_TargetSis_Package.TSID,TB_PD_Package.* from TB_PD_TargetSis_Package,TB_PD_Package '
	+ 'where (TB_PD_TargetSis_Package.PKID = TB_PD_Package.PKID) and (TB_PD_TargetSis_Package.TSID in ';
	const tds = req.query['tds'];
	if (tds === undefined) {
		res.status(400).end();
	}
	let f = async function() {
		try {
			const result1 = await pool.request().query(sqlstr + `(${tds}))`);
			if (result1.recordset.length === 0) {
				res.status(404).end();
				return;
		        }
			const d1 = result1.recordset;
			for(j = 0; j < d1.length; ++j) {	
				let e = d1[j];
				const result2 = await pool.request().input('pkid',e.PKID).query('select GID from TB_PD_Package_Group where PKID=@pkid');
				const d2 = result2.recordset;
				e.GIDs = d2.map(v=>v.GID);
			}
			res.status(200).json({data:d1});
		} catch(err) {
			console.error(err);
		}
	};
	f();
});

app.get('/api/idv/ft2', function(req, res) {
	const sqlstr = "select Gid,GNAME,GRemarks,GPrice from TB_PD_Group where GSEX <> @gender and GStatus <> 'C' and GScreen <> 8";
	const g = req.query['gender'];
	let f = async function() {
		try {
			const result1 = await pool.request().input('gender',g).query(sqlstr);
			if (result1.recordset.length === 0) {
				res.status(404).end();
		        } else {
				res.status(200).json({data:result1.recordset});
			}
		} catch(err) {
			console.error(err);
		}
	};
	f();
});

app.listen(port, () => {
		console.log("Server is running on port " + port + "...");
});

