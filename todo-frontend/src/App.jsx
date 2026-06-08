import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:8000/api";

function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"

  // Auth form inputs
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "" });
  const [authError, setAuthError] = useState("");

  // Todo state
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  // Check if user is already logged in on app load
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch todos when user logs in
  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user]);

  async function checkAuth() {
    try {
      const res = await fetch(`${API}/auth/me`, {
        credentials: "include", // Send cookies
      });
      if (res.ok) {
        const json = await res.json();
        setUser(json.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setAuthError("");

    if (!authForm.name || !authForm.email || !authForm.password) {
      setAuthError("All fields are required");
      return;
    }

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Send/receive cookies
        body: JSON.stringify({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setAuthError(json.message);
        return;
      }

      setUser(json.user);
      setAuthForm({ email: "", password: "", name: "" });
    } catch (error) {
      setAuthError("Registration failed. Please try again.");
      console.error(error);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError("");

    if (!authForm.email || !authForm.password) {
      setAuthError("Email and password are required");
      return;
    }

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Send/receive cookies
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setAuthError(json.message);
        return;
      }

      setUser(json.user);
      setAuthForm({ email: "", password: "", name: "" });
    } catch (error) {
      setAuthError("Login failed. Please try again.");
      console.error(error);
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setTodos([]);
      setAuthForm({ email: "", password: "", name: "" });
      setAuthMode("login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  async function fetchTodos() {
    try {
      const res = await fetch(`${API}/todos`, {
        credentials: "include", // Send cookies with token
      });
      const json = await res.json();
      if (json.success) {
        setTodos(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    }
  }

  async function addTodo(e) {
    e.preventDefault();
    if (input.trim() === "") return;

    try {
      const res = await fetch(`${API}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: input.trim() }),
      });
      const json = await res.json();

      if (json.success) {
        setTodos((prev) => [...prev, json.data]);
        setInput("");
      }
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  }

  async function toggleTodo(id) {
    const todo = todos.find((t) => t._id === id);

    try {
      const res = await fetch(`${API}/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ done: !todo.done }),
      });
      const json = await res.json();

      if (json.success) {
        setTodos((prev) =>
          prev.map((t) => (t._id === id ? json.data : t))
        );
      }
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  }

  async function deleteTodo(id) {
    try {
      await fetch(`${API}/todos/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setTodos((prev) => prev.filter((todo) => todo._id !== id));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  }

  function startEdit(todo) {
    setEditId(todo._id);
    setEditText(todo.text);
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (editText.trim() === "") return;

    try {
      const res = await fetch(`${API}/todos/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: editText.trim() }),
      });
      const json = await res.json();

      if (json.success) {
        setTodos((prev) =>
          prev.map((todo) => (todo._id === editId ? json.data : todo))
        );
        setEditId(null);
        setEditText("");
      }
    } catch (error) {
      console.error("Failed to save todo:", error);
    }
  }

  function cancelEdit() {
    setEditId(null);
    setEditText("");
  }

  if (isLoading) {
    return <div className="container"><p>Loading...</p></div>;
  }

  // Show auth form if not logged in
  if (!user) {
    return (
      <div className="container">
        <h1>Todo App</h1>
        <p className="subtitle">{authMode === "login" ? "Login" : "Register"}</p>

        <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="auth-form">
          {authMode === "register" && (
            <input
              type="text"
              placeholder="Full Name"
              value={authForm.name}
              onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
              className="input"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={authForm.email}
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            className="input"
          />
          <input
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            className="input"
          />

          {authError && <p className="error">{authError}</p>}

          <button type="submit" className="add-btn">
            {authMode === "login" ? "Login" : "Register"}
          </button>
        </form>

        <p className="toggle-auth">
          {authMode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setAuthError("");
              setAuthForm({ email: "", password: "", name: "" });
            }}
            className="toggle-btn"
          >
            {authMode === "login" ? "Register" : "Login"}
          </button>
        </p>
      </div>
    );
  }

  // Show todo list if logged in
  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Todo List</h1>
          <p className="subtitle">Welcome, {user.name}!</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <form onSubmit={addTodo} className="form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new todo..."
          className="input"
        />
        <button type="submit" className="add-btn">Add</button>
      </form>

      {todos.length > 0 && (
        <p className="stats">
          {doneCount} done / {todos.length - doneCount} left / {todos.length} total
        </p>
      )}

      {todos.length === 0 ? (
        <p className="empty">No todos yet. Add one above!</p>
      ) : (
        <ul className="list">
          {todos.map((todo) => (
            <li key={todo._id} className={`item ${todo.done ? "done" : ""}`}>
              {editId === todo._id ? (
                <form onSubmit={saveEdit} className="edit-form">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="input edit-input"
                    autoFocus
                  />
                  <button type="submit" className="add-btn">Save</button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="add-btn cancel-btn"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span
                    onClick={() => toggleTodo(todo._id)}
                    className="text"
                  >
                    {todo.done ? "✅" : "⭕"} {todo.text}
                  </span>
                  <div className="actions">
                    <button
                      onClick={() => startEdit(todo)}
                      className="edit"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteTodo(todo._id)}
                      className="delete"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App; 