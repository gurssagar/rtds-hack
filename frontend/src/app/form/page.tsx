"use client";

import { useState, FormEvent, useEffect } from "react";
import RegionSelector from "../../components/page";
import { useRouter } from "next/navigation";
import { useCompletion } from '@ai-sdk/react';
export default function Home() {
  const router = useRouter();
  const { completion, complete } = useCompletion({
    api: '/api/completion',
  });
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
  const [gpuData, setgpuData] = useState('');
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

      const res=  await fetch(`/api/completion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (res.body) {
            const reader = res.body.getReader();
            let result = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              result += new TextDecoder().decode(value);
            }
            // Do something with the result
            console.log(result);
            setgpuData(result)
            // setState(result) or similar
          } else {
            const data = await res.text();
            
            console.log(data,"output");
            // setState(data) or similar
          }
        
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
      
      if (response.ok && result.success) {
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
       // Delay to show the status message
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-900/30 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-6xl font-extralight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 mb-3 text-center tracking-tight">
          GPU Optimizer
        </h1>
        <p className="text-center text-gray-400 mb-12 text-lg font-light tracking-wide">
          Find the perfect GPU instance for your AI workload
        </p>
        
        <div className="bg-gradient-to-b from-gray-900/90 to-black/90 rounded-3xl shadow-2xl p-10 backdrop-blur-xl backdrop-filter border border-gray-800 shadow-blue-500/5">
          {submitStatus && (
            <div className={`mb-6 p-4 rounded-xl backdrop-blur-lg ${
              submitStatus.success
                ? 'bg-green-900/30 text-green-300 border border-green-700/50'
                : 'bg-red-900/30 text-red-300 border border-red-700/50'
            }`}>
              {submitStatus.message}
            </div>
          )}
          
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Dataset Size */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 tracking-wide">
                Dataset Size
              </label>
              <div className="relative group">
                <input
                  type="number"
                  min="0"
                  name="datasetSize"
                  value={formData.datasetSize}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all duration-300 text-sm text-gray-200 hover:border-blue-500/50 group-hover:shadow-lg group-hover:shadow-blue-500/5"
                  placeholder="Size in GB"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-light">GB</span>
              </div>
            </div>

            {/* Task Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 tracking-wide">
                Task Type
              </label>
              <div className="flex gap-4">
                <label className="flex-1 flex items-center p-4 bg-gradient-to-br from-black/50 to-gray-900/50 border border-gray-800 rounded-xl cursor-pointer hover:bg-gray-900/50 transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5">
                  <input
                    type="radio"
                    name="taskType"
                    value="training"
                    checked={formData.taskType === "training"}
                    onChange={handleRadioChange}
                    className="hidden peer"
                    required
                  />
                  <div className="w-full text-center text-gray-300 peer-checked:text-blue-400 font-medium tracking-wide">
                    Training
                  </div>
                </label>
                <label className="flex-1 flex items-center p-4 bg-gradient-to-br from-black/50 to-gray-900/50 border border-gray-800 rounded-xl cursor-pointer hover:bg-gray-900/50 transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5">
                  <input
                    type="radio"
                    name="taskType"
                    value="inference"
                    checked={formData.taskType === "inference"}
                    onChange={handleRadioChange}
                    className="hidden peer"
                    required
                  />
                  <div className="w-full text-center text-gray-300 peer-checked:text-blue-400 font-medium tracking-wide">
                    Inference
                  </div>
                </label>
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 tracking-wide">
                Budget
              </label>
              <div className="flex flex-col gap-3">
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-light">$</span>
                  <input
                    type="number"
                    min="0"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full pl-8 pr-3 py-3 bg-black/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all duration-300 text-sm text-gray-200 hover:border-blue-500/50 group-hover:shadow-lg group-hover:shadow-blue-500/5"
                    placeholder="Amount"
                    required
                  />
                </div>
                <select
                  name="budgetType"
                  value={formData.budgetType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all duration-300 text-base text-white hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5"
                >
                  <option value="hourly" className="text-black bg-white">/hr</option>
                  <option value="monthly" className="text-black bg-white">/mo</option>
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
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 font-semibold text-lg tracking-wide shadow-lg shadow-blue-500/10"
            >
              {isSubmitting ? 'Saving...' : 'Find Optimal GPU Instance'}
            </button>
          </form>

          {/* Completion Output */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-300 mb-4">Completion Output</h2>
            <pre className="bg-black/50 border border-gray-800 rounded-xl p-4 text-sm text-gray-200 overflow-x-auto">
            {gpuData}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}