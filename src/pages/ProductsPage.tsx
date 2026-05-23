import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { productService, ProductFrontend, ProductCategory } from '../services/productService';
import { Search } from 'lucide-react';
import PageBackground from '../components/PageBackground';


const ProductsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    const [allProducts, setAllProducts] = useState<ProductFrontend[]>([]);
    const [mainCategories, setMainCategories] = useState<ProductCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [subCategories, setSubCategories] = useState<{ name: string; count: number }[]>([]);

    const [selectedMainCategory, setSelectedMainCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
    const [sortBy, setSortBy] = useState('name');
    const [searchTerm, setSearchTerm] = useState(searchQuery);

    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 12
    });
    // State for country origins filter
    const [countryOrigins, setCountryOrigins] = useState<string[]>([]);
    
    // Đã loại bỏ hàm handleViewIncrement
    // Giờ đây lượt xem chỉ được cập nhật trong trang chi tiết sản phẩm

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true);
                const res = await productService.getMainCategories();
                setMainCategories(res.data);
            } catch (err) {
                setCategoriesError('Failed to load categories.');
            } finally {
                setCategoriesLoading(false);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedMainCategory) {
            productService.getSubcategories(selectedMainCategory).then(res => setSubCategories(res.data));
        } else {
            setSubCategories([]);
        }
    }, [selectedMainCategory]);

    const fetchProducts = useCallback(async (page = 1) => {
        setLoading(true);
        const params: any = {
            search: searchQuery,
            page,
            limit: pagination.itemsPerPage,
            sortBy,
        };
        if (selectedMainCategory) params.main_category = selectedMainCategory;
        if (selectedSubCategory) params.sub_category = selectedSubCategory;
        if (priceRange.min) params.minPrice = priceRange.min;
        if (priceRange.max) params.maxPrice = priceRange.max;
        if (countryOrigins.length > 0) params.countryOrigins = countryOrigins.join(',');

        try {
            const res = await productService.getProducts(params);
            
            // Chuyển đổi sản phẩm từ dữ liệu API (không cần đọc từ localStorage)
            const products = res.data.map(product => 
                productService.transformProductToProduct(product)
            );
            
            setAllProducts(products);
            setPagination(res.pagination);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, priceRange, sortBy, selectedMainCategory, selectedSubCategory, pagination.itemsPerPage, countryOrigins]);

    // Initial fetch when component mounts or dependencies change
    useEffect(() => {
        fetchProducts(1);
    }, [fetchProducts]);
    
    // Handler for toggling country origins
    const toggleCountryOrigin = (country: string) => {
        setCountryOrigins(prev => 
            prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
        );
    };


    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchProducts(newPage);
        }
    };

    if (categoriesLoading) {
        return <div className="text-center py-12">Đang tải danh mục...</div>;
    }

    if (categoriesError) {
        return <div className="text-center py-12 text-red-500">{categoriesError}</div>;
    }

    return (
        <PageBackground>
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Hero Section */}
            <div className="mb-10">
                <div className="bg-gradient-to-r from-blue-500/90 to-teal-400/80 rounded-lg px-8 py-10">
                    <div className="flex flex-col items-start">
                        <span className="bg-green-100 text-green-800 text-sm font-semibold px-4 py-1 rounded-full mb-4">Chất lượng</span>
                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Sản phẩm của chúng tôi</h1>
                        <p className="text-white/90 text-lg mb-6">Khám phá danh mục sản phẩm đa dạng và chất lượng cao của chúng tôi.</p>
                        

                    </div>
                </div>
            </div>
            
            {/* Category Pills - Moved above the filter section */}
            <div className="mb-8">
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => {
                            setSelectedMainCategory('');
                            setSelectedSubCategory('');
                        }}
                        className={`px-6 py-3 rounded-lg text-base font-semibold border transition ${!selectedMainCategory ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                            }`}
                    >
                        Tất cả
                    </button>
                    {mainCategories.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => {
                                setSelectedMainCategory(cat.name);
                                setSelectedSubCategory('');
                            }}
                            className={`px-6 py-3 rounded-lg text-base font-semibold border transition ${selectedMainCategory === cat.name
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                                }`}
                        >
                            {cat.name} ({cat.count})
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Filters Section */}
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-72">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between border-b pb-3 mb-6">
                            <h3 className="font-semibold text-lg">Bộ lọc nâng cao</h3>
                            <button className="text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"></path><path d="M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        {/* Subcategories */}
                        {subCategories.length > 0 && (
                            <div className="mb-6">
                                <h4 className="font-medium mb-3 text-gray-700">Loại thuốc</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    <label className="flex items-center px-3 py-2 rounded-md transition hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedSubCategory === ''}
                                            onChange={() => setSelectedSubCategory('')}
                                            className="mr-2 accent-blue-600"
                                        />
                                        <span>Tất cả</span>
                                    </label>
                                    {subCategories.map((cat) => (
                                        <label key={cat.name} className="flex items-center px-3 py-2 rounded-md transition hover:bg-gray-50 cursor-pointer justify-between">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSubCategory === cat.name}
                                                    onChange={() => setSelectedSubCategory(cat.name)}
                                                    className="mr-2 accent-blue-600"
                                                />
                                                <span>{cat.name}</span>
                                            </div>
                                            <span className="text-sm text-gray-500">({cat.count})</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Price Range */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-700">Giá bán</h4>
                                <button className="text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </button>
                            </div>
                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        setPriceRange({ min: 0, max: 100000 });
                                    }}
                                    className="w-full text-center py-3 border border-gray-200 rounded-md hover:border-blue-500 transition"
                                >
                                    Dưới 100.000đ
                                </button>
                                <button
                                    onClick={() => {
                                        setPriceRange({ min: 100000, max: 300000 });
                                    }}
                                    className="w-full text-center py-3 border border-gray-200 rounded-md hover:border-blue-500 transition"
                                >
                                    100.000đ đến 300.000đ
                                </button>
                                <button
                                    onClick={() => {
                                        setPriceRange({ min: 300000, max: 500000 });
                                    }}
                                    className="w-full text-center py-3 border border-gray-200 rounded-md hover:border-blue-500 transition"
                                >
                                    300.000đ đến 500.000đ
                                </button>
                                <button
                                    onClick={() => {
                                        setPriceRange({ min: 500000, max: 10000000 });
                                    }}
                                    className="w-full text-center py-3 border border-gray-200 rounded-md hover:border-blue-500 transition"
                                >
                                    Trên 500.000đ
                                </button>
                            </div>
                        </div>


                        {/* Nước sản xuất */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-700">Nước sản xuất</h4>
                                <button className="text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </button>
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center px-2 py-1">
                                    <input 
                                        type="checkbox"
                                        checked={countryOrigins.length === 0}
                                        onChange={() => setCountryOrigins([])}
                                        className="mr-2 accent-blue-600"
                                    />
                                    <span>Tất cả</span>
                                </label>
                                <label className="flex items-center px-2 py-1">
                                    <input 
                                        type="checkbox"
                                        checked={countryOrigins.includes('VN')}
                                        onChange={() => toggleCountryOrigin('VN')}
                                        className="mr-2 accent-blue-600"
                                    />
                                    <span>Việt Nam</span>
                                </label>
                                <label className="flex items-center px-2 py-1">
                                    <input 
                                        type="checkbox"
                                        checked={countryOrigins.includes('CH')}
                                        onChange={() => toggleCountryOrigin('CH')}
                                        className="mr-2 accent-blue-600"
                                    />
                                    <span>Thụy Sĩ</span>
                                </label>
                                <label className="flex items-center px-2 py-1">
                                    <input 
                                        type="checkbox"
                                        checked={countryOrigins.includes('IN')}
                                        onChange={() => toggleCountryOrigin('IN')}
                                        className="mr-2 accent-blue-600"
                                    />
                                    <span>Ấn Độ</span>
                                </label>
                            </div>
                        </div>
                        
                        {/* Sort By */}
                        <div>
                            <h4 className="font-medium mb-3 text-gray-700">Sort By</h4>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                            >
                                <option value="name">Tên (A-Z)</option>
                                <option value="price-asc">Giá (Thấp đến cao)</option>
                                <option value="price-desc">Giá (Cao đến thấp)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    {/* Results Count and Sort */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                        <div className="mb-3 sm:mb-0">
                            {!loading && (
                                <p className="text-gray-700 font-medium">
                                    Showing {pagination.totalItems > 0 ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-600">Clear</span>
                            <button 
                                onClick={() => {
                                    setSelectedMainCategory('');
                                    setSelectedSubCategory('');
                                    setPriceRange({ min: 0, max: 10000000 });
                                    setCountryOrigins([]);
                                    setSortBy('name');
                                    window.history.pushState(null, '', window.location.pathname);
                                    window.location.reload();
                                }}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>

                    {/* Products Display */}
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            <span className="ml-3 text-gray-600">Đang tải...</span>
                        </div>
                    ) : allProducts.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 text-lg mb-4">
                                Không tìm thấy sản phẩm phù hợp.
                            </p>
                            <button
                                onClick={() => {
                                    setSelectedMainCategory('');
                                    setSelectedSubCategory('');
                                    setPriceRange({ min: 0, max: 10000000 });
                                    setCountryOrigins([]);
                                    setSortBy('name');
                                    window.history.pushState(null, '', window.location.pathname);
                                    window.location.reload();
                                }}
                                className="text-blue-600 hover:text-blue-800 underline"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                                {allProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        viewMode="grid"
                                    />
                                ))}
                            </div>
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center mt-10">
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                        className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 mr-2"
                                    >
                                        Trước
                                    </button>
                                    <span className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md">
                                        Trang {pagination.currentPage} / {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage === pagination.totalPages}
                                        className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 ml-2"
                                    >
                                        Sau
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
        </PageBackground>
    );
    
};

export default ProductsPage;