import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import CodeEditor from '../components/CodeEditor/CodeEditor';
import "./EditorPage.css";

const EditorPage = () => {
  const [code, setCode] = useState('// Start coding...');
  const [language, setLanguage] = useState('javascript');
  const { user, logout } = useAuth();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for code updates from other users
    socket.on('code-update', (newCode) => {
      setCode(newCode);
    });

    // Listen for language changes from other users
    socket.on('language-change', (newLanguage) => {
      setLanguage(newLanguage);
    });

    return () => {
      socket.off('code-update');
      socket.off('language-change');
    };
  }, [socket]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit('code-update', newCode);
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit('language-change', newLanguage);
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2>Room: {user?.room}</h2>
        <div className='options'>
          <select onChange={handleLanguageChange} value={language}>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </select>
          <button onClick={logout}>Leave Room</button>
        </div>
      </div>
      <CodeEditor code={code} setCode={handleCodeChange} language={language} />
    </div>
  );
};

export  default EditorPage;