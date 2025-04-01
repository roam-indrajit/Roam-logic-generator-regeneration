import { getResults, getResultById } from '../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { id } = req.query;
      
      if (id) {
        // Get specific result
        const result = await getResultById(id);
        if (!result) {
          return res.status(404).json({ error: 'Result not found' });
        }
        return res.status(200).json(result);
      }
      
      // Get all results
      const results = await getResults();
      return res.status(200).json(results);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 