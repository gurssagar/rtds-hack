const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Cache for pricing data to reduce API calls
const pricingCache = {
  data: {},
  timestamp: {},
  CACHE_TTL: 10 * 60 * 1000 // 10 minutes in milliseconds
};

// Logging middleware
app.use((req, res, next) => {
  logger.logRequest(req);
  
  // Capture the response
  const originalSend = res.send;
  res.send = function(data) {
    logger.logResponse(res, JSON.parse(data));
    return originalSend.call(this, data);
  };
  
  next();
});

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Check if Supabase credentials are provided
if (!supabaseUrl || !supabaseKey) {
  logger.error('Supabase credentials are missing! Check your .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Valid regions for pricing API
const validRegions = ['us-east-at-1', 'ap-south-mum-1', 'ap-south-del-1', 'ap-south-noi-1'];

// Endpoint to fetch pricing data
app.get('/api/pricing', async (req, res) => {
  try {
    logger.info('Received pricing data request');
    const { region = 'us-east-at-1' } = req.query;
    logger.debug(`Requested region: ${region}`);

    // Validate region
    if (!validRegions.includes(region)) {
      logger.warn(`Invalid region requested: ${region}`);
      return res.status(400).json({
        error: true,
        messages: {
          region: [`Region must be one of: ${validRegions.join(', ')}`]
        }
      });
    }

    // Check if we have cached data for this region that is still valid
    const now = Date.now();
    if (
      pricingCache.data[region] && 
      pricingCache.timestamp[region] && 
      (now - pricingCache.timestamp[region] < pricingCache.CACHE_TTL)
    ) {
      logger.info(`Returning cached pricing data for region: ${region}`);
      logger.debug(`Cache age: ${(now - pricingCache.timestamp[region]) / 1000} seconds`);
      return res.json(pricingCache.data[region]);
    }

    // Add retry logic
    const MAX_RETRIES = 3;
    let retries = 0;
    let responseData = null;
    
    while (retries < MAX_RETRIES) {
      try {
        logger.info(`Fetching pricing data for region: ${region} (attempt ${retries + 1})`);
        const response = await axios.get('https://customer.acecloudhosting.com/api/v1/pricing', {
          params: {
            is_gpu: true,
            resource: 'instances',
            region: region
          }
        });
        
        responseData = response.data;
        // Store in cache
        pricingCache.data[region] = responseData;
        pricingCache.timestamp[region] = Date.now();
        logger.debug(`Cached pricing data for region: ${region}`);
        break; // Success, exit the retry loop
      } catch (error) {
        if (error.response && error.response.status === 429) {
          // Rate limited, get retry-after header or use default
          const retryAfter = parseInt(error.response.headers['retry-after'] || '5', 10);
          logger.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);
          // Wait for the specified time before retrying
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          retries++;
        } else {
          // Not a rate limit error, re-throw
          throw error;
        }
      }
    }
    
    if (responseData) {
      logger.info('Successfully retrieved pricing data');
      logger.debug(`Retrieved ${responseData?.data?.length || 0} pricing records`);
      res.json(responseData);
    } else {
      logger.error('Failed after multiple retry attempts');
      res.status(429).json({ error: 'Service unavailable due to rate limiting. Please try again later.' });
    }
  } catch (error) {
    logger.logError(error, 'Error fetching pricing data');
    
    // Provide more detailed error information based on the error type
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      logger.error(`External API error: ${error.response.status} - ${error.response.statusText}`);
      const statusCode = error.response.status;
      const message = statusCode === 429 
        ? 'Too many requests. Please try again later.' 
        : `External API error: ${error.response.statusText}`;
      
      res.status(statusCode).json({ 
        error: message,
        details: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      logger.error('No response received from external API');
      res.status(503).json({ error: 'Service unavailable. No response from pricing service.' });
    } else {
      // Something happened in setting up the request that triggered an Error
      logger.error(`Request configuration error: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch pricing data due to configuration error' });
    }
  }
});

// API endpoint to save GPU optimizer data
app.post('/api/save-gpu-data', async (req, res) => {
  try {
    logger.info('Received GPU data request');
    logger.debug(`Form data: ${JSON.stringify(req.body)}`);
    
    const {
      modelType,
      datasetSize,
      taskType,
      budget,
      budgetType,
      region
    } = req.body;
    
    // Validate required fields
    if (!modelType || !datasetSize || !taskType || !budget || !region) {
      logger.error('Missing required fields in request');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    logger.info('Preparing to insert data into Supabase...');
    logger.debug(`Supabase URL: ${supabaseUrl ? 'Set' : 'Missing'}`);
    logger.debug(`Target table: Workload`);
    
    // Prepare data object for insertion
    const workloadData = {
      model_type: modelType,
      dataset_size: datasetSize,
      task_type: taskType,
      budget_amount: budget,
      budget_type: budgetType,
      preferred_region: region,
      created_at: new Date()
    };
    
    logger.debug(`Data to insert: ${JSON.stringify(workloadData)}`);
    
    // Insert data into Supabase
    try {
      // Log the Supabase client state (without credentials)
      logger.debug(`Supabase client initialized: ${!!supabase}`);
      
      const { data, error } = await supabase
        .from('Workload')
        .insert([workloadData])
        .select();  // Add select() to return inserted data
      
      if (error) {
        logger.logError(error, 'Supabase error');
        return res.status(500).json({ error: error.message });
      }
      
      if (!data || data.length === 0) {
        logger.warn('No data returned from Supabase, but operation may have succeeded');
      }
      
      logger.info('Successfully saved data to Supabase');
      logger.debug(`Saved data: ${JSON.stringify(data)}`);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Data saved successfully',
        data
      });
    } catch (supabaseError) {
      logger.logError(supabaseError, 'Supabase operation error');
      return res.status(500).json({ error: 'Database operation failed' });
    }
  } catch (err) {
    logger.logError(err, 'Server error');
    return res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Supabase URL configured: ${supabaseUrl ? 'Yes' : 'No'}`);
  logger.info(`Supabase Key configured: ${supabaseKey ? 'Yes (length: ' + (supabaseKey?.length || 0) + ')' : 'No'}`);
});
