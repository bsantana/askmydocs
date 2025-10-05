import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import QuestionForm from './components/QuestionForm';
import ChatApp from './components/ChatApp';
import formatResponseSafe from './utils/formatResponseSafe';

export default function App() {
  const [answer, setAnswer] = useState('');

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
            <h1>AskMyDocs</h1>
            <FileUpload />
            <QuestionForm setAnswer={setAnswer} />
            {answer && (
              <div style={{ marginTop: 32 }}>
                <h3>Resposta da IA:</h3>
                <div
                  style={{ background: '#f6f6f6', padding: 16, borderRadius: 8 }}
                  dangerouslySetInnerHTML={{ __html: formatResponseSafe(answer) }}
                />
              </div>
            )}
          </div>
        } />
        <Route path="/chat" element={<ChatApp />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

