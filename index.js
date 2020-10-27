const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const PORT = process.env.PORT || 4000;
const cors = require("cors");

//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const rooms = {};

//@route create room
//Body: 
//  roomName: string
app.post("/createroom", (req, res) => {
  if (rooms[req.body.roomName] != null) {
    return res.json({
      data: {
        roomName: `${req.body.roomName}`,
        msg: "duplicate"
      }
    });
  }
  rooms[req.body.roomName] = { users: [] };
  res.json({
    data: {
      roomName: `${req.body.roomName}`,
      msg: "created"
    }
  });
});

//socket connection established
io.on("connection", socket => {
  //subscribe to room
  const subscribe = room => {
    io.in(room).clients((error, clients) => {
      if (error) {
        throw error;
      }

      socket.join(room);
      rooms[room] = { users: [...clients] };

      if (clients.length == 1) socket.emit("create_host");
    });
  };

  //siganl offer to remote
  const sendOffer = (room, offer) => {
    console.log("sendOffer called");
    socket.to(room).broadcast.emit("new_offer", offer);
  };

  //signal answer to remote
  const sendAnswer = (room, data) => {
    console.log("sendAnswer called");
    socket.to(room).broadcast.emit("new_answer", data);
  };

  //user disconnected
  const user_disconnected = room => {
    socket.to(room).broadcast.emit("end");
  };
  
  //events
  socket.on("subscribe", subscribe);
  socket.on("offer", sendOffer);
  socket.on("answer", sendAnswer);
  socket.on("user_disconnected", user_disconnected);
});

server.listen(PORT, () => {
  console.log(`server started on PORT -> ${PORT}`);
});
