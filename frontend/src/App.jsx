import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5001";

function App() {
  const [posts, setPosts] = useState([]);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingUsername, setEditingUsername] = useState("");
  const [editingMessage, setEditingMessage] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const response = await axios.get(`${API_URL}/posts`);
      setPosts(response.data);
      setFilter("all");
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }

  async function fetchRecentPosts(range) {
    try {
      if (range === "all") {
        fetchPosts();
        return;
      }

      const response = await axios.get(`${API_URL}/posts/recent/${range}`);
      setPosts(response.data);
      setFilter(range);
    } catch (error) {
      console.error("Error fetching recent posts:", error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!username.trim() || !message.trim()) {
      alert("Please enter both a username and message.");
      return;
    }

    try {
      await axios.post(`${API_URL}/posts`, {
        username,
        message,
      });

      setUsername("");
      setMessage("");
      fetchPosts();
    } catch (error) {
      console.error("Error adding post:", error);
    }
  }

  function startEditing(post) {
    setEditingId(post.id);
    setEditingUsername(post.username);
    setEditingMessage(post.message);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingUsername("");
    setEditingMessage("");
  }

  async function saveEdit(id) {
    if (!editingUsername.trim() || !editingMessage.trim()) {
      alert("Username and message cannot be empty.");
      return;
    }

    try {
      await axios.put(`${API_URL}/posts/${id}`, {
        username: editingUsername,
        message: editingMessage,
      });

      cancelEditing();
      fetchPosts();
    } catch (error) {
      console.error("Error updating post:", error);
    }
  }

  async function deletePost(id) {
    try {
      await axios.delete(`${API_URL}/posts/${id}`);
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  }

  function formatDate(createdAt) {
    if (!createdAt) return "Unknown time";

    const date = createdAt._seconds
      ? new Date(createdAt._seconds * 1000)
      : new Date(createdAt);

    return date.toLocaleString();
  }

  return (
    <div className="app">
      <h1>Message Board</h1>
      <p className="subtitle">Post a message. That&apos;s it.</p>

      <form onSubmit={handleSubmit} className="post-form">
        <input
          type="text"
          placeholder="Your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <textarea
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button type="submit">Post Message</button>
      </form>

      <div className="filters">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => fetchRecentPosts("all")}
        >
          All
        </button>

        <button
          className={filter === "hour" ? "active" : ""}
          onClick={() => fetchRecentPosts("hour")}
        >
          Last Hour
        </button>

        <button
          className={filter === "day" ? "active" : ""}
          onClick={() => fetchRecentPosts("day")}
        >
          Last Day
        </button>

        <button
          className={filter === "week" ? "active" : ""}
          onClick={() => fetchRecentPosts("week")}
        >
          Last Week
        </button>
      </div>

      <div className="posts">
        {posts.length === 0 ? (
          <p className="empty">No messages yet.</p>
        ) : (
          posts.map((post) => (
            <div className="post-card" key={post.id}>
              {editingId === post.id ? (
                <>
                  <input
                    type="text"
                    value={editingUsername}
                    onChange={(e) => setEditingUsername(e.target.value)}
                  />

                  <textarea
                    value={editingMessage}
                    onChange={(e) => setEditingMessage(e.target.value)}
                  />

                  <div className="actions">
                    <button onClick={() => saveEdit(post.id)}>Save</button>
                    <button onClick={cancelEditing} className="secondary">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="post-header">
                    <h3>{post.username}</h3>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>

                  <p>{post.message}</p>

                  <div className="actions">
                    <button onClick={() => startEditing(post)}>Edit</button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="danger"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;