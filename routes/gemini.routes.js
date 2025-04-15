import { config } from "dotenv";

import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {Router} from 'express'
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

config();
const aiRouter = Router();



const MCP_BASE_URL = process.env.MCP_SERVER_URL;
const GeminiApiKey = process.env.GEMINI_API_KEY;


const ai = new GoogleGenAI({
    apiKey: GeminiApiKey,
})
const mcpClient = new Client({
    name: "mcpclient",
    version: "0.0.1",
});
const chatHistory = [];
const tools = [];



let isInitialized = false;
let isInitializing = false;
const initializeMCPClient = async () => {
    if (isInitialized) return;
    if (isInitialized || isInitializing) return;
    isInitializing = true;
    console.log("Initializing MCP Client");
    try {
        await mcpClient.connect(new SSEClientTransport(new URL(`${MCP_BASE_URL}/sse`)));
        console.log("Connected to MCP server");
        const listed = await mcpClient.listTools();
        console.log("Tools: ",JSON.stringify(listed.tools, null, 2));
        tools.push(...listed.tools.map((tool) => {
            return {
                name: tool.name || "Unnamed",
                description: tool.description || "No description",
                parameters: {
                    type: tool.inputSchema?.type,
                    properties: tool.inputSchema?.properties,
                    required: Array.isArray(tool.inputSchema?.required) ? tool.inputSchema.required : [],
                }
            }
        }))
        console.log("Tools initialized");
        isInitialized = true;

    } catch (error) {
        console.error("Error initializing MCP Client:", error);
        throw error;
    }

}


aiRouter.post('/generate', async (req, res)=>{
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Only POST allowed" })
    }
    console.log("Request body:", req.body);
    if (!req.body || !req.body.prompt) {
        return res.status(400).json({ error: "Prompt is required" })
    }
    const { prompt } = req.body;
    

    try {
        await initializeMCPClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                tools: [
                    {
                        functionDeclarations: tools,
                    }
                ]
            }
        })
        res.status(200).json({ response: response.text })
    }
    catch (error) {
        console.error("Error generating content:", error);
        return res.status(500).json({ error: "Error generating content" });
    }
})

export default aiRouter;
