const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Valid regions
const validRegions = ['us-east-at-1', 'ap-south-mum-1', 'ap-south-del-1', 'ap-south-noi-1'];

// Endpoint to fetch pricing data
app.get('/api/pricing', async (req, res) => {
    try {
        const { region = 'us-east-at-1' } = req.query;

        // Validate region
        if (!validRegions.includes(region)) {
            return res.status(400).json({
                error: true,
                messages: {
                    region: [`Region must be one of: ${validRegions.join(', ')}`]
                }
            });
        }

        const response = await axios.get('https://customer.acecloudhosting.com/api/v1/pricing', {
            params: {
                is_gpu: true,
                resource: 'instances',
                region: region
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching pricing data:', error.message);
        res.status(500).json({ error: 'Failed to fetch pricing data' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
