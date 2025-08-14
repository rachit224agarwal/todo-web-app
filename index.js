const express = require("express");
const { UserModel , TodoModel } = require("./db");
const app = express();
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const JWT_SECRET = "ilikeyou";
mongoose.connect("mongodb+srv://agarwalrachit224:CRISk8Dv9AXRiEL8@cluster0.vyclbuc.mongodb.net/todo-webapp-22")

app.use(express.json());

app.post("/signup",async function(req,res){
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    await UserModel.create({
        name : name,
        email : email,
        password : password
    })

    res.json({
        message : "You are signed up"
    })

});

app.post("/signin",async function(req,res){
    const email = req.body.email;
    const password = req.body.password;

    const user = await UserModel.findOne({
        email:email,
        password:password
    })
    
    if(user){
        const token = jwt.sign({
            id : user._id.toString()
        },JWT_SECRET)
        res.json({
            token : token
        })
    }else{
        res.status(403).json({
            message : "Wrong Credentials"
        })
    }
});

function auth(req, res, next) {
    try {
        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({ message: "Token missing" });
        }
        const decodedData = jwt.verify(token, JWT_SECRET);
        req.userId = decodedData.id;
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid token" });
    }
}

app.post("/todo", auth ,async function(req,res){
    const user = req.userId
    const title = req.body.title
    const done = req.body.done

    await TodoModel.create({
        userId : user,
        title : title,
        done : done
    })

    res.json({
        userId : user,
        title : title,
        done : done
    })
});

app.get("/todos", auth ,async function(req,res){
    const userId = req.userId
    const todos = await TodoModel.find({
        userId
    })
    if(todos){
        res.json(todos)
    }
});

app.listen(3000);