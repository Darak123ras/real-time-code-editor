
import './App.css'
// App.js or a context file
import io from "socket.io-client";
const socket = io("http://localhost:3001"); // replace with backend URL when deployed

socket.on("connect", () => {
  console.log("Connected to socket server:", socket.id);
});

function App() {

  return (
    <>
      
    </>
  )
}

export default App
