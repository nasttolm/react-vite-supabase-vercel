import "./App.css";
import reactLogo from "/react.svg";
import supabaseLogo from "/supabase.svg";
import Todos from "./components/Todos";
import vercelLogo from "/vercel.svg";
import viteLogo from "/vite.svg";

function App() {
  return (
    <>
      <h1>React + Vite + Supabase + Vercel</h1>

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
        <p className="read-the-docs">Click on logos to learn more.</p>
      </div>
      <Todos />
    </>
  );
}

export default App;
