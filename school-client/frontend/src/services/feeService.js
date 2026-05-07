import api from './api';

// Fee API calls for the client portal.
// Deposits and withdrawals are created as 'pending' — admin must approve before balance changes.
export const getFeeInfo = async (studentId) => {
  const res = await api.get(`/fees/${studentId}`);
  return res.data.data;
};

/**
 * Submit a fee payment with proof.
 * @param {string} studentId
 * @param {number} amount
 * @param {string} description
 * @param {{ type: 'link'|'file', value: string, mimeType?: string }} proof
 */
export const deposit = async (studentId, amount, description, proof) => {
  const res = await api.post(`/fees/${studentId}/deposit`, { amount, description, proof });
  return res.data;
};

export const withdraw = async (studentId, amount, description) => {
  const res = await api.post(`/fees/${studentId}/withdraw`, { amount, description });
  return res.data;
};
