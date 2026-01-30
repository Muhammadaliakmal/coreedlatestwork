import express from "express"
import cors from "cors"
import healthcheckroutes from "./routes/healthcheck.routes.js"


const app = express()


//------------------------------- middleware
app.use(express.json({limit:"16kb"}))// to make readable clients json.body
app.use(express.urlencoded({extended:true,limit:"16kb"}))// this will encode your url for safety reason
app.use(express.static("public"))// this tells express about never changing files/data


// ----------------------CORS
app.use(cors({
  origin:process.env.CORS_ORIGIN || "*",
  credentials:true,
  methods:["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
  allowedHeaders:["Content-Type","Authorization"],
}))


//----------------------------------API
app.get("/",(req,res)=>{
  res.end("Welcome to Project Management API")
})

// API ROUTES
app.use("/api/v1/health-check",healthcheckroutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

export default app