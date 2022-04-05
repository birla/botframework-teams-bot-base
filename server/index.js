const path = require("path");
const express = require("express");
const cors = require("cors");

const server = express();

server.use(cors());
server.use(express.json());
server.use(
  express.urlencoded({
    extended: true,
  })
);

server.use("/api", require("./bot"));

server.listen(process.env.PORT, () => {
  console.log(`Server listening on http://localhost:1500`);
});
