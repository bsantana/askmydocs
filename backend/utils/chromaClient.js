// Remove todos os documentos do ChromaDB
export async function deleteAllFromChroma() {
  const client = new ChromaClient({ path: 'http://localhost:8000' });
  const embedFn = new DefaultEmbeddingFunction();
  const collectionName = 'askmydocs';
  const collection = await client.getCollection({ name: collectionName, embeddingFunction: embedFn });
  const results = await collection.get();
  if (results.ids && results.ids.length) {
    await collection.delete({ ids: results.ids });
  }
}
import { ChromaClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

export async function listIndexedDocuments() {
  const client = new ChromaClient({ path: 'http://localhost:8000' });
  const embedFn = new DefaultEmbeddingFunction();
  const collectionName = 'askmydocs';
  const collection = await client.getCollection({ name: collectionName, embeddingFunction: embedFn });
  const results = await collection.get();
  return results; // { ids, documents, metadatas }
}

export async function queryChroma(query, topK = 10) {
  const client = new ChromaClient({ path: 'http://localhost:8000' });
  const embedFn = new DefaultEmbeddingFunction();
  const collectionName = 'askmydocs';
  let collection;
  try {
    collection = await client.getCollection({ name: collectionName, embeddingFunction: embedFn });
  } catch (err) {
    return [];
  }
  // Busca semântica usando o embedding da pergunta
  const results = await collection.query({
    queryTexts: [query],
    nResults: topK
  });
  // Retorna array de objetos: { text, page, originalname }
  const docs = results.documents?.[0] || [];
  console.log('Chroma query results:', results);
  const metas = results.metadatas?.[0] || [];
  return docs.map((text, i) => ({
    text,
    page: metas[i]?.page,
    originalname: metas[i]?.originalname
  }));
}

export async function indexDocument({ id, text, metadata }) {
  const client = new ChromaClient({ path: 'http://localhost:8000' });
  const embedFn = new DefaultEmbeddingFunction();
  const collectionName = 'askmydocs';
  let collection;
  try {
    collection = await client.getCollection({ name: collectionName, embeddingFunction: embedFn });
  } catch (err) {
    collection = await client.createCollection({
      name: collectionName,
      embeddingFunction: embedFn
    });
  }
  await collection.add({
    ids: [id],
    documents: [text],
    metadatas: [metadata]
  });
}

export async function removeFileFromChroma(filename) {
  const client = new ChromaClient({ path: 'http://localhost:8000' });
  const embedFn = new DefaultEmbeddingFunction();
  const collectionName = 'askmydocs';
  const collection = await client.getCollection({ name: collectionName, embeddingFunction: embedFn });
  const results = await collection.get();
  const idsToRemove = [];
  results.ids.forEach((id, idx) => {
    const meta = results.metadatas[idx];
    if (meta.originalname === filename || id.startsWith(filename)) {
      idsToRemove.push(id);
    }
  });
  if (idsToRemove.length) {
    await collection.delete({ ids: idsToRemove });
  }
}
