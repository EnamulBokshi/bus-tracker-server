import express from 'express';
// const socketio = require('socket.io');
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { database, ref, onValue } from './utils/firebase.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from 'zod'
import aiRouter from './routes/gemini.routes.js';

const app = express();
app.use(cors());
app.use(express.json());

    
app.use('/ai', aiRouter);



const locationRef = ref(database, 'buses');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const mcpServer = new McpServer({
    name: 'Bus Location Server',
    description: 'Server for bus location tracking',
    version: '1.0.0',
})


// Function to retrieve all buses from Firebase
const getAllBuses = async () => {
    return new Promise((resolve, reject) => {
        onValue(locationRef, (snapshot) => {
            if (snapshot.exists()) {
                const buses = snapshot.val();
                resolve(buses);
            } else {
                resolve({});
            }
        }, (error) => {
            reject(error);
        });
    });
};


const sseTrasport = {};

mcpServer.tool(
    "retiveBusLocation",
    "Get the location of all buses",
    {
        name: z.string(),
        driver: z.string(),
    },
    async ({ driver, name }) => {
        const buses = await getAllBuses();
        const busesParsed = Object.values(buses);

        const bus = busesParsed.find(
            (b) =>
                b.driver.toLowerCase() === driver.toLowerCase() ||
                b.busName.toLowerCase() === name.toLowerCase()
        );

        return [
            {
                type: "text",
                text: bus
                    ? `Bus Name: ${bus.busName}, Driver: ${bus.driver}, Bus Number: ${bus.busNumber}, Route: ${bus.route}, Current Location: ${bus.currentLocation.latitude}, ${bus.currentLocation.longitude}, Passengers: ${bus.passengers}, Status: ${bus.status}`
                    : "No bus found"
            }
        ];
    }
);

app.get("/sse", async (req, res) => {
    try {
        console.log("SSE endpoint hit");
        const transport = new SSEServerTransport('/messages', res);
        sseTrasport[transport.sessionId] = transport;

        res.on("close", () => {
            delete sseTrasport[transport.sessionId];
        });

        await mcpServer.connect(transport);
        console.log("Connected to SSE");
    } catch (error) {
        console.error("Error in SSE endpoint:", error);
        res.status(500).send("Internal Server Error");
    }
});
// endpoint to handle incoming messages
app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = sseTrasport[sessionId];
    if (!transport) {
        return res.status(404).send("Session not found");
    }
    await transport.handlePostMessage(req, res);
})

// endpoint to retrieve all buses
app.get('/buses', async (req, res) => {
    try {
        const buses = await getAllBuses();
        res.json(buses);
    } catch (error) {
        res.status(500).send('Error retrieving buses: ' + error.message);
    }
});

// socket.io connection
io.on('connection', (socket) => {

    onValue(locationRef, (snapshot) => {
        if (snapshot.exists()) {
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

    socket.on('userLocation', (data) => {
        console.log("Location: ", data);
    })
    console.log("user connected", socket.id)
    // io.emit('busLocation', {latitude: 4.333, longitude: 5.666});
})


const PORT = 5500;


app.get('/', (req, res) => {
    res.send('hello world');
})


server.listen(PORT, () => {
    console.log(`server is running on port  ${PORT}`);
    console.log(`http://localhost:${PORT}`);
})