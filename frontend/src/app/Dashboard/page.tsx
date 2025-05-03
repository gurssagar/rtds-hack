'use client';

import React, { useState ,useEffect} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompletion } from '@ai-sdk/react';
const ChatbotForm = () => {
    const { completion, complete } = useCompletion({
        api: '/api/completion',
      });
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    serverLocation: '',
    pricePerHour: '',
  });

  const [data, setData] = useState<any>(); // Change the type t

  useEffect(() => {
     async function fetchData() {
       await fetch('https://customer.acecloudhosting.com/api/v1/pricing?region=us-east-at-1')
         .then((response) => response.json())
         .then((data) => {
            setData(data); // Update the state with the fetched data
           console.log(data);
         })
         .catch((error) => {
           console.error('Error fetching data:', error);
         });
     }
     fetchData();
  },[])


  const [isComplete, setIsComplete] = useState(false);

  const handleServerLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.serverLocation.trim()) {
      setStep(2);
    }
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.pricePerHour.trim()) {
      setIsComplete(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      serverLocation: '',
      pricePerHour: '',
    });
    setStep(1);
    setIsComplete(false);
  };

  const fadeVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-800 rounded-lg shadow-lg text-white">
      <h1 className="text-2xl font-bold text-center mb-6 text-white">Server Configuration</h1>
      
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeVariants}
            transition={{ duration: 0.3 }}
          >
            <div className="chat chat-start mb-4">
              <div className="chat-bubble bg-gray-700 text-white">
                Please select your server location:
              </div>
            </div>
            
            <form onSubmit={handleServerLocationSubmit} className="mt-4">
              <select
                name="serverLocation"
                value={formData.serverLocation}
                onChange={handleChange}
                className="w-full p-3 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                required
              >
                <option value="">Select a location</option>
                <option value="us-east">US East (N. Virginia)</option>
                <option value="us-west">US West (Oregon)</option>
                <option value="eu-central">EU (Frankfurt)</option>
                <option value="ap-south">Asia Pacific (Mumbai)</option>
                <option value="ap-southeast">Asia Pacific (Singapore)</option>
              </select>
              
              <button
                type="submit"
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </form>
          </motion.div>
        )}
        
        {step === 2 && (
          <motion.div
            key="step2"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeVariants}
            transition={{ duration: 0.3 }}
          >
            <div className="chat chat-start mb-2">
              <div className="chat-bubble bg-gray-700 text-white">
                You selected: {formData.serverLocation}
              </div>
            </div>
            
            <div className="chat chat-start mb-4">
              <div className="chat-bubble bg-gray-700 text-white">
                What is your budget for price per hour (in USD)?
              </div>
            </div>
            
            <form onSubmit={handlePriceSubmit} className="mt-4">
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">$</span>
                <input
                  type="number"
                  name="pricePerHour"
                  value={formData.pricePerHour}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full p-3 pl-8 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                  required
                />
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </motion.div>
        )}
        
        {isComplete && (
          <motion.div
            key="complete"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeVariants}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="chat chat-start mb-4">
              <div className="chat-bubble bg-green-800 text-white">
                Thank you! Your configuration has been saved.
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-md mt-4 text-left">
              <h3 className="font-bold mb-2 text-white">Configuration Summary:</h3>
              <p><span className="font-semibold text-gray-300">Server Location:</span> {formData.serverLocation}</p>
              <p><span className="font-semibold text-gray-300">Price Per Hour:</span> ${formData.pricePerHour}</p>
            </div>
            
            <button
              onClick={resetForm}
              className="mt-6 bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
            >
              Start Over
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
      <button
        onClick={async () => {
          await complete(
            "hey",
          );
        }}
      >
        Schedule a call
      </button>

      {completion}
    </div>



    </div>
  );
};

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Dashboard</h1>
      <ChatbotForm />
    </div>
  );
}