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

// Seed data for memory mode so the app isn't empty on first load
let memoContacts: any[] = [
  {
    _id: "demo-id-1",
    firstName: "Demo",
    lastName: "User",
    title: "Product Designer",
    organization: "vCard Pro",
    phone: "+1 234 567 890",
    email: "demo@example.com",
    address: "Infinite Loop, Cupertino, CA",
    website: "https://example.com",
    createdAt: new Date().toISOString()
  }
]; 

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

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

// Log initialization status
if (process.env.MONGODB_URI) {
  console.log("✔ MONGODB_URI environment variable detected.");
} else {
  console.warn("⚠ MONGODB_URI not found in environment. Running in Demo (Memory) Mode.");
}

async function getClient() {
  if (client) return client;
  const uri = getMongoUri();
  if (!uri) return null;
  
  try {
    console.log("Connecting to MongoDB...");
    client = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    // Test the connection
    await client.db().admin().ping();
    console.log("✔ Successfully connected to MongoDB");
    return client;
  } catch (err) {
    console.error("✘ MongoDB connection failed:", err);
    client = null;
    throw err;
  }
}

// Get configuration status for UI
app.get("/api/config", async (req, res) => {
  const uriExists = !!getMongoUri();
  let connected = false;
  let dbName = "N/A";
  
  if (uriExists) {
    try {
      const db = await getDb();
      if (db) {
        connected = true;
        dbName = db.databaseName;
      }
    } catch (e) {}
  }
  
  res.json({ 
    configured: uriExists, 
    mode: uriExists ? "database" : "memory",
    connected,
    dbName
  });
});

// Database helper
async function getDb() {
  try {
    const mongo = await getClient();
    if (!mongo) return null;
    return mongo.db(); 
  } catch (err) {
    console.error("getDb error:", err);
    return null;
  }
}

// Contacts API
app.get("/api/contacts", async (req, res) => {
  try {
    const uri = getMongoUri();
    if (uri) {
      const db = await getDb();
      if (!db) throw new Error("Could not connect to MongoDB. Check your MONGODB_URI.");
      const contacts = await db.collection("contacts").find().sort({ createdAt: -1 }).toArray();
      return res.json(contacts);
    }
    res.json(memoContacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/contacts", async (req, res) => {
  try {
    const uri = getMongoUri();
    if (uri) {
      const db = await getDb();
      if (!db) throw new Error("Could not connect to MongoDB. Check your MONGODB_URI.");
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
    const uri = getMongoUri();
    if (uri) {
      const db = await getDb();
      if (!db) throw new Error("Could not connect to MongoDB. Check your MONGODB_URI.");
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
    const uri = getMongoUri();
    if (uri) {
      const db = await getDb();
      if (!db) throw new Error("Could not connect to MongoDB. Check your MONGODB_URI.");
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
    const uri = getMongoUri();
    
    if (uri) {
      const db = await getDb();
      if (!db) throw new Error("Could not connect to MongoDB. Check your MONGODB_URI.");
      
      // Basic validation for ObjectId
      if (!id || id.length !== 24) {
        return res.status(400).json({ error: "Invalid contact ID format" });
      }
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

async function startServer() {
  await initVite();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    if (process.env.MONGODB_URI) {
      console.log("✔ MONGODB_URI detected.");
    } else {
      console.warn("⚠ Running in Demo Mode (Memory). Set MONGODB_URI for persistent storage.");
    }
  });
}

startServer();

export default app;
