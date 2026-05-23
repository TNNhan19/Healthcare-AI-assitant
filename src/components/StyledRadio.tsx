import React from 'react';

interface StyledRadioProps {
    name: string;
    options: { value: string; label: string }[];
    selectedValue: string;
    onChange: (value: string) => void;
}

const StyledRadio: React.FC<StyledRadioProps> = ({ name, options, selectedValue, onChange }) => {
    return (
        <div className="flex space-x-4"> {/* Use flexbox for horizontal layout */}
            {options.map((option) => (
                <div key={option.value} className="flex items-center">
                    <input
                        type="radio"
                        id={`${name}-${option.value}`}
                        name={name}
                        value={option.value}
                        checked={selectedValue === option.value}
                        onChange={() => onChange(option.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" // Standard Tailwind classes
                    />
                    <label htmlFor={`${name}-${option.value}`} className="ml-2 block text-sm text-gray-700">
                        {option.label}
                    </label>
                </div>
            ))}
        </div>
    );
};

export default StyledRadio;