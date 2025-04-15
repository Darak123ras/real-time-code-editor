import React from 'react';
import Editor from '@monaco-editor/react';
import './CodeEditor.css';

const CodeEditor = ({ code, setCode, language }) => {
  return (
    <div className='container' >
      <Editor
        height="100%"
        language={language.toLowerCase()} 
        value={code}
        theme="vs-dark"
        onChange={setCode} 
        options={{
          fontSize: 14,
          automaticLayout: true,
          minimap: { enabled: false }
        }}
      />
    </div>
  );
};

export default CodeEditor;
