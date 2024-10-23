import express from "express";
import cors from "cors";


const app = express();

app.use(cors());
app.use(express.json());


app.get('/',(req,res)=>{
    res.send('Hello World!');
})

app.post('start-ide' , (req,res)=>{

    res.send('Hello World!');
})

app.listen(8081, ()=>{
    console.log('Listening on port 8081');
})