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

function getBalance(statment) {
    const balance = statment.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount
        } else {
            return acc - operation.amount
        }
    }, 0)

    return balance;
}

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

    if (type === 'debit') {
        if (amount > account.balance) {
            return response.status(400).json({ error: 'Insufficient founds!' })
        }
    }

    account.statment.push({
        amount,
        description,
        type,
        created_at: new Date()
    });

    account.balance = getBalance(account.statment);

    return response.status(201).send();
});

app.get('/finapi/accounts/statment', verifyIfExistsAccount, (request, response) => {
    const { account } = request;

    return response.status(200).json({ statment: account.statment });
});

app.get('/finapi/accounts/statment/date', verifyIfExistsAccount, (request, response) => {
    const { account } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00").toDateString();

    const statment = account.statment.filter((statment) => {
        return statment.created_at.toDateString() === dateFormat;
    });

    return response.status(200).json({ statment });
});

// 1# Firs option list account, with using arrray map. 
app.get('/finapi/accounts/map', (request, response) => {
    const listAccounts = accounts.map((account) => {
        const { id, name, cpf, statment } = account;
        return {
            id,
            name,
            cpf,
            balance: getBalance(statment)
        }
    });

    return response.status(200).json({ listAccounts });
});

// 2# Second option list account.
app.get('/finapi/accounts/list', (request, response) => {
    return response.status(200).json({ accounts });
});

app.put('/finapi/accounts', verifyIfExistsAccount, (request, response) => {
    const { account } = request;
    const { name } = request.query;

    account.name = name;

    return response.status(200).send();
});

app.delete('/finapi/accounts', (request, response) => {
    const { account: cpf } = request;

    const indexAccount = accounts.findIndex((account) => account.cpf === cpf);

    accounts.splice(indexAccount, 1);

    return response.status(204).send();
});

app.listen(3333, () => {
    console.log('FinAPI is running: http://localhost:3333/finapi');
});