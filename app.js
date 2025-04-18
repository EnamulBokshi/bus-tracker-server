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

import { config } from 'dotenv';
config({path: '.env'})
const PORT = process.env.PORT || 5500;
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
            console.log("SSE Server closed");
        });

        await mcpServer.connect(transport);
        console.log("Connected to SSE");
    } catch (error) {
        console.error("Error in SSE endpoint: ", error);
        res.status(500).send("Internal Server Error");
    }
});
// endpoint to handle incoming messages
app.post("/messages", async (req, res) => {
    console.log("POST request to /messages");
    const sessionId = req.query.sessionId;
    const transport = sseTrasport[sessionId];
    if (!transport) {
        return res.status(404).send("Session not found");
    }
    await transport.handlePostMessage(req, res);
    console.log("Message sent to SSE");
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
    console.log("User connected:", socket.id);

    // Send all bus locations when a user connects
    const sendAllBusLocations = (snapshot) => {
        if (snapshot.exists()) {
            const buses = snapshot.val();
            
            // First emit an event to clear existing bus data
            socket.emit('clearBusLocations');
            
            // Then emit each bus location with a small delay to prevent race conditions
            Object.keys(buses).forEach((busId, index) => {
                setTimeout(() => {
                    socket.emit('busLocation', {
                        busId: busId,
                        ...buses[busId]
                    });
                }, index * 100); // 100ms delay between each bus emission
            });
            
            // Also broadcast all buses at once for clients that can handle it
            socket.emit('allBusLocations', buses);
        }
    };

    // Send initial bus locations
    onValue(locationRef, sendAllBusLocations);

    socket.on('userLocation', (data) => {
        console.log("User location received:", socket.id, data);
    });

    socket.on('disconnect', () => {
        console.log("User disconnected:", socket.id);
    });
})

app.get('/', (req, res) => {
    res.send('hello world');
})


server.listen(PORT, () => {
    console.log(`server is running on port  ${PORT}`);
    console.log(`http://localhost:${PORT}`);
})