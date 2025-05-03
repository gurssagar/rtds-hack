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
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center mb-12 relative">
          <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full opacity-20"></div>
          <h1 className="text-5xl font-bold text-white mb-3 text-center relative z-10">
            GPU Recommendations
          </h1>
          <p className="text-center text-gray-400 text-lg max-w-2xl">
            Optimized instances for your AI workload based on your requirements
          </p>
        </div>

        {formData && (
          <div className="bg-gray-900/90 rounded-2xl p-8 mb-10 border border-gray-800/50 backdrop-blur-sm shadow-xl relative overflow-hidden group hover:shadow-blue-900/10 transition-all duration-300">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-700"></div>
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-100 font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019a1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019a1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Your Requirements
              </h2>
              <div className="bg-blue-900/30 text-blue-300 px-4 py-1.5 rounded-full border border-blue-800/50 text-sm font-medium">
                {formData.taskType === 'training' ? 'Training Workload' : 'Inference Workload'}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/60 p-5 rounded-xl border border-gray-800/50 backdrop-blur-md hover:bg-black/70 transition duration-300 hover:border-blue-900/30 hover:shadow-lg group/card">
                <div className="text-sm text-gray-500 mb-1 flex items-center group-hover/card:text-blue-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  Model Type
                </div>
                <div className="text-gray-100 font-semibold text-lg">{formData.modelType.toUpperCase()}</div>
              </div>
              
              <div className="bg-black/60 p-5 rounded-xl border border-gray-800/50 backdrop-blur-md hover:bg-black/70 transition duration-300 hover:border-blue-900/30 hover:shadow-lg group/card">
                <div className="text-sm text-gray-500 mb-1 flex items-center group-hover/card:text-blue-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  Dataset Size
                </div>
                <div className="text-gray-100 font-semibold text-lg">
                  {formData.datasetSize} 
                  <span className="text-sm text-gray-400 ml-1">GB</span>
                </div>
              </div>
              
              <div className="bg-black/60 p-5 rounded-xl border border-gray-800/50 backdrop-blur-md hover:bg-black/70 transition duration-300 hover:border-blue-900/30 hover:shadow-lg group/card">
                <div className="text-sm text-gray-500 mb-1 flex items-center group-hover/card:text-blue-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Task Type
                </div>
                <div className="text-gray-100 font-semibold text-lg capitalize">{formData.taskType}</div>
              </div>
              
              <div className="bg-black/60 p-5 rounded-xl border border-gray-800/50 backdrop-blur-md hover:bg-black/70 transition duration-300 hover:border-blue-900/30 hover:shadow-lg group/card">
                <div className="text-sm text-gray-500 mb-1 flex items-center group-hover/card:text-blue-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Budget
                </div>
                <div className="text-gray-100 font-semibold text-lg">
                  ${formData.budget}
                  <span className="text-sm text-gray-400 ml-1">/{formData.budgetType}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-900/90 rounded-2xl border border-gray-800/50 backdrop-blur-sm shadow-xl overflow-hidden transition-all duration-300 hover:shadow-blue-900/10">
          <div className="p-8">
            <h2 className="text-2xl text-gray-100 font-semibold flex items-center mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Top Recommended Instances
            </h2>
            
            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-24">
                <div className="relative w-20 h-20">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500/20 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-500 rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-gray-400 animate-pulse">Searching for optimal GPU instances...</p>
              </div>
            ) : error ? (
              <div className="bg-red-900/30 border border-red-800/50 text-red-300 p-6 rounded-xl">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-semibold mb-2">Error loading recommendations:</div>
                    <div>{error}</div>
                    <div className="mt-4 text-sm opacity-80">
                      Using fallback recommendations. You can try refreshing the page to attempt to fetch real-time data again.
                    </div>
                  </div>
                </div>
              </div>
            ) : recommendedInstances.length === 0 ? (
              <div className="bg-yellow-900/30 border border-yellow-800/50 text-yellow-300 p-6 rounded-xl">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-yellow-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    No GPU instances found that match your requirements. Try adjusting your criteria and try again.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {recommendedInstances.map((instance, index) => (
                  <div 
                    key={instance.id} 
                    className={`bg-black/70 rounded-xl p-6 border border-gray-800 hover:border-blue-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/10 relative overflow-hidden group ${index === 0 ? 'ring-2 ring-blue-500/30 shadow-lg shadow-blue-900/10' : ''}`}
                  >
                    {index === 0 && (
                      <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
                        BEST MATCH
                      </div>
                    )}
                    <div className="flex flex-col md:flex-row md:items-center">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-xl font-medium text-white">{instance.resource_name}</span>
                          <span className="ml-3 px-2.5 py-1 bg-blue-800 text-blue-200 rounded-md text-xs font-medium">
                            {instance.provider}
                          </span>
                        </div>
                        <div className="mt-3 text-gray-300 flex flex-wrap gap-3">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {instance.gpuType}
                          </span>
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {instance.ram} GB RAM
                          </span>
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                            {instance.vcpus} vCPUs
                          </span>
                        </div>
                        <div className="mt-3 text-gray-500 text-xs flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Region: {instance.region}
                        </div>
                      </div>
                      
                      <div className="mt-6 md:mt-0 flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-blue-400 font-medium">Price</div>
                          <div className="text-2xl font-medium text-white mt-1 flex items-center justify-end">
                            <span className="text-lg text-blue-300 mr-1">{instance.currency === 'USD' ? '$' : instance.currency}</span>
                            <span>
                              {formData?.budgetType === 'monthly' && instance.price_per_month 
                                ? instance.price_per_month.toFixed(2) 
                                : instance.price_per_hour.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-400 ml-1">/{formData?.budgetType || 'hr'}</span>
                          </div>
                        </div>
                        
                        <div className="relative h-16 w-16 flex items-center justify-center">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-800" strokeWidth="3"></circle>
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              className="stroke-blue-600"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray={`${instance.performance} 100`}
                            ></circle>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-lg font-medium text-white">
                              {instance.performance}%
                            </div>
                            <div className="text-xs text-blue-400 -mt-0.5">
                              Performance
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 p-5 bg-blue-900/20 rounded-lg border border-blue-800/30">
              <div className="flex items-start gap-3">
                <div className="text-blue-300 p-1 bg-blue-900/30 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-blue-200">
                  <p>These recommendations are based on your requirements and our analysis of current GPU instance performance for the specified workload type.</p>
                  <p className="mt-1">For more detailed comparisons and cost optimization, contact our team.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 