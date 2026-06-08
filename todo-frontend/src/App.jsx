import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:8000/api/todos"; 

function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");


  useEffect(() => {
    fetch(API)
      .then((res) => res.json())
      .then((json) => setTodos(json.data));
  }, []);

  //Add data to database 
  async function addTodo(e) {
    e.preventDefault();
    if (input.trim() === "") return;

    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.trim() }),
    });
    const json = await res.json();

    setTodos((prev) => [...prev, json.data]);
    setInput("");
  }

  // change done status in database 
  async function toggleTodo(id) {
    const todo = todos.find((t) => t._id === id);

    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !todo.done }),
    });
    const json = await res.json();

    setTodos((prev) =>
      prev.map((t) => (t._id === id ? json.data : t))
    );
  }

  // delete data from database
  async function deleteTodo(id) {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    setTodos((prev) => prev.filter((todo) => todo._id !== id));
  }

  // edit data in database
  function startEdit(todo) {
    setEditId(todo._id);
    setEditText(todo.text);
  }

  // save edited data to database
  async function saveEdit(e) {
    e.preventDefault();
    if (editText.trim() === "") return;

    const res = await fetch(`${API}/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editText.trim() }),
    });
    const json = await res.json();

    setTodos((prev) =>
      prev.map((todo) => (todo._id === editId ? json.data : todo))
    );
    setEditId(null);
    setEditText("");
  }

  // cancel edit mode
  function cancelEdit() {
    setEditId(null);
    setEditText("");
  }

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="container">
      <h1>Todo List</h1>
      <p className="subtitle">Basic todo app</p>

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

      {
      todos.length === 0 ? (
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