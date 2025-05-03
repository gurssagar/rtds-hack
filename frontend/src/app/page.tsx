import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-light text-gray-800 mb-2 text-center">GPU Optimizer</h1>
        <p className="text-center text-gray-600 mb-12">Find the perfect GPU instance for your AI workload</p>
        
        <div className="bg-white rounded-2xl shadow-sm p-8 backdrop-blur-sm backdrop-filter">
          <form className="space-y-6">
            {/* First Row: Model, Dataset, Task Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* AI/ML Model Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  AI/ML Model Type
                </label>
                <select 
                  className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm"
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
                <label className="text-sm font-medium text-gray-600">
                  Dataset Size
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm"
                    placeholder="Size in GB"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">GB</span>
                </div>
              </div>

              {/* Task Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Task Type
                </label>
                <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                  <label className="flex-1">
                    <input
                      type="radio"
                      name="taskType"
                      value="training"
                      className="peer hidden"
                    />
                    <div className="p-1 text-center rounded-md text-sm cursor-pointer peer-checked:bg-white peer-checked:shadow-sm peer-checked:text-blue-600 transition-all">
                      Training
                    </div>
                  </label>
                  <label className="flex-1">
                    <input
                      type="radio"
                      name="taskType"
                      value="inference"
                      className="peer hidden"
                    />
                    <div className="p-1 text-center rounded-md text-sm cursor-pointer peer-checked:bg-white peer-checked:shadow-sm peer-checked:text-blue-600 transition-all">
                      Inference
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Second Row: Budget and Region */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Budget
                </label>
                <div className="flex gap-1">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input 
                      type="number"
                      min="0"
                      className="w-full pl-6 pr-2 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm"
                      placeholder="Amount"
                    />
                  </div>
                  <select 
                    className="w-24 px-2 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm"
                  >
                    <option value="hourly">/hr</option>
                    <option value="monthly">/mo</option>
                  </select>
                </div>
              </div>

              {/* Preferred Region */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  Region
                </label>
                <select 
                  className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm"
                >
                  <option value="">Select region</option>
                  <option value="us-east">US East</option>
                  <option value="us-west">US West</option>
                  <option value="eu-west">EU West</option>
                  <option value="eu-central">EU Central</option>
                  <option value="asia-east">Asia East</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:-translate-y-0.5"
            >
              Find Optimal GPU Instance
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}