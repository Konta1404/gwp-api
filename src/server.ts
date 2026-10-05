import 'dotenv/config';
import app from './app';
const port = Number(process.env.PORT || 4000);
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('Set a random JWT_SECRET of at least 32 characters.');
app.listen(port, () => console.log(`API listening on port ${port}`));
