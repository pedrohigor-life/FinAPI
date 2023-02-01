const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const accounts = [];

function verifyIfExistsAccount(request, response, next) {
    const { cpf } = request.headers;

    const account = accounts.find((account) => account.cpf === cpf);

    if (!account) return response.status(400).json({ error: 'Account not exists.' })

    request.account = account;

    return next();
};

app.post('/finapi/accounts', (request, response) => {
    const { name, cpf } = request.body;

    const accountAlreadyExists = accounts.some((account) => account.cpf === cpf);

    if (!accountAlreadyExists) {
        const account = {
            id: uuidv4(),
            name,
            cpf,
            balance: 0,
            statment: []
        }
        accounts.push(account);
        return response.status(201).json({ message: 'Account created.' })
    }

    return response.status(400).json({ error: 'Account already exists.' })
});

app.post('/finapi/accounts/transaction', verifyIfExistsAccount, (request, response) => {
    const { account } = request;
    const { amount, description, type } = request.body;

    const transaction = {
        amount,
        description,
        type,
        created_at: new Date()
    }

    account.statment.push(transaction);

    return response.status(201).send();
});

app.get('/finapi/accounts/statment', verifyIfExistsAccount, (request, response) => {
    const { account } = request;

    return response.status(200).json({ statment: account.statment });
});

app.get('/finapi/accounts', (request, response) => {
    return response.status(200).json({ accounts });
});

app.listen(3333, () => {
    console.log('FinAPI is running: http://localhost:3333/finapi');
});