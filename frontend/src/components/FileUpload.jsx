import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [textPreview, setTextPreview] = useState('');
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setTextPreview('');
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    if (f) {
      setFileUrl(URL.createObjectURL(f));
      if (f.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = () => setTextPreview(String(reader.result || '').slice(0, 20000));
        reader.readAsText(f);
      }
    } else {
      setFileUrl(null);
    }
  };

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const handleRemove = () => {
    setFile(null);
    setFileUrl(null);
    setTextPreview('');
    setStatus('');
  };

  // Remover do backend e Chroma
  const handleRemoveBackend = async () => {
    if (!file) return;
    setStatus('Removendo do servidor...');
    try {
      const apiUrl = process.env.API_URL || '';
      const res = await axios.post(`${apiUrl}/api/remove-file`, { filename: file.name });
      setStatus(res.data.message || 'Arquivo removido do servidor e Chroma!');
      handleRemove();
    } catch (err) {
      setStatus('Erro ao remover do servidor');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setStatus('Enviando...');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const apiUrl = process.env.API_URL || '';
      const res = await axios.post(`${apiUrl}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setStatus(res.data.message || 'Arquivo enviado!');
    } catch (err) {
      setStatus('Erro ao enviar arquivo');
    }
  };

  // Ícone por tipo
  function fileIcon(type) {
    if (!type && file?.name?.endsWith('.docx')) type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (!type && file?.name?.endsWith('.doc')) type = 'application/msword';
    if (type?.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type === 'text/plain') return '📑';
    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || type === 'application/msword') return '📝';
    return '📁';
  }

  return (
    <form onSubmit={handleUpload} style={{ marginBottom: 32 }}>
      <label style={{ display: 'block', marginBottom: 12 }}>
        <b>Selecione um arquivo PDF, Word, TXT ou imagem:</b>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleChange}
          style={{ marginTop: 8 }}
        />
      </label>
      {!file && (
        <div style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>
          Nenhum arquivo selecionado.
        </div>
      )}
      {file && (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: 16,
          marginBottom: 12,
          background: '#f9fafb',
          boxShadow: '0 2px 8px #0001',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 420
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{fileIcon(file.type)}</div>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{file.name}</div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
            {file.type || 'Tipo desconhecido'} • {(file.size / 1024).toFixed(1)} KB
          </div>
          {/* Imagem */}
          {file.type?.startsWith('image/') && fileUrl && (
            <img src={fileUrl} alt="Pré-visualização" style={{ maxWidth: 320, borderRadius: 8, marginBottom: 8 }} />
          )}
          {/* PDF */}
          {file.type === 'application/pdf' && fileUrl && (
            <iframe src={fileUrl} title="Pré-visualização do PDF" style={{ width: 320, height: 400, border: 'none', borderRadius: 8, background: '#fff', marginBottom: 8 }} />
          )}
          {/* TXT */}
          {file.type === 'text/plain' && (
            <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: 10, borderRadius: 8, maxHeight: 180, overflow: 'auto', marginBottom: 8 }}>{textPreview || 'Carregando...'}</pre>
          )}
          {/* DOC/DOCX */}
          {(file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword' || file.name.endsWith('.docx') || file.name.endsWith('.doc')) && (
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
              Pré-visualização de .doc/.docx não é suportada pelo navegador.<br />Envie o arquivo para extrair o texto.
            </div>
          )}
          {/* Fallback */}
          {!file.type && fileUrl && (
            <iframe src={fileUrl} title="Pré-visualização" style={{ width: 320, height: 180, border: 'none', borderRadius: 8, background: '#fff', marginBottom: 8 }} />
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" onClick={handleRemove} style={{ background: '#eee', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', color: '#444' }}>
              Remover local
            </button>
            <button type="button" onClick={handleRemoveBackend} style={{ background: '#ef4444', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', color: '#fff', fontWeight: 500 }}>
              Remover do servidor
            </button>
          </div>
        </div>
      )}
      <button type="submit" disabled={!file} style={{ marginTop: 8, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 500, cursor: file ? 'pointer' : 'not-allowed' }}>
        Enviar
      </button>
      <div style={{ marginTop: 8, color: '#555', minHeight: 20 }}>{status}</div>
    </form>
  );
}
