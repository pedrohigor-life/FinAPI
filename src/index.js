const express = require('express');

const app = express();

app.listen(3333, () => {
    console.log('FinAPI is running: http://localhost:3333/finapi');
});