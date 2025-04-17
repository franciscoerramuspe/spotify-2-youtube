import express from 'express';


const app = express();
app.get('/', (req, res) => res.send('Hello from your API'));
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Listening on ${port}`));