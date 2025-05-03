'use client';

import { log } from 'console';
import { useEffect, useState } from 'react';

interface GpuInstance {
  id: string;
  resource_name: string;
  provider: string;
  gpuType: string;
  vram: number;
  price_per_hour: number;
  price_per_month?: number;
  region: string;
  performance: number;
  ram: number;
  vcpus: number;
  gpu_description?: string;
  country?: string;
  currency: string;
}

export default function Dashboard() {
  const [formData, setFormData] = useState<any>(null);
  const [recommendedInstances, setRecommendedInstances] = useState<GpuInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve form data from localStorage
    const storedData = localStorage.getItem('gpuFormData');
    let parsedData;
    
    if (storedData) {
      try {
        parsedData = JSON.parse(storedData);
        setFormData(parsedData);
      } catch (e) {
        console.error('Error parsing stored form data:', e);
        parsedData = null;
      }
    }
    
    // Use default data if no stored data is found or parse failed
    if (!parsedData) {
      console.warn('No stored form data found, using defaults');
      const defaultData = {
        modelType: "llm",
        datasetSize: "16",
        taskType: "training",
        budget: "100",
        budgetType: "hourly",
        region: "us-east-1"
      };
      setFormData(defaultData);
      parsedData = defaultData;
    }
    
    // Fetch GPU instances with whatever data we have
    fetchGpuInstances(parsedData.region || 'us-east-1');
  }, []);

  const fetchGpuInstances = async (userRegion: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if API is available first
      try {
        const healthCheck = await fetch('http://localhost:3001/health', { 
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!healthCheck.ok) {
          console.error('Backend API health check failed:', healthCheck.status);
          throw new Error('Backend server is not responding properly');
        }
      } catch (healthErr) {
        console.error('Backend server may be down:', healthErr);
        throw new Error('Cannot connect to backend server. Is it running?');
      }
      
      // Map the user-selected region to API region
      const apiRegion = mapRegionToApiRegion(userRegion);
      console.log('Fetching GPU data for region:', apiRegion);
      
      // Call the pricing API with explicit mode to handle CORS issues
      const response = await fetch(`http://localhost:3001/api/pricing?region=ap-south-mum-1`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API data received:', data);
      
      if (data.error) {
        throw new Error(data.message || 'Error fetching GPU data');
      }
      
      // Check if data exists and has expected structure
      if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
        console.warn('No GPU instances found in API response or invalid data format');
        // setRecommendedInstances(getFallbackInstances());
        return;
      }
      
      // Process and filter the API response
      const processedInstances = processApiResponse(data.data, formData);
      console.log('Processed instances:', processedInstances);
      setRecommendedInstances(processedInstances);
      
    } catch (err: any) {
      console.error('Error fetching GPU instances:', err);
      setError(`Failed to load GPU recommendations: ${err.message}`);
      
      // Fall back to some default instances
      setRecommendedInstances(getFallbackInstances());
    } finally {
      setIsLoading(false);
    }
  };

  // Map user-selected region to API region format
  const mapRegionToApiRegion = (userRegion: string): string => {
    // Default to us-east-at-1 if no match
    const regionMap: {[key: string]: string} = {
      'us-east-1': 'us-east-at-1',
      'in-south-1': 'ap-south-mum-1',
      'in-north-1': 'ap-south-del-1',
      'sg-1': 'ap-south-mum-1'
    };
    
    return regionMap[userRegion] || 'us-east-at-1';
  };

  // Process API response to get suitable instances
  const processApiResponse = (instances: any[], userData: any): GpuInstance[] => {
    if (!instances || instances.length === 0) {
      return getFallbackInstances();
    }
    
    // Handle case where userData might be null
    if (!userData) {
      console.warn('User data is null or undefined, using default filtering');
      userData = {
        budget: 1000,
        budgetType: 'hourly',
        datasetSize: 0
      };
    }
    
    console.log('Raw instance data example:', instances[0]);
    
    // Filter instances based on user requirements
    let filteredInstances = instances.filter(instance => {
      // Ensure basic required properties exist
      if (!instance.resource_name || 
          !instance.vcpus || 
          !instance.ram || 
          (instance.price_per_hour === undefined && instance.price_per_month === undefined)) {
        return false;
      }
      
      // Filter by budget if specified
      if (userData.budget) {
        const budget = parseFloat(userData.budget);
        const price = userData.budgetType === 'monthly' 
          ? (instance.price_per_month || instance.price_per_hour * 720) // approx hrs in a month 
          : (instance.price_per_hour || instance.price_per_month / 720);
          
        if (price > budget) return false;
      }
      
      // Filter by required RAM based on dataset size
      const datasetSize = parseFloat(userData.datasetSize || '0');
      if (datasetSize && instance.ram < datasetSize) return false;
      
      return true;
    });
    
    console.log(`Filtered from ${instances.length} to ${filteredInstances.length} instances based on criteria`);
    
    if (filteredInstances.length === 0) {
      console.warn('No instances match criteria, returning fallbacks');
      return getFallbackInstances();
    }
    
    // Sort instances by price (ascending) and ram (descending) for best value
    filteredInstances.sort((a, b) => {
      // First prioritize by price
      const priceA = userData.budgetType === 'monthly' 
        ? (a.price_per_month || a.price_per_hour * 720) 
        : (a.price_per_hour || a.price_per_month / 720);
        
      const priceB = userData.budgetType === 'monthly' 
        ? (b.price_per_month || b.price_per_hour * 720) 
        : (b.price_per_hour || b.price_per_month / 720);
      
      if (priceA !== priceB) {
        return priceA - priceB;
      }
      
      // Then by RAM
      return b.ram - a.ram;
    });
    
    // Take top 3 instances
    const topInstances = filteredInstances.slice(0, 3);
    console.log('Top instances:', topInstances);
    
    // Map to our GpuInstance interface
    return topInstances.map((instance, index) => {
      // Generate a performance score based on ram and vcpus (just for display purposes)
      const performance = Math.min(95, 60 + (instance.ram / 10) + (instance.vcpus / 2));
      
      return {
        id: instance.flavor_id || `gpu-${index}`,
        resource_name: instance.resource_name || 'Unknown Instance',
        provider: instance.country ? instance.country.toUpperCase() : 'Cloud Provider',
        gpuType: instance.gpu_description || instance.resource_class || 'GPU',
        vram: instance.ram || 0,
        price_per_hour: instance.price_per_hour || 0,
        price_per_month: instance.price_per_month || 0,
        region: instance.region || 'Unknown',
        performance: Math.round(performance),
        ram: instance.ram || 0,
        vcpus: instance.vcpus || 0,
        currency: instance.currency || 'USD'
      };
    });
  };

  // Fallback instances if API fails
  const getFallbackInstances = (): GpuInstance[] => [
    {
      id: 'a1',
      resource_name: 'p3.2xlarge',
      provider: 'AWS',
      gpuType: 'NVIDIA Tesla V100',
      vram: 16,
      price_per_hour: 3.06,
      price_per_month: 0,
      region: 'US East',
      performance: 92,
      ram: 64,
      vcpus: 8,
      currency: 'USD'
    },
    {
      id: 'a2',
      resource_name: 'n1-standard-8 + T4',
      provider: 'GCP',
      gpuType: 'NVIDIA Tesla T4',
      vram: 16,
      price_per_hour: 1.46,
      price_per_month: 0,
      region: 'US West',
      performance: 85,
      ram: 32,
      vcpus: 8,
      currency: 'USD'
    },
    {
      id: 'a3',
      resource_name: 'Standard_NC6s_v3',
      provider: 'Azure',
      gpuType: 'NVIDIA Tesla V100',
      vram: 16,
      price_per_hour: 3.06,
      price_per_month: 0,
      region: 'US East',
      performance: 88,
      ram: 112,
      vcpus: 6,
      currency: 'USD'
    }
  ];

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-light text-white">GPU Recommendations</h1>
          <a 
            href="/" 
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all"
          >
            Return to Form
          </a>
        </div>

        {formData && (
          <div className="bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-800">
            <h2 className="text-xl text-gray-300 mb-4">Your Requirements</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black p-4 rounded-lg border border-gray-800">
                <div className="text-sm text-gray-500">Model Type</div>
                <div className="text-gray-200 mt-1 font-medium">{formData.modelType.toUpperCase()}</div>
              </div>
              <div className="bg-black p-4 rounded-lg border border-gray-800">
                <div className="text-sm text-gray-500">Dataset Size</div>
                <div className="text-gray-200 mt-1 font-medium">{formData.datasetSize} GB</div>
              </div>
              <div className="bg-black p-4 rounded-lg border border-gray-800">
                <div className="text-sm text-gray-500">Task Type</div>
                <div className="text-gray-200 mt-1 font-medium capitalize">{formData.taskType}</div>
              </div>
              <div className="bg-black p-4 rounded-lg border border-gray-800">
                <div className="text-sm text-gray-500">Budget</div>
                <div className="text-gray-200 mt-1 font-medium">${formData.budget}/{formData.budgetType}</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl text-gray-300 mb-6">Top Recommended Instances</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">
              <div className="font-semibold mb-2">Error loading recommendations:</div>
              <div>{error}</div>
              <div className="mt-4 text-sm">
                Using fallback recommendations. You can try refreshing the page to attempt to fetch real-time data again.
              </div>
            </div>
          ) : recommendedInstances.length === 0 ? (
            <div className="bg-yellow-900/30 border border-yellow-800 text-yellow-300 p-4 rounded-lg">
              No GPU instances found that match your requirements. Try adjusting your criteria and try again.
            </div>
          ) : (
            <div className="space-y-4">
              {recommendedInstances.map((instance) => (
                <div 
                  key={instance.id} 
                  className="bg-black rounded-xl p-4 border border-gray-800 hover:border-blue-700 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-xl font-medium text-white">{instance.resource_name}</span>
                        <span className="ml-3 px-2 py-1 bg-blue-900 text-blue-300 rounded-md text-xs">
                          {instance.provider}
                        </span>
                      </div>
                      <div className="mt-2 text-gray-400">
                        {instance.gpuType} • {instance.ram} GB RAM • {instance.vcpus} vCPUs
                      </div>
                      <div className="mt-1 text-gray-500 text-xs">
                        Region: {instance.region}
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Price</div>
                        <div className="text-xl font-medium text-white">
                          {instance.currency === 'USD' ? '$' : instance.currency + ' '}
                          {formData?.budgetType === 'monthly' && instance.price_per_month 
                            ? instance.price_per_month.toFixed(2) 
                            : instance.price_per_hour.toFixed(2)}
                          /{formData?.budgetType || 'hr'}
                        </div>
                      </div>
                      
                      <div className="relative h-14 w-14 flex items-center justify-center">
                        <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-800" strokeWidth="4"></circle>
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            className="stroke-blue-600"
                            strokeWidth="4"
                            strokeDasharray={`${instance.performance} 100`}
                          ></circle>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                          {instance.performance}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-8 p-4 bg-blue-900/20 rounded-lg border border-blue-800/50">
            <div className="flex items-start gap-3">
              <div className="text-blue-300 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm text-blue-300">
                <p>These recommendations are based on your requirements and our analysis of current GPU instance performance for the specified workload type.</p>
                <p className="mt-1">For more detailed comparisons and cost optimization, contact our team.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 