import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import './CodeEditor.css';

const CodeEditor = ({ language = 'javascript' }) => {
  const editorRef = useRef(null);

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
  }

  return (
    <Editor
      height="90vh"
      language={language}
      theme="vs-dark"
      onMount={handleEditorDidMount}
      options={{
        fontSize: 14,
        automaticLayout: true,
        minimap: { enabled: false }
      }}
    />
  );
};

export default CodeEditor;