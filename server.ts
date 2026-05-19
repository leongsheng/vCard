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
let memoContacts: any[] = []; // In-memory fallback

const app = express();
const PORT = 3000;

app.use(express.json());

async function initVite() {
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
}

// API Routes

// Helper to ensure mogoUri is always current
const getMongoUri = () => process.env.MONGODB_URI || mogoUri;

// Save credentials
app.post("/api/config", async (req, res) => {
  const { uri } = req.body;
  if (!uri) return res.status(400).json({ error: "URI is required" });
  
  try {
    const testClient = new MongoClient(uri);
    await testClient.connect();
    await testClient.db().admin().ping();
    await testClient.close();
    
    // In a serverless env, this only persists for the CURRENT instance lifecycle.
    // Explicitly warn the user to use Vercel Env Vars for permanent storage.
    mogoUri = uri;
    
    // Reset existing client if any
    if (client) {
      await client.close();
      client = null;
    }
    
    res.json({ 
      success: true, 
      message: "Connected locally. NOTE: For Vercel deployments, please add MONGODB_URI to your Vercel Project Settings for persistent connection." 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get configuration status
app.get("/api/config", (req, res) => {
  res.json({ configured: true, mode: getMongoUri() ? "database" : "memory" });
});

async function getClient() {
  if (client) return client;
  const uri = getMongoUri();
  if (!uri) return null;
  client = new MongoClient(uri);
  await client.connect();
  return client;
}

// Contacts API
app.get("/api/contacts", async (req, res) => {
  try {
    const mongo = await getClient();
    if (mongo) {
      const db = mongo.db("vcard_pro");
      const contacts = await db.collection("contacts").find().toArray();
      return res.json(contacts);
    }
    res.json(memoContacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/contacts", async (req, res) => {
  try {
    const mongo = await getClient();
    if (mongo) {
      const db = mongo.db("vcard_pro");
      const result = await db.collection("contacts").insertOne({
        ...req.body,
        createdAt: new Date()
      });
      return res.json({ id: result.insertedId });
    }
    
    const newContact = { 
      ...req.body, 
      _id: new ObjectId().toString(), 
      createdAt: new Date() 
    };
    memoContacts.push(newContact);
    res.json({ id: newContact._id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const mongo = await getClient();
    if (mongo) {
      const db = mongo.db("vcard_pro");
      await db.collection("contacts").updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );
      return res.json({ success: true });
    }

    const index = memoContacts.findIndex(c => c._id === id);
    if (index !== -1) {
      memoContacts[index] = { ...memoContacts[index], ...req.body };
      return res.json({ success: true });
    }
    res.status(404).json({ error: "Contact not found" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const mongo = await getClient();
    if (mongo) {
      const db = mongo.db("vcard_pro");
      await db.collection("contacts").deleteOne({ _id: new ObjectId(id) });
      return res.json({ success: true });
    }

    memoContacts = memoContacts.filter(c => c._id !== id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const mongo = await getClient();
    if (mongo) {
      // Basic validation for ObjectId
      if (!id || id.length !== 24) {
        return res.status(400).json({ error: "Invalid contact ID format" });
      }
      const db = mongo.db("vcard_pro");
      const contact = await db.collection("contacts").findOne({ _id: new ObjectId(id) });
      if (!contact) return res.status(404).json({ error: "Contact not found" });
      return res.json(contact);
    }

    const contact = memoContacts.find(c => c._id === id);
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json(contact);
  } catch (error: any) {
    console.error("Error fetching contact:", error);
    res.status(500).json({ error: error.message });
  }
});

// Init Vite and start
if (process.env.NODE_ENV !== "production") {
  initVite().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
} else {
  // Static serving for production
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  // Routes for SPA
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });

  // Start listening (Required for Cloud Run)
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
