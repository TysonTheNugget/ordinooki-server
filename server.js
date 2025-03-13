const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Root route for testing
app.get('/', (req, res) => {
    res.send('Server is running! Use /check-ordinookis?address=your-address to check Ordinookis.');
});

app.get('/check-ordinookis', async (req, res) => {
    const { address } = req.query;
    const apiKey = '6ed7b13e-063c-42fc-a27b-9bd87f8f7219';

    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    try {
        console.log(`Fetching tokens for address: ${address}`);
        let allTokens = [];
        let offset = 0;
        const limit = 20;

        while (true) {
            console.log(`Fetching Magic Eden page: offset=${offset}, limit=${limit}`);
            const response = await fetch(
                `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?ownerAddress=${address}&collectionSymbol=ordinookis&limit=${limit}&offset=${offset}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error: ${response.status} - ${errorText}`);
                throw new Error(`Magic Eden request failed with status ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            if (!data.tokens || data.tokens.length === 0) {
                console.log(`No more tokens found at offset ${offset}`);
                break;
            }

            allTokens = allTokens.concat(data.tokens);
            console.log(`Fetched ${data.tokens.length} tokens, total so far: ${allTokens.length}`);
            offset += limit;
        }

        const currentTokens = allTokens.filter(token => token.owner.toLowerCase() === address.toLowerCase());
        console.log(`Fetched ${allTokens.length} total tokens, filtered ${currentTokens.length} currently owned by ${address}`);
        res.json({ tokens: currentTokens, total: currentTokens.length });
    } catch (error) {
        console.error(`Server error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});