require("dotenv").config();
const bcrypt = require("bcrypt");
const express = require("express");
const { UserModel , TodoModel } = require("./db");
const app = express();
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
const { z } = require("zod");

const jwtSecret = process.env.JWT_SECRET;
const dbUrl = process.env.DB_URL;

mongoose.connect(dbUrl)

app.use(express.json());

app.post("/signup",async function(req,res){
    const requireBody = z.object({
        email : z.string().email(),
        name : z.string(),
        password : z.string().min(6)
    })

    const parseDatawithSuccess = requireBody.safeParse(req.body);

    if(!parseDatawithSuccess.success){
        res.json({
            message : "Incorrect Credentials",
            error : parseDatawithSuccess.error
        })
        return
    }

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    try{  
    const hashedPassword = await bcrypt.hash(password , 5);

    await UserModel.create({
        name : name,
        email : email,
        password : hashedPassword
    })

    res.json({
        message : "You are signed up"
    })
    }catch(e){
        res.json({
            message : "User already exists"
        })
    }

});

app.post("/signin",async function(req,res){
    const email = req.body.email;
    const password = req.body.password;

    const user = await UserModel.findOne({
        email:email
    })

    if(!user){
        res.status(403).json({
            message : "Wrong Email"
        })
        return 
    }

    const passwordMatch = await bcrypt.compare(password , user.password)
    
    if(passwordMatch){
        const token = jwt.sign({
            id : user._id.toString()
        },jwtSecret)
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
        const decodedData = jwt.verify(token, jwtSecret);
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

app.listen(process.env.PORT);