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
  const [allInstances, setAllInstances] = useState<GpuInstance[]>([]);
  const [filteredInstances, setFilteredInstances] = useState<GpuInstance[]>([]);
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    minRam: '',
    maxPrice: '',
    gpuType: 'all',
    minVcpus: ''
  });

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
      const response = await fetch(`http://localhost:3001/api/pricing?region=${apiRegion}`, {
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
      setAllInstances(processedInstances);
      setFilteredInstances(processedInstances);
      setRecommendedInstances(processedInstances);
      
    } catch (err: any) {
      console.error('Error fetching GPU instances:', err);
      setError(`Failed to load GPU recommendations: ${err.message}`);
      
      // Fall back to some default instances
      const fallbackInstances = getFallbackInstances();
      setAllInstances(fallbackInstances);
      setFilteredInstances(fallbackInstances);
      setRecommendedInstances(fallbackInstances);
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
    
    console.log('Raw instance data example:', instances[0]);
    console.log(`Total instances received from API: ${instances.length}`);
    
    // Map to our GpuInstance interface without filtering
    return instances.map((instance, index) => {
      // Generate a performance score based on ram and vcpus (just for display purposes)
      const performance = Math.min(95, 60 + (instance.ram / 10) + (instance.vcpus / 2));
      
      // Ensure ID uniqueness by appending the index
      const uniqueId = (instance.flavor_id || `gpu-${index}`) + `-${index}`;
      
      return {
        id: uniqueId,
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

  // Apply filters to instances
  const applyFilters = () => {
    if (!allInstances || allInstances.length === 0) return; // Don't run if no instances available
    
    let filtered = [...allInstances];
    
    // Filter by minimum RAM
    if (filters.minRam && !isNaN(Number(filters.minRam))) {
      const minRam = Number(filters.minRam);
      filtered = filtered.filter(instance => instance.ram >= minRam);
    }
    
    // Filter by maximum price
    if (filters.maxPrice && !isNaN(Number(filters.maxPrice))) {
      const maxPrice = Number(filters.maxPrice);
      filtered = filtered.filter(instance => {
        // Make sure we consider the correct price format based on user's budget type
        const price = formData?.budgetType === 'monthly' && instance.price_per_month && instance.price_per_month > 0
          ? instance.price_per_month 
          : instance.price_per_hour || 0;
        return price <= maxPrice;
      });
    }
    
    // Filter by GPU type
    if (filters.gpuType && filters.gpuType !== 'all') {
      filtered = filtered.filter(instance => 
        instance.gpuType && instance.gpuType.toLowerCase().includes(filters.gpuType.toLowerCase())
      );
    }
    
    // Filter by minimum vCPUs
    if (filters.minVcpus && !isNaN(Number(filters.minVcpus))) {
      const minVcpus = Number(filters.minVcpus);
      filtered = filtered.filter(instance => instance.vcpus >= minVcpus);
    }
    
    console.log(`Filtering: ${allInstances.length} → ${filtered.length} instances`);
    console.log('Filter criteria:', filters);
    
    setFilteredInstances(filtered);
    setRecommendedInstances(filtered);
  };
  
  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      minRam: '',
      maxPrice: '',
      gpuType: 'all',
      minVcpus: ''
    });
    setFilteredInstances(allInstances);
    setRecommendedInstances(allInstances);
  };
  
  // Apply filters when filter values change or when allInstances changes
  useEffect(() => {
    applyFilters();
  }, [filters, allInstances]);

  // Handle GPU selection for comparison
  const handleSelectGpu = (id: string) => {
    setSelectedInstances(prev => {
      // If already selected, remove it
      if (prev.includes(id)) {
        return prev.filter(instanceId => instanceId !== id);
      }
      
      // If 2 already selected, replace the oldest one
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      
      // Otherwise add it
      return [...prev, id];
    });
  };
  
  // Navigate to comparison page with selected GPUs
  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any default behavior
    
    console.log("Compare button clicked", { selectedInstances });
    
    if (selectedInstances.length !== 2) {
      console.error("Cannot compare: need exactly 2 GPUs selected");
      return;
    }
    
    // First check if instances exist in filteredInstances (what the user sees)
    let selectedGpus = filteredInstances.filter(instance => 
      selectedInstances.includes(instance.id)
    );
    
    // If not found in filtered, try all instances
    if (selectedGpus.length !== 2) {
      console.log("Could not find selected GPUs in filteredInstances, trying allInstances");
      selectedGpus = allInstances.filter(instance => 
        selectedInstances.includes(instance.id)
      );
    }
    
    if (selectedGpus.length !== 2) {
      console.error("Could not find both selected GPU instances", { 
        selectedInstances, 
        allInstancesLength: allInstances.length,
        filteredInstancesLength: filteredInstances.length,
        // Log a sample of instance IDs for debugging
        allInstancesSample: allInstances.slice(0, 5).map(i => i.id),
        filteredInstancesSample: filteredInstances.slice(0, 5).map(i => i.id)
      });
      
      alert("Error preparing comparison: Could not retrieve the selected GPUs. Please try selecting different GPUs.");
      return;
    }
    
    try {
      // Clear existing data first
      localStorage.removeItem('compareGpus');
      
      // Store the new comparison data
      const jsonData = JSON.stringify(selectedGpus);
      localStorage.setItem('compareGpus', jsonData);
      
      console.log("Stored comparison data:", selectedGpus);
      
      // Navigate to comparison page with direct URL to avoid routing issues
      const baseUrl = window.location.origin;
      const compareUrl = `${baseUrl}/dashboard/compare`;
      console.log("Navigating to:", compareUrl);
      
      // Force window navigation rather than using Next.js routing
      window.location.href = compareUrl;
    } catch (error) {
      console.error("Error storing GPU comparison data:", error);
      alert("Error preparing GPU comparison. Please try again.");
    }
  };

  return (
    <>
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

          {/* Recommended GPUs Section */}
          {!isLoading && !error && recommendedInstances.length > 0 && (
            <div className="bg-gray-900/90 rounded-2xl p-8 mb-10 border border-gray-800/50 backdrop-blur-sm shadow-xl relative overflow-hidden hover:shadow-blue-900/10 transition-all duration-300">
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-green-600/10 rounded-full blur-3xl transition-all duration-700"></div>
              
              <h2 className="text-2xl text-gray-100 font-semibold flex items-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Top Recommended GPUs
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendedInstances.slice(0, 3).map((instance, index) => (
                  <div 
                    key={`recommended-${instance.id}`}
                    className="bg-black/60 rounded-xl p-5 border border-green-800/30 backdrop-blur-md hover:bg-black/70 transition duration-300 hover:border-green-700/50 hover:shadow-lg relative overflow-hidden"
                  >
                    {index === 0 && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-green-900/70 text-green-300 text-xs rounded-full border border-green-800">
                        Best Match
                      </div>
                    )}
                    
                    <div className="text-lg font-medium text-white mb-1">{instance.resource_name}</div>
                    <div className="text-sm text-gray-400 mb-3 flex items-center">
                      <span className="px-2 py-0.5 bg-blue-800/60 text-blue-200 rounded-md text-xs font-medium mr-2">
                        {instance.provider}
                      </span>
                      <span>{instance.region}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">GPU Type:</span>
                        <span className="text-white">{instance.gpuType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Performance:</span>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-green-300">{instance.performance}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">RAM:</span>
                        <span className="text-white">{instance.ram} GB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">vCPUs:</span>
                        <span className="text-white">{instance.vcpus}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white">
                          {instance.currency === 'USD' ? '$' : instance.currency}{' '}
                          {formData?.budgetType === 'monthly' && instance.price_per_month 
                            ? instance.price_per_month.toFixed(2) 
                            : instance.price_per_hour.toFixed(2)}
                          <span className="text-xs text-gray-400 ml-1">/{formData?.budgetType || 'hr'}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleSelectGpu(instance.id)}
                        className={`px-3 py-1.5 rounded text-sm ${
                          selectedInstances.includes(instance.id)
                            ? 'bg-green-700 text-white'
                            : 'bg-green-900/50 text-green-300 hover:bg-green-800/60'
                        }`}
                      >
                        {selectedInstances.includes(instance.id) ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-900/90 rounded-2xl border border-gray-800/50 backdrop-blur-sm shadow-xl overflow-hidden transition-all duration-300 hover:shadow-blue-900/10">
            <div className="p-8">
              <h2 className="text-2xl text-gray-100 font-semibold flex items-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                All GPU Instances <span className="ml-2 text-sm text-gray-400">({allInstances.length} available)</span>
              </h2>
              
              <div className="mb-4 text-gray-400 text-sm">
                Showing {filteredInstances.length} instances {filters.minRam || filters.maxPrice || filters.gpuType !== 'all' || filters.minVcpus ? 'after filtering' : 'without filtering'}
              </div>
              
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
                      <div className="mb-2">No GPU instances found that match your requirements. Try adjusting your criteria and try again.</div>
                      {/* Only show clear filters button if we have instances but filters eliminated all */}
                      {allInstances.length > 0 && (
                        <button
                          onClick={resetFilters}
                          className="mt-2 px-4 py-2 bg-yellow-800/50 text-yellow-200 rounded hover:bg-yellow-700/50 transition-colors text-sm border border-yellow-700/50"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6 p-4 bg-black/60 rounded-xl border border-gray-800/50">
                    <h3 className="text-lg text-gray-100 font-medium mb-4">Filter Instances</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex flex-col">
                        <label className="text-gray-400 text-sm mb-1">Min RAM (GB)</label>
                        <input
                          type="number"
                          name="minRam"
                          placeholder="Min RAM"
                          value={filters.minRam}
                          onChange={handleFilterChange}
                          className="bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-gray-400 text-sm mb-1">Max Price ({formData?.budgetType || 'hr'})</label>
                        <input
                          type="number"
                          name="maxPrice"
                          placeholder="Max price"
                          value={filters.maxPrice}
                          onChange={handleFilterChange}
                          className="bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-gray-400 text-sm mb-1">GPU Type</label>
                        <select
                          name="gpuType"
                          value={filters.gpuType}
                          onChange={handleFilterChange}
                          className="bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="all">All GPU Types</option>
                          {Array.from(new Set(allInstances.map(i => i.gpuType))).map(gpuType => (
                            <option key={gpuType} value={gpuType}>{gpuType}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-gray-400 text-sm mb-1">Min vCPUs</label>
                        <input
                          type="number"
                          name="minVcpus"
                          placeholder="Min vCPUs"
                          value={filters.minVcpus}
                          onChange={handleFilterChange}
                          className="bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={resetFilters}
                        className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors text-sm"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {filteredInstances.map((instance, index) => (
                      <div 
                        key={instance.id} 
                        className={`bg-black/70 rounded-xl p-5 border hover:shadow-lg hover:shadow-blue-900/10 relative overflow-hidden group transition-all duration-300 ${
                          selectedInstances.includes(instance.id)
                            ? 'border-blue-500 shadow-md shadow-blue-900/20'
                            : 'border-gray-800 hover:border-blue-700/50'
                        }`}
                      >
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={() => handleSelectGpu(instance.id)}
                            className={`p-1.5 rounded-full ${
                              selectedInstances.includes(instance.id)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                            title={selectedInstances.includes(instance.id) ? "Unselect for comparison" : "Select for comparison"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {selectedInstances.includes(instance.id) ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              )}
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="text-lg font-medium text-white">{instance.resource_name}</span>
                              <span className="ml-3 px-2 py-0.5 bg-blue-800 text-blue-200 rounded-md text-xs font-medium">
                                {instance.provider}
                              </span>
                            </div>
                            <div className="mt-2 text-gray-300 flex flex-wrap gap-2 text-sm">
                              <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                {instance.gpuType}
                              </span>
                              <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {instance.ram} GB RAM
                              </span>
                              <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                                {instance.vcpus} vCPUs
                              </span>
                              <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {instance.region}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-3 md:mt-0 flex items-center gap-4">
                            <div className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded text-xs">
                              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                              <span>{instance.performance}%</span>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-medium text-white flex items-center justify-end">
                                <span className="text-sm text-blue-300 mr-1">{instance.currency === 'USD' ? '$' : instance.currency}</span>
                                <span>
                                  {formData?.budgetType === 'monthly' && instance.price_per_month 
                                    ? instance.price_per_month.toFixed(2) 
                                    : instance.price_per_hour.toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-400 ml-1">/{formData?.budgetType || 'hr'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
      
      {/* Fixed comparison button - always visible when GPUs are selected */}
      {selectedInstances.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md border-t border-blue-900/30 shadow-lg p-4 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-blue-200">
              <span className="font-medium">{selectedInstances.length}</span> of 2 GPUs selected for comparison
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedInstances([])}
                className="px-3 py-1.5 bg-blue-900/50 text-blue-200 rounded hover:bg-blue-800/50 transition-colors text-sm border border-blue-700/50"
              >
                Clear Selection
              </button>
              <button
                onClick={handleCompare}
                disabled={selectedInstances.length !== 2}
                className={`px-4 py-1.5 rounded text-sm font-medium ${
                  selectedInstances.length === 2
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-900/30 text-blue-300 cursor-not-allowed'
                }`}
                title={selectedInstances.length === 2 
                  ? "Compare selected GPUs" 
                  : `Select exactly 2 GPUs to compare (${selectedInstances.length} selected)`}
              >
                Compare GPUs
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 