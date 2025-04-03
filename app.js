import express from 'express';
// const socketio = require('socket.io');
import http from 'http';
import {Server} from 'socket.io';
import cors from 'cors';
import { database,ref, onValue } from './utils/firebase.js';


const app = express();
app.use(cors());

const locationRef = ref(database, 'buses');


// while(true){

// }



const server = http.createServer(app);
const io = new Server(server,{
    cors:{
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection',(socket)=>{
    
    onValue(locationRef, (snapshot)=>{
        if(snapshot.exists()){
            // console.log(snapshot.val());
            const buses = snapshot.val();
            Object.keys(buses).forEach(busId => {
                io.emit('busLocation', {
                    busId: busId,
                    ...buses[busId]
                });
            });
        }
    })
    
    socket.on('userLocation',(data)=>{
        console.log("Location: ",data);
    })
    console.log("user connected",socket.id)
    // io.emit('busLocation', {latitude: 4.333, longitude: 5.666});
})


const PORT = 5500;


app.get('/', (req, res)=>{
    res.send('hello world');
})


server.listen(PORT, ()=>{
    console.log(`server is running on port  ${PORT}`);
    console.log(`http://localhost:${PORT}`);
})