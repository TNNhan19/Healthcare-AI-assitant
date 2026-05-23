import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface PackagingOption {
  description: string;
  quantity: number;
  totalPrice: number;
  unitPrice: number;
}

interface PackagingSelectorProps {
  options: PackagingOption[];
  selectedOption: PackagingOption | null;
  onOptionSelect: (option: PackagingOption) => void;
  unitPrice: number;
}

const PackagingSelector: React.FC<PackagingSelectorProps> = ({
  options,
  selectedOption,
  onOptionSelect,
  unitPrice
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (!options || options.length <= 1) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center mb-3">
        <Package className="h-4 w-4 mr-2 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Chọn loại đóng gói:</span>
      </div>
      
      <div className="space-y-2">
        {options.map((option, index) => (
          <label
            key={index}
            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedOption?.description === option.description
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="packaging"
              value={index}
              checked={selectedOption?.description === option.description}
              onChange={() => onOptionSelect(option)}
              className="mr-3 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{option.description}</span>
                <span className="font-bold text-blue-600">{formatPrice(option.totalPrice)}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {option.quantity} viên • {formatPrice(option.unitPrice)}/viên
              </div>
            </div>
          </label>
        ))}
      </div>
      
      {unitPrice > 0 && (
        <div className="mt-3 text-sm text-gray-600">
          <span className="font-medium">Giá đơn vị:</span> {formatPrice(unitPrice)}/viên
        </div>
      )}
    </div>
  );
};

export default PackagingSelector; 