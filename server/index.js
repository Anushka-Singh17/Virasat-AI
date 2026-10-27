const express = require("express");

const app = express();

app.use(express.json());

app.get("/" , (req , res) => {
    res.send("Servre is working")
});

const PORT = 5000;

app.listen(PORT , (req , res) => {
   console.log(`server is working on this port : http://localhost:${PORT}`)
})
