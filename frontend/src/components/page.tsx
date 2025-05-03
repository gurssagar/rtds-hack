'use client';
import ReactCountryFlag from "react-country-flag";
import { useState } from 'react';

interface Region {
  id: string;
  name: string;
  countryCode: string;  // Changed from flag to countryCode
  country: string;
  timezone: string;
}

const regions: Region[] = [
  { 
    id: 'us-east-1',
    name: 'US East (N. Virginia)',
    countryCode: 'US',
    country: 'United States',
    timezone: 'EST'
  },
  { 
    id: 'us-west-1',
    name: 'US West (California)',
    countryCode: 'US',
    country: 'United States',
    timezone: 'PST'
  },
  { 
    id: 'in-south-1',
    name: 'India South (Mumbai)',
    countryCode: 'IN',
    country: 'India',
    timezone: 'IST'
  },
  { 
    id: 'in-north-1',
    name: 'India North (Delhi)',
    countryCode: 'IN',
    country: 'India',
    timezone: 'IST'
  },
  { 
    id: 'sg-1',
    name: 'Singapore',
    countryCode: 'SG',
    country: 'Singapore',
    timezone: 'SGT'
  },
  { 
    id: 'jp-east-1',
    name: 'Japan East (Tokyo)',
    countryCode: 'JP',
    country: 'Japan',
    timezone: 'JST'
  },
  { 
    id: 'au-east-1',
    name: 'Australia East (Sydney)',
    countryCode: 'AU',
    country: 'Australia',
    timezone: 'AEST'
  },
  { 
    id: 'uk-1',
    name: 'UK (London)',
    countryCode: 'GB',
    country: 'United Kingdom',
    timezone: 'GMT'
  },
  { 
    id: 'de-central-1',
    name: 'Germany (Frankfurt)',
    countryCode: 'DE',
    country: 'Germany',
    timezone: 'CET'
  },
  { 
    id: 'br-east-1',
    name: 'Brazil East (São Paulo)',
    countryCode: 'BR',
    country: 'Brazil',
    timezone: 'BRT'
  }
];

interface RegionSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RegionSelector({ value, onChange }: RegionSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredRegions = regions.filter(region => 
    region.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    region.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300 tracking-wide">
        Region
      </label>
      <div className="relative group">
        <input
          type="text"
          className="w-full px-4 py-3 bg-black/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all duration-300 text-sm text-gray-200 hover:border-blue-500/50 group-hover:shadow-lg group-hover:shadow-blue-500/5"
          placeholder="Search regions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="mt-2 max-h-[300px] overflow-y-auto rounded-xl bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-xl backdrop-filter border border-gray-800 shadow-blue-500/5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black/20 [&::-webkit-scrollbar-thumb]:bg-blue-900/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-blue-800/50">
        {filteredRegions.map((region) => (
          <button
            key={region.id}
            type="button"
            className={`flex items-center gap-3 p-4 w-full transition-all duration-300 ${
              value === region.id
                ? 'bg-gradient-to-br from-black/50 to-gray-900/50 border-l-4 border-blue-500 text-blue-400'
                : 'hover:bg-gradient-to-br from-black/30 to-gray-900/30 border-l-4 border-transparent text-gray-300 hover:text-white'
            }`}
            onClick={() => onChange(region.id)}
          >
            <ReactCountryFlag
              countryCode={region.countryCode}
              svg
              style={{
                width: '2em',
                height: '2em'
              }}
              title={region.country}
            />
            <div className="text-left flex-1">
              <div className="text-sm font-medium">{region.country}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {region.name} • {region.timezone}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}