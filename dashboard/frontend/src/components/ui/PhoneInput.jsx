import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/helpers';

// Common country codes with flags
const countryCodes = [
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+62', country: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+60', country: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+66', country: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: '+84', country: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+63', country: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: '+27', country: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '+234', country: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', country: 'KE', flag: '🇰🇪', name: 'Kenya' },
  { code: '+20', country: 'EG', flag: '🇪🇬', name: 'Egypt' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+92', country: 'PK', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', country: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+94', country: 'LK', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+977', country: 'NP', flag: '🇳🇵', name: 'Nepal' },
];

function PhoneInput({
  label,
  value = '',
  onChange,
  error,
  helperText,
  className,
  required,
  ...props
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Parse value to extract country code and number
  const parseValue = (val) => {
    if (!val) return { countryCode: '+91', number: '' };
    
    // Check if value starts with a country code
    for (const country of countryCodes) {
      if (val.startsWith(country.code)) {
        return {
          countryCode: country.code,
          number: val.slice(country.code.length).trim(),
        };
      }
    }
    
    // Default to India if no country code found
    return { countryCode: '+91', number: val.replace(/^\+\d+\s*/, '') };
  };

  const { countryCode, number } = parseValue(value);
  
  const selectedCountry = countryCodes.find(c => c.code === countryCode) || countryCodes[0];

  const handleCountryChange = (newCode) => {
    // Combine without space for international format
    const newValue = number ? `${newCode}${number}` : newCode;
    onChange?.({ target: { value: newValue } });
    setIsDropdownOpen(false);
  };

  const handleNumberChange = (e) => {
    const newNumber = e.target.value.replace(/[^\d]/g, ''); // Only allow digits
    // Combine without space for international format
    const newValue = newNumber ? `${countryCode}${newNumber}` : '';
    onChange?.({ target: { value: newValue } });
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative flex">
        {/* Country Code Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'flex items-center gap-1 px-3 py-2.5 border border-r-0 border-gray-300 rounded-l-lg',
              'bg-gray-50 hover:bg-gray-100 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent',
              error && 'border-danger-500'
            )}
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">{selectedCountry.code}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              
              {/* Dropdown List */}
              <div className="absolute top-full left-0 mt-1 z-50 w-64 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                {countryCodes.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountryChange(country.code)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors',
                      country.code === countryCode && 'bg-forest-50 text-forest-700'
                    )}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium">{country.name}</span>
                    <span className="text-sm text-gray-500 ml-auto">{country.code}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={number}
          onChange={handleNumberChange}
          className={cn(
            'flex-1 rounded-r-lg border border-gray-300',
            'px-4 py-2.5 text-gray-900',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500',
            error && 'border-danger-500 focus:ring-danger-500'
          )}
          placeholder="9876543210"
          {...props}
        />
      </div>
      {(error || helperText) && (
        <p className={cn('mt-1 text-sm', error ? 'text-danger-600' : 'text-gray-500')}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export default PhoneInput;
