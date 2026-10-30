import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 8787;

app.listen(PORT, () => {
  console.log(`IsaacSum server listening on http://localhost:${PORT}`);
  console.log(`AI provider: ${process.env.AI_PROVIDER || 'anthropic'}`);
});
