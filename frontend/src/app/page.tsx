'use client'
import Image from "next/image";
import Link from "next/link";
import {useState,useEffect} from 'react';

import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';
import Spline from '@splinetool/react-spline';
export default function Home() {
  useEffect(() => {
		createChat({
      webhookUrl: 'https://gursagar.app.n8n.cloud/webhook/8575400e-8da1-4320-8c99-bbf3aefe89d6/chat'
    });
	}, []);
  
  return (
    <>
      <div>
        <div className=" flex justify-between mx-auto mt-4 px-4 py-2 rounded-full w-[80vw] bg-black">
          <Image
            src="/logowhite.png"
            alt="hero"
            width={100}
            height={100} 
            className="my-auto">
            
            </Image>
            <nav className="flex space-x-6 my-auto">
            <Link href="/workload" className="hover:text-blue-300 transition-colors">
              Workload Input
            </Link>
            <Link href="/recommendations" className="hover:text-blue-300 transition-colors">
              Recommendations
            </Link>
            <Link href="/cost-comparison" className="hover:text-blue-300 transition-colors">
              Cost Comparison
            </Link>
            <Link href="/explanations" className="hover:text-blue-300 transition-colors">
              Explanations
            </Link>
          </nav>
          
          <div className="flex items-center ">
          <Link href="/SignIn">
            <button className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-full transition-colors">
              Login 
            </button>
          </Link>
          </div>
        </div>


        <div className="flex flex-col md:flex-row items-center justify-center min-h-[70vh] px-8 gap-8">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-6">Optimize Your Cloud GPU Resources</h1>
            <p className="text-xl mb-8">
              Get personalized recommendations for GPU allocation based on your workload requirements
              and budget constraints.
            </p>
            <div className="flex gap-4">
              <a href="/SignIn" >

              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-colors">
                Get Started
              </button>
              </a>
              <button className="border-2 border-gray-300 hover:bg-gray-100 hover:text-black px-6 py-3 rounded-full transition-colors">
                Learn More
              </button>
            </div>
          </div>
          <div className="w-[80vw] h-[20vh] z-0 flex items-center justify-center">
              <Image src="/gpu.webp" alt="hero" width={800} height={800}></Image>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-[#0a0a0a]">
          <div className="container mx-auto px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-black p-6 rounded-xl shadow-md">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Workload Analysis</h3>
                <p className="text-gray-600">Analyze your computational needs and get tailored GPU recommendations based on your specific workload patterns.</p>
              </div>
              
              <div className="bg-black p-6 rounded-xl shadow-md">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Cost Optimization</h3>
                <p className="text-gray-600">Compare pricing across different cloud providers and instance types to find the most cost-effective solution for your needs.</p>
              </div>
              
              <div className="bg-black p-6 rounded-xl shadow-md">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Intelligent Recommendations</h3>
                <p className="text-gray-600">Get AI-powered recommendations that balance performance requirements with budget constraints.</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="py-16">
          <div className="container mx-auto px-8">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex flex-col items-center mb-8 md:mb-0">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Input Your Workload</h3>
                <p className="text-gray-600 text-center max-w-xs">Describe your computational needs and performance requirements.</p>
              </div>
              
              <div className="w-full md:w-auto flex justify-center my-4 md:my-0">
                <svg className="hidden md:block w-24 h-6" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 12H0" stroke="#CBD5E0" strokeWidth="2"/>
                  <path d="M100 12L90 6V18L100 12Z" fill="#CBD5E0"/>
                </svg>
                <div className="block md:hidden w-6 h-12">
                  <svg viewBox="0 0 24 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0V50" stroke="#CBD5E0" strokeWidth="2"/>
                    <path d="M12 50L6 40H18L12 50Z" fill="#CBD5E0"/>
                  </svg>
                </div>
              </div>
              
              <div className="flex flex-col items-center mb-8 md:mb-0">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">Get Recommendations</h3>
                <p className="text-gray-600 text-center max-w-xs">Our AI analyzes your needs and suggests optimal GPU configurations.</p>
              </div>
              
              <div className="w-full md:w-auto flex justify-center my-4 md:my-0">
                <svg className="hidden md:block w-24 h-6" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 12H0" stroke="#CBD5E0" strokeWidth="2"/>
                  <path d="M100 12L90 6V18L100 12Z" fill="#CBD5E0"/>
                </svg>
                <div className="block md:hidden w-6 h-12">
                  <svg viewBox="0 0 24 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0V50" stroke="#CBD5E0" strokeWidth="2"/>
                    <path d="M12 50L6 40H18L12 50Z" fill="#CBD5E0"/>
                  </svg>
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Deploy & Save</h3>
                <p className="text-gray-600 text-center max-w-xs">Implement the recommended solution and optimize your cloud costs.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="py-16 bg-[#0a0a0a]">
          <div className="container mx-auto px-8">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-black p-6 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                  <div>
                    <h4 className="font-semibold">Sarah Johnson</h4>
                    <p className="text-gray-600 text-sm">ML Engineer at TechCorp</p>
                  </div>
                </div>
                <p className="text-gray-700">"This tool helped us reduce our cloud GPU costs by 40% while maintaining the same performance for our machine learning workloads. Highly recommended!"</p>
              </div>
              
              <div className="bg-black p-6 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                  <div>
                    <h4 className="font-semibold">Michael Chen</h4>
                    <p className="text-gray-600 text-sm">CTO at DataViz</p>
                  </div>
                </div>
                <p className="text-gray-700">"The recommendations were spot-on for our deep learning projects. We're now getting better performance at a lower cost. The ROI was immediate."</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 bg-blue-600">
          <div className="container mx-auto px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Optimize Your GPU Resources?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">Join thousands of companies that are saving on cloud costs while maximizing GPU performance.</p>
            <button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-full text-lg font-semibold transition-colors">
              Get Started Today
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">AceCloud</h3>
                <p className="text-gray-400">Optimizing cloud GPU resources for maximum performance and cost efficiency.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Case Studies</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Connect</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">GitHub</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} AceCloud. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
