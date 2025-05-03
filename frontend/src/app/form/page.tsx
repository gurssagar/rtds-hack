"use client";

import { useState, FormEvent, useEffect } from "react";
import RegionSelector from "../../components/page";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    modelType: "",
    datasetSize: "",
    taskType: "",
    budget: "",
    budgetType: "hourly",
    region: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Log environment variables on component mount (without revealing sensitive info)
  useEffect(() => {
    console.log('Environment check:', {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'Default: http://localhost:3001',
      supabaseConfigured: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Yes' : 'No'
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, taskType: value }));
  };

  const handleRegionChange = (value: string) => {

    setFormData(prev => ({ ...prev, region: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    console.log('Form submitted with data:', formData);

    // Save form data to localStorage for the dashboard to use
    localStorage.setItem('gpuFormData', JSON.stringify(formData));

    try {
      // API endpoint URL (from environment variable or hardcoded)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
     
      const startTime = performance.now();
      const response = await fetch(`${apiUrl}/api/save-gpu-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const endTime = performance.now();
      console.log(`API call completed in ${Math.round(endTime - startTime)}ms`);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));

      const result = await response.json();
      console.log('Response data:', result);
      
      if (response.ok) {
        console.log('Form submission successful');
        setSubmitStatus({ success: true, message: 'Data saved successfully!' });
      } else {
        console.error('Form submission failed:', result.error || 'Unknown error');
        setSubmitStatus({ success: false, message: result.error || 'Error saving data' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus({ success: false, message: 'Network error, please try again' });
    } finally {
      setIsSubmitting(false);
      console.log('Form submission process completed');
      
      // Always redirect to dashboard after a short delay
      // In production, you might want to only redirect on successful API calls
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500); // Delay to show the status message
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-light text-white mb-2 text-center">GPU Optimizer</h1>
        <p className="text-center text-gray-400 mb-12">Find the perfect GPU instance for your AI workload</p>
        
        <div className="bg-gray-900 rounded-2xl shadow-lg p-8 backdrop-blur-sm backdrop-filter border border-gray-800">
          {submitStatus && (
            <div className={`mb-6 p-4 rounded-lg ${submitStatus.success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {submitStatus.message}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* AI/ML Model Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                AI/ML Model Type
              </label>
              <select 
                name="modelType"
                value={formData.modelType}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm text-gray-200"
                required
              >
                <option value="">Select model</option>
                <option value="llm">LLM</option>
                <option value="cnn">CNN</option>
                <option value="gan">GAN</option>
                <option value="transformer">Transformer</option>
              </select>
            </div>

            {/* Dataset Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Dataset Size
              </label>
              <div className="relative">
                <input 
                  type="number"
                  min="0"
                  name="datasetSize"
                  value={formData.datasetSize}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm text-gray-200"
                  placeholder="Size in GB"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">GB</span>
              </div>
            </div>

            {/* Task Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Task Type
              </label>
              <div className="flex gap-2">
                <label className="flex-1 flex items-center p-3 bg-black border border-gray-800 rounded-lg cursor-pointer hover:bg-gray-900 transition-all">
                  <input
                    type="radio"
                    name="taskType"
                    value="training"
                    checked={formData.taskType === "training"}
                    onChange={handleRadioChange}
                    className="hidden peer"
                    required
                  />
                  <div className="w-full text-center text-gray-300 peer-checked:text-blue-400">
                    Training
                  </div>
                </label>
                <label className="flex-1 flex items-center p-3 bg-black border border-gray-800 rounded-lg cursor-pointer hover:bg-gray-900 transition-all">
                  <input
                    type="radio"
                    name="taskType"
                    value="inference"
                    checked={formData.taskType === "inference"}
                    onChange={handleRadioChange}
                    className="hidden peer"
                    required
                  />
                  <div className="w-full text-center text-gray-300 peer-checked:text-blue-400">
                    Inference
                  </div>
                </label>
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Budget
              </label>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input 
                    type="number"
                    min="0"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full pl-6 pr-2 py-2 bg-black border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm text-gray-200"
                    placeholder="Amount"
                    required
                  />
                </div>
                <select 
                  name="budgetType"
                  value={formData.budgetType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm text-gray-200"
                >
                  <option value="hourly">/hr</option>
                  <option value="monthly">/mo</option>
                </select>
              </div>
            </div>

            {/* Region Selector */}
            <RegionSelector 
              value={formData.region}
              onChange={handleRegionChange}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Find Optimal GPU Instance'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}