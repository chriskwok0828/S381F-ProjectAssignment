const express = require('express');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const app = express();
const assert = require('assert');
const fs = require('fs');
const formidable = require('formidable');

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const mongo = require('mongodb');
const mongourl = '';
const dbName = 'Assignment';

app.set('view engine','ejs');

const SECRETKEY = 'I want to pass COMPS381F';



const findDocument = (db, criteria, callback) => {
    let cursor = db.collection('User').find(criteria);
    console.log(`findDocument: ${JSON.stringify(criteria)}`);
    cursor.toArray((err,docs) => {
        assert.equal(err,null);
		console.log(`findDocument: ${docs.length}`);
		callback(docs)
        
    });
}

const findrestaurant = (db, criteria, callback) => {
    let cursor = db.collection('Restaurant').find(criteria);
    //console.log(`findRestaurant: ${JSON.stringify(criteria)}`);
    cursor.toArray((err,docs) => {
        assert.equal(err,null);
        console.log(`findRestaurant: ${docs.length}`);
        callback(docs);
    });
}

const handle_Find_User = (res, criteria,req) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
		assert.equal(null, err);
		
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        findDocument(db, criteria, (docs) => {
            client.close();
			console.log("Closed DB connection");
			if(docs.length > 0){
				req.session.authenticated=true;
	    		req.session.username=docs[0].name;
	    		req.session.id=docs[0].id;
            	res.redirect('/');
			}else{
				msg = "Cannot find user!"
				res.render('err_msg', {msg: msg});
			}
	    
        });
    });
}


const handle_Find_restaurant_detail = (req,res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        findrestaurant(db, criteria, (docs) => {
            client.close();
	    if(docs){
			res.render('details', {c: docs,req:req});
		}else{
			res.status(500).end(criteria + ' not found!');
			}       
        });
    });
}

const handle_edit_restaurant_detail = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        findrestaurant(db, criteria, (docs) => {
            client.close();
	    if(docs){
			res.render('editlist', {c: docs});
		}else{
			res.status(500).end(criteria + ' not found!');
			}       
        });
    });
}

const handle_update_restaurant = (res, criteria,RID) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

	db.collection(`Restaurant`).updateOne(RID,{$set:criteria},(err,results)=>{
		assert.equal(err,null);
		console.log("Update Restaurant!")
				client.close()
		res.redirect(`/showdetails?id=${RID['_id']}`);
		});
		
    });
}

const handle_delete_restaurant = (res, criteria,req) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

	findrestaurant(db, criteria, (docs) => {
	    if(docs[0].owner==req.session.username){

		db.collection(`Restaurant`).deleteOne(criteria,(err,results)=>{
		assert.equal(err,null);
		console.log("Delete Restaurant!")
                client.close()
		res.redirect('/');
		});
						
		}else{
			res.status(500).json({"error":"Your are not owner!"});
				}     
        });
		
    });
}


const handle_insert_restaurant = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
	

	db.collection('Restaurant').insertOne(criteria,(err,result)=>{
                assert.equal(err,null);
		console.log("Add new Restaurant!")
                client.close()
                res.redirect('/');

            });

    });
}

const handle_select_all_restaurant = (res,req) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
	
	let num = db.collection('Restaurant').find()
	    num.toArray((err,docs)=>{
			assert.equal(err,null);
			console.log(`Restaurant count: ${docs.length}`)
			client.close()
			res.render('list', {c: docs,username: req.session.username,criteria:JSON.stringify({})});

	});
    });
}

const handle_user_check_rate = (res, req,restaurnat_id) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
		assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
		let criteria = {};
		criteria['_id'] = new mongo.ObjectID(restaurnat_id);
        findrestaurant(db, criteria, (docs) => {
            client.close();
	    if(docs){
			rated = false;
			doc = {}
			if(docs[0].grades){
				docs[0].grades.forEach(grade => {
				if(grade.user == req.session.username){
					doc = grade;
					rated = true;
				}
			});
			if(rated){
				//update rate
				res.status(200).render('rate',{username:doc.user,score:doc.score,restaurant_id:docs[0]._id});
			}else{
				//inseart rate
				res.status(200).render('rate',{username:req.session.username,restaurant_id:docs[0]._id});
			}
			}else{
				//inseart rate
				res.status(200).render('rate',{username:req.session.username,restaurant_id:docs[0]._id});
			}
		}else{
			res.status(500).end(criteria + ' not found!');
			}       
        });
    });
}

const handle_user_update_insert_rate  = (res, req,restaurnat_id) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
		assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
		let criteria = {};
		criteria['_id'] = new mongo.ObjectID(restaurnat_id);
        findrestaurant(db, criteria, (docs) => {
			rated = false;
			doc = {}
			if(docs[0].grades){
				docs[0].grades.forEach(grade => {
				if(grade.user == req.session.username){
					rated = true;
				}
			})
		};
			if(rated){
				let criteria = {};
				criteria['_id'] = new mongo.ObjectID(restaurnat_id);
				criteria['grades.user'] = req.session.username;
				let new_criteria = {};
				new_criteria['grades.$.score'] = req.body.score;

				db.collection(`Restaurant`).updateOne(criteria,{$set:new_criteria},(err,results)=>{
					assert.equal(err,null);
					console.log("Update score!")
							client.close()
					res.redirect(`/showdetails?id=${restaurnat_id}`);
					});
			}else{
				let criteria = {};
				criteria['_id'] = new mongo.ObjectID(restaurnat_id);
				new_rate = {
					"user" : req.session.username,
					"score" : req.body.score
				}
				//push rate
				db.collection(`Restaurant`).updateOne(criteria,{$push:{grades : new_rate}},(err,results)=>{
					assert.equal(err,null);
					console.log("Update score!")
							client.close()
					res.redirect(`/showdetails?id=${restaurnat_id}`);
					});
			}
			client.close();   
        });
    });
}

const handle_search = (res,req) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
		const db = client.db(dbName);
		let criteria = {};
		criteria[req.body.search_method] = req.body.search_content;
		if(req.body.search_method && req.body.search_content){
			findrestaurant(db, criteria, (docs) => {
				client.close();
			if(docs){
				res.render('list', {c: docs,username: req.session.username,criteria:JSON.stringify(criteria)});
			}else{
				res.status(500).end(criteria + ' not found!');
				}       
			});	
		}else{
			handle_select_all_restaurant(res,req)
		}
			

    });
}



app.set('view engine','ejs');

app.use(session({
  name: 'loginSession',
  id:"loginSession",
  keys: [SECRETKEY]
}));

// support parsing of application/json type post data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req,res) => {
	//console.log(req.session);
	if (!req.session.authenticated) {    // user not logged in!
		res.redirect('/login');
	} else {
		res.redirect('/read');
	}
});

app.get('/login', (req,res) => {
	res.status(200).render('login',{});
});

app.post('/login', (req,res) => {
	if(req.body.name){
        
            let newDoc={};
            newDoc['name']=req.body.name;
            newDoc['password']=req.body.password;
	     
            handle_Find_User(res,newDoc,req);
    }else{
        res.status(500).json({"error":"missing name"});
        }
});

/////////////////////////////////////////////////////
app.get('/register', (req,res) => {
	res.status(200).render('register',{});
});

app.post('/register', (req,res) => {
    if(req.body.name){
        const client = new MongoClient(mongourl);
        client.connect((err)=>{
            assert.equal(null,err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);
            let newDoc={};
            newDoc['name']=req.body.name;
            newDoc['password']=req.body.password;

            let num = db.collection('User').find()
	    num.toArray((err,docs)=>{
			assert.equal(err,null);
			console.log(`User count: ${docs.length}`)
			newDoc['id']=(docs.length+1);

            db.collection('User').insertOne(newDoc,(err,result)=>{
                assert.equal(err,null);
				console.log("Add new user!")
                client.close()
                res.redirect('/');

            })
		})
        })
    }else{
        res.status(500).json({"error":"missing name"});
        }
});
//////////////////////////////////////////////////////
app.get('/addlist', (req,res) => {
	res.status(200).render('addlist',{});
});

app.post('/addlist', (req,res) => {
	const form = new formidable.IncomingForm();
	
		form.parse(req, (err, fields, files) => {
			if(fields.name){
				fs.readFile(files.photo.path, (err,data) => {
					assert.equal(err,null);
					let newDoc={};
					let address={};
					let grades=[];

			
					address['street']=fields.street;
					address['building']=fields.building;
					address['zipcode']=fields.zipcode;
					address['coord']=fields.coord;

					newDoc['name']=fields.name;
					newDoc['borough']=fields.borough;
					newDoc['cuisine']=fields.cuisine;
					newDoc['photo']= new Buffer.from(data).toString('base64');
					newDoc['mimetype'] = files.photo.type;
					newDoc['address']=address;
					newDoc['grades'] = grades;
					newDoc[`owner`]=req.session.username;
					
					handle_insert_restaurant(res,newDoc);
					
				
				})}else{
					res.status(500).json({"error":"missing restaurant name!"});
					}
			
		});
        
       
    
});
///////////////////////////////////////////

app.get('/logout', (req,res) => {
	req.session = null;   // clear cookie-session
	res.redirect('/');
});


app.get('/read', function(req,res) {
	handle_select_all_restaurant(res,req);
});

app.get('/showdetails', (req,res) => {
	if (req.query.id) {
		let criteria={};
		id = new mongo.ObjectID(req.query.id);
		criteria['_id']=id;
	     
            handle_Find_restaurant_detail(req,res,criteria,req);
	} else {
		res.status(500).end('id missing!');
	}
});
////////////////////////////////////////////////////////
app.get('/edit', (req,res) => {
	if (req.query.id&&req.query.owner) {
		if(req.session.username ==req.query.owner){
			let newDoc={};
            		newDoc['_id']=new mongo.ObjectID(req.query.id);
	     
            		handle_edit_restaurant_detail(res,newDoc,req);
		}else{
			res.status(500).end('You are not owner!You can not edit!');
			}
	} else {
		res.status(500).end('id or owner name missing!');
	}
});
//////////////////////////////////////////////////////////////
app.post('/update', (req,res) => {
	const form = new formidable.IncomingForm();
	
	form.parse(req, (err, fields, files) => {
	if(fields.name){
		fs.readFile(files.photo.path, (err,data) => {
		let RID={};
		let newDoc={};
	    let address={};


		RID['_id']=new mongo.ObjectID(fields.id);


		address['street']=fields.street;
		address['building']=fields.building;
		address['zipcode']=fields.zipcode;
		address['coord']=fields.coord;

		newDoc['name']=fields.name;
		newDoc['borough']=fields.borough;
		newDoc['cuisine']=fields.cuisine;
		if (files.photo && files.photo.size > 0) {
			newDoc['photo']= new Buffer.from(data).toString('base64');
			newDoc['mimetype'] = files.photo.type;
		}else{
			newDoc['photo'] = fields.base64;
			newDoc['mimetype'] = fields.base64_type;
		}
		
		newDoc['address']=address;

		handle_update_restaurant(res,newDoc,RID);
	})
    }else{
        res.status(500).json({"error":"missing restaurant name!"});
		}
	})
});
////////////////////////////////////////////////////////////
app.get('/delete', (req,res) => {
	if (req.query.id) {
	    let newDoc={};
            newDoc['_id']=new mongo.ObjectID(req.query.id);
	     
            handle_delete_restaurant(res,newDoc,req);
	} else {
		res.status(500).end('id missing!');
	}
});


///////////////////////////////////////////////////////////
app.get('/leaflet', (req,res) => {
	if (req.query.coord) {
		coord = req.query.coord.split(",");
		restaurant_id = req.query._id;
		lat = coord[0];
		lon = coord[1];
		res.status(200).render('leaflet',{lat:lat,lon:lon,restaurant_id:restaurant_id});
	}
})

app.get('/rate', (req,res) => {
	//restaurant_id is _id
	restaurant_id = req.query.restaurant_id;
	handle_user_check_rate(res,req,restaurant_id);
	
});

app.post('/rate', (req,res) => {
	//restaurant_id is _id
	restaurant_id = req.body.restaurant_id;
	handle_user_update_insert_rate(res,req,restaurant_id);
	
});

app.post('/search', (req,res) => {
	//restaurant_id is _id
	restaurant_id = req.body.restaurant_id;
	handle_search(res,req);
	
});

app.get('/api/restaurant/name/:name', (req,res) => {
    if (req.params.name) {
        let criteria = {};
        criteria['name'] = req.params.name;
        const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);

            findrestaurant(db, criteria, (docs) => {
                client.close();
                console.log("Closed DB connection");
                res.status(200).json(docs);
            });
        });
    } else {
        res.status(500).json({"error": "missing name"});
    }
})

app.get('/api/restaurant/borough/:borough', (req,res) => {
    if (req.params.borough) {
        let criteria = {};
        criteria['borough'] = req.params.borough;
        const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);

            findrestaurant(db, criteria, (docs) => {
                client.close();
                console.log("Closed DB connection");
                res.status(200).json(docs);
            });
        });
    } else {
        res.status(500).json({"error": "missing borough"});
    }
})

app.get('/api/restaurant/cuisine/:cuisine', (req,res) => {
    if (req.params.cuisine) {
        let criteria = {};
        criteria['cuisine'] = req.params.cuisine;
        const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);

            findrestaurant(db, criteria, (docs) => {
                client.close();
                console.log("Closed DB connection");
                res.status(200).json(docs);
            });
        });
    } else {
        res.status(500).json({"error": "missing cuisine"});
    }
})


app.listen(process.env.PORT || 8099);
