import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import formatResponseSafe from '../utils/formatResponseSafe';
import { Upload, FileText, Send } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ChatApp() {
  const [docs, setDocs] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  // Carrega lista de arquivos enviados
    // Carrega lista de arquivos enviados do backend
    useEffect(() => {
      async function fetchDocs() {
        try {
          const apiUrl = process.env.API_URL || '';
          const res = await axios.get(`${apiUrl}/api/docs`);
          if (Array.isArray(res.data.documents)) {
            setDocs(res.data.documents.map((doc, idx) => ({
              id: idx + 1,
              name: doc.originalname || doc.filename,
              status: 'done',
              ...doc
            })));
          }
        } catch {
          // Se erro, mantém lista vazia
        }
      }
      fetchDocs();
    }, []);

  // Carrega histórico de mensagens (opcional, pode ser mock)
  useEffect(() => {
    setMessages([
      { role: "assistant", content: "Olá! Envie uma pergunta sobre seus documentos." }
    ]);
  }, []);

  // Scroll automático no chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }]);
    setInput("");
    // Chama backend para resposta
    try {
      const apiUrl = process.env.API_URL || "";
  const res = await axios.post(`${apiUrl}/api/ask`, { question: input });
  const answer = res.data.answer || res.data.message || "(Sem resposta)";
  setMessages(m => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Erro ao buscar resposta." }]);
    }
  };

  // Upload handler igual ao FileUpload.jsx
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const tempId = Date.now();
    // Adiciona à lista com status 'processing'
    setDocs(docs => [
      ...docs,
      { id: tempId, name: file.name, status: 'processing' }
    ]);
    setUploadStatus('Enviando...');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const apiUrl = process.env.API_URL || '';
      const res = await axios.post(`${apiUrl}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus(res.data.message || 'Arquivo enviado!');
      // Atualiza status para 'done'
      setDocs(docs =>
        docs.map(doc =>
          doc.id === tempId ? { ...doc, status: 'done' } : doc
        )
      );
  toast.success(`Documento "${file.name}" carregado com sucesso!`);
    } catch {
      setUploadStatus('Erro ao enviar arquivo');
      // Atualiza status para erro
      setDocs(docs =>
        docs.map(doc =>
          doc.id === tempId ? { ...doc, status: 'erro' } : doc
        )
      );
  toast.error(`Erro ao enviar "${file.name}"!`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Função para remover documento do backend e da lista
  async function handleRemoveDoc(docId, docName) {
    try {
      const apiUrl = process.env.API_URL || '';
      // Busca o documento pelo id para pegar o originalname
      const doc = docs.find(d => d.id === docId);
      const originalname = doc?.originalname || docName;
      await axios.post(`${apiUrl}/api/remove-file`, { originalname });
      setDocs(docs => docs.filter(d => d.id !== docId));
    } catch {
      alert('Erro ao remover documento do servidor.');
    }
  }

  return (
    <div style={{height: '100vh', display: 'flex', fontFamily: 'sans-serif', background: '#f3f4f6'}}>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="colored" />
      {/* Sidebar */}
      <aside style={{width: 260, minWidth: 220, background: '#f9fafb', borderRight: '1px solid #e5e7eb', padding: 20, display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <h2 style={{fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 16}}>
          <FileText size={16} style={{marginRight: 4}} /> Documentos
        </h2>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          style={{display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: '#2563eb', color: '#fff', fontSize: 13, padding: '8px 14px', borderRadius: 6, border: 'none', marginBottom: 16, fontWeight: 500}}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          <Upload size={16} style={{marginRight: 2}} /> Adicionar arquivo
        </button>
        <div style={{ color: '#555', fontSize: 13, minHeight: 20, marginBottom: 8 }}>{uploadStatus}</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto'}}>
          {docs.length === 0 && <div style={{fontSize: 13, color: '#a1a1aa'}}>Nenhum arquivo enviado.</div>}
          {docs.map(doc => (
            <div key={doc.id} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, background: '#fff', boxShadow: '0 1px 4px #0001', fontSize: 13, marginBottom: 2}}>
              <FileText size={16} style={{color: '#64748b'}} />
              <span style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{doc.name}</span>
              {doc.status === 'done' && <span style={{color: '#16a34a', fontSize: 12}}>✓</span>}
              {doc.status === 'processing' && <span style={{color: '#eab308', fontSize: 12}}>…</span>}
              <button
                onClick={() => handleRemoveDoc(doc.id, doc.name)}
                style={{color: '#ef4444', fontWeight: 700, fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', marginLeft: 4}}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <main style={{flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0}}>
        <header style={{borderBottom: '1px solid #e5e7eb', padding: 20, fontWeight: 700, fontSize: 20, background: '#fff'}}>AskMyDocs</header>
        <div ref={chatRef} style={{flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18, background: '#f3f4f6'}}>
          {messages.map((msg, i) => (
            <div key={i} style={{display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'}}>
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: 18,
                  maxWidth: 480,
                  background: msg.role === 'user' ? '#2563eb' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#222',
                  boxShadow: msg.role === 'user' ? '0 2px 8px #2563eb22' : '0 1px 4px #0001',
                  fontSize: 15,
                  fontWeight: 400
                }}
                dangerouslySetInnerHTML={msg.role === 'assistant' ? { __html: formatResponseSafe(msg.content) } : undefined}
              >
                {msg.role === 'user' ? msg.content : null}
              </div>
            </div>
          ))}
        </div>
        <div style={{padding: 20, borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10, background: '#fff'}}>
          <input
            style={{flex: 1, border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 15, outline: 'none'}}
            placeholder="Faça sua pergunta..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage} style={{background: '#2563eb', color: '#fff', padding: '10px 14px', borderRadius: 10, border: 'none', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Send size={16} />
          </button>
        </div>
      </main>
    </div>
  );
}
