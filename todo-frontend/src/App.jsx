import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:8000/api";

// builds the Authorization header for every protected request
function authHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

export default function App() {
  // auth state
  const [user, setUser] = useState(null); // logged-in user object
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");

  // todo list state
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ text: "", dueDate: "" });

  // filter & search state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // "" | "pending" | "in-progress" | "complete"
  const [sortBy, setSortBy] = useState(""); // "" | "dueDate" | "oldest"

  // check for logged-in user
  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await fetch(`${API}/auth/me`, {
          credentials: "include",
        });
        const json = await res.json();
        if (json.success) setUser(json.user);
      } catch {
        // ignore restore failure
      }
    }

    restoreSession();
  }, []);

  // load todos whenever user or filters change
  useEffect(() => {
    if (!user) return; // not logged in — don't fetch

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (filterStatus) params.append("status", filterStatus);
    if (sortBy) params.append("sortBy", sortBy);

    fetch(`${API}/todos?${params.toString()}`, {
      credentials: "include",
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTodos(json.data);
      });
  }, [user, search, filterStatus, sortBy]);

  // authentication handler for both login and registration

  async function handleAuth(e) {
    e.preventDefault();
    setAuthError("");

    const endpoint = authMode === "login" ? "login" : "register";
    const body =
      authMode === "login"
        ? { email: authForm.email, password: authForm.password }
        : {
            name: authForm.name,
            email: authForm.email,
            password: authForm.password,
          };

    try {
      const res = await fetch(`${API}/auth/${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!json.success) {
        setAuthError(json.message);
        return;
      }

      setUser(json.user);
      setAuthForm({ name: "", email: "", password: "" });
    } catch {
      setAuthError("Something went wrong. Is your server running?");
    }
  }

  async function logout() {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setTodos([]);
  }

  // todo handlers

  async function addTodo(e) {

    e.preventDefault();
    if (input.trim() === "") return;

    const res = await fetch(`${API}/todos`, {

      method: "POST",
      credentials: "include",
      headers: authHeaders(),
      body: JSON.stringify({
        text: input.trim(),
        dueDate: dueDate || null,
      }),
    });

    const json = await res.json();

    if (json.success) {
      setTodos((prev) => [json.data, ...prev]); // add to top of list
      setInput("");
      setDueDate("");
    }
  }

  async function toggleTodo(id) {

    const todo = todos.find((t) => t._id === id);

    const res = await fetch(`${API}/todos/${id}`, {

      method: "PUT",
      credentials: "include",
      headers: authHeaders(),
      body: JSON.stringify({ done: !todo.done }),

    });

    const json = await res.json();
    if (json.success) {
      setTodos((prev) => prev.map((t) => (t._id === id ? json.data : t)));
    }
  }

  async function updateStatus(id, status) {

    const doneVal = status === "complete";

    const res = await fetch(`${API}/todos/${id}`, {

      method: "PUT",
      credentials: "include",
      headers: authHeaders(),
      body: JSON.stringify({ status, done: doneVal }),
    });

    const json = await res.json();

    if (json.success) {
      setTodos((prev) => prev.map((t) => (t._id === id ? json.data : t)));
    }
  }

  async function deleteTodo(id) {

    const res = await fetch(`${API}/todos/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: authHeaders(),
    });

    const json = await res.json();

    if (json.success) {
      setTodos((prev) => prev.filter((t) => t._id !== id));
    }
  }

  function startEdit(todo) {

    setEditId(todo._id);
    setEditData({
      text: todo.text,
      dueDate: todo.dueDate ? todo.dueDate.split("T")[0] : "",
    });
  }

  async function saveEdit(e) {

    e.preventDefault();
    if (editData.text.trim() === "") return;

    const res = await fetch(`${API}/todos/${editId}`, {
      method: "PUT",
      credentials: "include",
      headers: authHeaders(),
      body: JSON.stringify({
        text: editData.text.trim(),
        dueDate: editData.dueDate || null,
      }),
    });

    const json = await res.json();

    if (json.success) {
      setTodos((prev) => prev.map((t) => (t._id === editId ? json.data : t)));
      setEditId(null);
    }
  }

  function cancelEdit() {
    setEditId(null);
  }

  function clearFilters() {
    setSearch("");
    setFilterStatus("");
    setSortBy("");
  }

  // helper to format date and check if it's overdue

  function formatDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = date < today;
    const formatted = date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return { formatted, isOverdue };
  }

  const doneCount = todos.filter((t) => t.done).length;

  // render login/register form if not authenticated

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>📝 Todo App</h1>
          <p className="auth-subtitle">
            {authMode === "login"
              ? "Login to your account"
              : "Create an account"}
          </p>

          <form onSubmit={handleAuth} className="auth-form">
            {authMode === "register" && (
              <input
                type="text"
                placeholder="Your name"
                value={authForm.name}
                onChange={(e) =>
                  setAuthForm({ ...authForm, name: e.target.value })
                }
                className="input"
              />
            )}
            <input
              type="email"
              placeholder="Email address"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({ ...authForm, email: e.target.value })
              }
              className="input"
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
              className="input"
            />

            {authError && <p className="auth-error">{authError}</p>}

            <button type="submit" className="add-btn full-width">
              {authMode === "login" ? "Login" : "Register"}
            </button>
          </form>

          <p className="auth-switch">
            {authMode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              className="link-btn"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setAuthError("");
              }}
            >
              {authMode === "login" ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // render todo list if authenticated
  return (
    <div className="container">
      {/* ── HEADER ── */}
      <div className="header">
        <div>
          <h1>📝 Todo List</h1>
          <p className="subtitle">Welcome, {user.name}</p>
        </div>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>

      {/* ── ADD TODO FORM ── */}
      <form onSubmit={addTodo} className="form">
        <div className="form-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a new todo..."
            className="input"
          />
          <button type="submit" className="add-btn">
            Add
          </button>
        </div>
        <div className="form-row form-extra">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="input input-sm"
            title="Due date"
          />
        </div>
      </form>

      {/* ── SEARCH + FILTERS ── */}
      <div className="filters">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search todos..."
          className="input"
        />
        <div className="filter-row">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input input-sm"
          >
            <option value="">All status</option>
            <option value="pending">⭕ Pending</option>
            <option value="in-progress">🔄 In-Progress</option>
            <option value="complete">✅ Complete</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input input-sm"
          >
            <option value="">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="dueDate">Sort: Due date</option>
          </select>
          {(search || filterStatus || sortBy) && (
            <button onClick={clearFilters} className="clear-btn">
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* ── STATS ── */}
      {todos.length > 0 && (
        <p className="stats">
          {doneCount} done · {todos.length - doneCount} left · {todos.length}{" "}
          total
        </p>
      )}

      {/* ── TODO LIST ── */}
      {todos.length === 0 ? (
        <p className="empty">No todos found. Add one above!</p>
      ) : (
        <ul className="list">
          {todos.map((todo) => {
            const due = formatDate(todo.dueDate);
            return (
              <li key={todo._id} className={`item ${todo.done ? "done" : ""}`}>
                {editId === todo._id ? (
                  /* ── EDIT FORM ── */
                  <form onSubmit={saveEdit} className="edit-form">
                    <input
                      type="text"
                      value={editData.text}
                      onChange={(e) =>
                        setEditData({ ...editData, text: e.target.value })
                      }
                      className="input edit-input"
                      autoFocus
                    />
                    <div className="form-row form-extra">
                      <input
                        type="date"
                        value={editData.dueDate}
                        onChange={(e) =>
                          setEditData({ ...editData, dueDate: e.target.value })
                        }
                        className="input input-sm"
                      />
                    </div>
                    <div className="form-row">
                      <button type="submit" className="add-btn">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="add-btn cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ── TODO DISPLAY ── */
                  <div className="item-content">
                    <span onClick={() => toggleTodo(todo._id)} className="text">
                      {todo.done ? "✅" : "⭕"} {todo.text}
                    </span>

                    <div className="item-meta">
                      {due && (
                        <span
                          className={`due-date ${due.isOverdue && !todo.done ? "overdue" : ""}`}
                        >
                          📅 {due.formatted}{" "}
                          {due.isOverdue && !todo.done ? "⚠️" : ""}
                        </span>
                      )}
                    </div>

                    <div className="actions">
                      <select
                        value={
                          todo.status || (todo.done ? "complete" : "pending")
                        }
                        onChange={(e) => updateStatus(todo._id, e.target.value)}
                        className="input input-sm"
                        title="Status"
                      >
                        <option value="pending">⭕ Pending</option>
                        <option value="in-progress">🔄 In-Progress</option>
                        <option value="complete">✅ Complete</option>
                      </select>
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
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
