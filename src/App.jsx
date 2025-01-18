import React, { useEffect, useState } from "react";
import "./App.css";
import githubLogo from "/github.png";
import reactLogo from "/react.svg";
import supabase from "./utils/supabase";
import supabaseLogo from "/supabase.svg";
import vercelLogo from "/vercel.svg";
import viteLogo from "/vite.svg";

function App() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    getTodos();
  }, []);

  async function getTodos() {
    const { data } = await supabase.from("todos").select();

    setTodos(data);
  }

  return (
    <>
      <div>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://supabase.com/" target="_blank">
          <img
            src={supabaseLogo}
            className="logo supabase"
            alt="React Supabase"
          />
        </a>
        <a href="https://vercel.com/" target="_blank">
          <img src={vercelLogo} className="logo vercel" alt="React Supabase" />
        </a>
      </div>
      <h1>React + Vite + Supabase + Vercel</h1>
      <h2>
        Template Project available on{" "}
        <a
          href="https://github.com/juancarlosjr97/react-vite-supabase-vercel"
          target="_blank"
        >
          <img src={githubLogo} className="logo github" alt="GitHub logo" />
        </a>
      </h2>

      <div>
        {todos?.map((todo) => (
          <li key={todo.id}>{todo.task}</li>
        ))}
      </div>
      <p className="read-the-docs">Click on logos to learn more.</p>
    </>
  );
}

export default App;
