import React, { useState } from 'react';
import axios from 'axios';

export default function QuestionForm({ setAnswer }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    try {
      const apiUrl = process.env.API_URL || '';
      const res = await axios.post(`${apiUrl}/api/ask`, { question });
      setAnswer(res.data.message || 'Sem resposta');
    } catch (err) {
      setAnswer('Erro ao buscar resposta');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
      <label>
        <b>Digite sua pergunta:</b>
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          style={{ width: '100%', marginTop: 8, padding: 8 }}
          placeholder="Ex: Qual o prazo do contrato?"
        />
      </label>
      <button type="submit" disabled={loading || !question.trim()} style={{ marginTop: 12 }}>
        Perguntar
      </button>
    </form>
  );
}
