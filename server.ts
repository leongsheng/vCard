import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

// Global variable to store the MongoDB URI for the current session
// In a production app, this would be managed per-user in a session or database.
let mogoUri: string | null = process.env.MONGODB_URI || null;
let client: MongoClient | null = null;

async function getClient() {
  if (!mogoUri) throw new Error("MongoDB URI not configured. Please go to the Configuration tab.");
  if (client) return client;
  
  client = new MongoClient(mogoUri);
  await client.connect();
  return client;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Save credentials
  app.post("/api/config", async (req, res) => {
    const { uri } = req.body;
    if (!uri) return res.status(400).json({ error: "URI is required" });
    
    try {
      const testClient = new MongoClient(uri);
      await testClient.connect();
      await testClient.db().admin().ping();
      await testClient.close();
      
      mogoUri = uri;
      // Reset existing client if any
      if (client) {
        await client.close();
        client = null;
      }
      
      res.json({ success: true, message: "Connected to MongoDB successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get configuration status
  app.get("/api/config", (req, res) => {
    res.json({ configured: !!mogoUri });
  });

  // Contacts API
  app.get("/api/contacts", async (req, res) => {
    try {
      const mongo = await getClient();
      const db = mongo.db("vcard_pro");
      const contacts = await db.collection("contacts").find().toArray();
      res.json(contacts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const mongo = await getClient();
      const db = mongo.db("vcard_pro");
      const result = await db.collection("contacts").insertOne({
        ...req.body,
        createdAt: new Date()
      });
      res.json({ id: result.insertedId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/contacts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const mongo = await getClient();
      const db = mongo.db("vcard_pro");
      await db.collection("contacts").updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const mongo = await getClient();
      const db = mongo.db("vcard_pro");
      await db.collection("contacts").deleteOne({ _id: new ObjectId(id) });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Basic validation for ObjectId
      if (!id || id.length !== 24) {
        return res.status(400).json({ error: "Invalid contact ID format" });
      }

      const mongo = await getClient();
      const db = mongo.db("vcard_pro");
      const contact = await db.collection("contacts").findOne({ _id: new ObjectId(id) });
      if (!contact) return res.status(404).json({ error: "Contact not found" });
      res.json(contact);
    } catch (error: any) {
      console.error("Error fetching contact:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
