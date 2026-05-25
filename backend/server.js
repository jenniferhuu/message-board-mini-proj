const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./firebase");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const postsCollection = db.collection("posts");

app.get("/", (req, res) => {
  res.send("Message Board API is running!");
});

app.get("/posts", async (req, res) => {
  try {
    const snapshot = await postsCollection.orderBy("createdAt", "desc").get();

    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(posts);
  } catch (error) {
    console.error("Error getting posts:", error);
    res.status(500).json({ error: "Failed to get posts" });
  }
});

app.get("/posts/recent/:range", async (req, res) => {
  try {
    const { range } = req.params;

    const now = new Date();
    let startTime;

    if (range === "hour") {
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
    } else if (range === "day") {
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === "week") {
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      return res.status(400).json({
        error: "Invalid range. Use hour, day, or week.",
      });
    }

    const snapshot = await postsCollection
      .where("createdAt", ">=", startTime)
      .orderBy("createdAt", "desc")
      .get();

    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(posts);
  } catch (error) {
    console.error("Error getting recent posts:", error);
    res.status(500).json({ error: "Failed to get recent posts" });
  }
});

app.post("/posts", async (req, res) => {
  try {
    const { username, message } = req.body;

    if (!username || !message) {
      return res.status(400).json({
        error: "Username and message are required",
      });
    }

    const newPost = {
      username,
      message,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await postsCollection.add(newPost);

    res.status(201).json({
      id: docRef.id,
      ...newPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

app.put("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, message } = req.body;

    if (!username || !message) {
      return res.status(400).json({
        error: "Username and message are required",
      });
    }

    const postRef = postsCollection.doc(id);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: "Post not found" });
    }

    const updatedPost = {
      username,
      message,
      updatedAt: new Date(),
    };

    await postRef.update(updatedPost);

    res.json({
      id,
      ...postDoc.data(),
      ...updatedPost,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Failed to update post" });
  }
});

app.delete("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const postRef = postsCollection.doc(id);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: "Post not found" });
    }

    await postRef.delete();

    res.json({ message: "Post deleted successfully", id });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});