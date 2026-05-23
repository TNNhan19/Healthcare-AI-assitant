const Product = require('../models/productModel');
const User = require('../models/userModel'); // Assuming the user model is in the same directory
const StockEntry = require('../models/stockEntryModel');
// Get all products
exports.getAllProductsController = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            main_category = '',
            sub_category = '',
            minPrice,
            maxPrice,
            sortBy = 'name'
        } = req.query;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { soDangKy: { $regex: search, $options: 'i' } },
                { registration_number: { $regex: search, $options: 'i' } },
                { registrationNumber: { $regex: search, $options: 'i' } },
                { congTy: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { congTyDangKy: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { thuongHieu: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { hoatChatChinh: { $regex: search, $options: 'i' } },
                { thanhPhan: { $regex: search, $options: 'i' } },
                { dongGoi: { $regex: search, $options: 'i' } },
                { nongDo: { $regex: search, $options: 'i' } },
                { nuocSanXuat: { $regex: search, $options: 'i' } }
            ];
        }
        if (main_category) {
            query.main_category = main_category;
        }
        if (sub_category) {
            query.sub_category = sub_category;
        }
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) {
                query.price.$gte = Number(minPrice);
            }
            if (maxPrice) {
                query.price.$lte = Number(maxPrice);
            }
        }

        let sortOption = {};
        if (sortBy === 'price-asc') {
            sortOption = { price: 1 };
        } else if (sortBy === 'price-desc') {
            sortOption = { price: -1 };
        } else {
            sortOption = { name: 1 };
        }


        const skip = (page - 1) * limit;
        const products = await Product
            .find(query)
            .sort(sortOption)
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        // Add virtual category field
        products.forEach(p => {
            p.category = [p.main_category, p.sub_category].filter(Boolean).join(' > ');
        });

        const total = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
};

// Create new product
exports.createProductController = async (req, res) => {
    let createdProduct = null; // Để rollback nếu cần
    let createdStockEntry = null; // Để rollback stock entry nếu cần
    
    try {
        console.log('=== CREATE PRODUCT START ===');
        console.log('Request method:', req.method);
        console.log('Request URL:', req.url);
        console.log('Request body:', req.body);
        console.log('User from auth:', req.user);
        
        // Debug stock value specifically
        console.log('=== STOCK DEBUG ===');
        console.log('Raw stock from req.body:', req.body.stock);
        console.log('Type of stock:', typeof req.body.stock);
        console.log('Parsed int stock:', parseInt(req.body.stock));
        console.log('ParseFloat stock:', parseFloat(req.body.stock));
        console.log('==================');
        
        const {
            soDangKy, name, main_category, sub_category, price, stock, description, imageUrl,
            // Chi tiết sản phẩm từ frontend
            congTy, congTyDangKy, congTySanXuat, dangBaoChe, thuongHieu, nhaSanXuat, 
            quocGia, cachDongGoi, hanDung, hoatChatChinh, huongDan,
            // Thêm các field còn thiếu
            brand, dongGoi, hanSuDung, linkChiTiet, usageGuideHref, usageGuideImage,
            view, paid, embedding_status, product_info
        } = req.body;

        console.log('Extracted fields:', { soDangKy, name, main_category, sub_category, congTy, hoatChatChinh });

        // Validation cho các trường bắt buộc
        if (!soDangKy || !name || !main_category || !sub_category) {
            console.log('Missing required fields:', { soDangKy: !!soDangKy, name: !!name, main_category: !!main_category, sub_category: !!sub_category });
            console.log('=== RETURNING VALIDATION ERROR ===');
            return res.status(400).json({
                success: false,
                message: "Các trường bắt buộc: soDangKy, name, main_category, sub_category",
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Map các field chi tiết vào details object
        const detailsObject = {
            thanhPhanChinh: hoatChatChinh || '',
            thuongHieu: thuongHieu || brand || '',
            nhaSanXuat: nhaSanXuat || congTySanXuat || '',
            quocGia: quocGia || '',
            cachDongGoi: cachDongGoi || dongGoi || '',
            hanDung: hanDung || hanSuDung || '',
            dangBaoChe: dangBaoChe || '',
            congTy: congTy || '',
            congTyDangKy: congTyDangKy || '',
            congTySanXuat: congTySanXuat || '',
            huongDan: huongDan || '',
            linkChiTiet: linkChiTiet || '',
            usageGuideHref: usageGuideHref || '',
            usageGuideImage: usageGuideImage || ''
        };

        console.log('Details object:', detailsObject);

        const productData = {
            soDangKy,
            name,
            main_category,
            sub_category,
            price: parseFloat(price) || 0,
            stock: parseInt(stock) || 0,
            description: description || '',
            imageUrl: imageUrl || '',
            details: detailsObject,
            // Backward compatibility - lưu trực tiếp vào root level
            congTy: congTy || '',
            thanhPhan: hoatChatChinh || '',
            quocGia: quocGia || '',
            dangBaoChe: dangBaoChe || '',
            dongGoi: dongGoi || cachDongGoi || '',
            hanSuDung: hanSuDung || hanDung || '',
            congTySx: congTySanXuat || '',
            congTyDk: congTyDangKy || '',
            huongDan: huongDan || '',
            brand: brand || thuongHieu || '',
            // Thêm các field mới
            linkChiTiet: linkChiTiet || '',
            usageGuideHref: usageGuideHref || '',
            usageGuideImage: usageGuideImage || '',
            view: parseInt(view) || 0,
            paid: paid || '0',
            embedding_status: embedding_status || 'pending',
            // Product info từ frontend
            product_info: product_info || {}
        };

        console.log('Final product data:', productData);
        console.log('=== ATTEMPTING TO CREATE PRODUCT ===');

        // Tạo product
        const newProduct = await Product.create(productData);
        console.log('Product created successfully:', newProduct._id);
        createdProduct = newProduct; // Lưu để có thể rollback
        
        // Tạo stock entry mặc định cho sản phẩm mới
        console.log('=== CREATING DEFAULT STOCK ENTRY ===');
        console.log('Stock value for stock entry:', stock);
        console.log('Type of stock for stock entry:', typeof stock);
        console.log('Parsed stock for stock entry:', parseInt(stock) || 0);
        
        const stockEntryData = {
            productId: newProduct._id,
            batchNumber: `AUTO-${Date.now()}`, // Tạo batch number tự động với timestamp
            expiryDate: null, // Null cho batch mặc định
            quantity: parseInt(stock) || 0, // Sử dụng stock từ form, không phải hard-code 0
            location: 'Kho mặc định' // Vị trí kho mặc định
        };
        
        console.log('Stock entry data to be created:', stockEntryData);
        
        try {
            const newStockEntry = await StockEntry.create(stockEntryData);
            console.log('Stock entry created successfully with data:', newStockEntry);
            console.log('Final quantity in stock entry:', newStockEntry.quantity);
            createdStockEntry = newStockEntry;
        } catch (stockError) {
            console.error('Stock entry creation failed:', stockError);
            // Rollback product nếu stock entry thất bại
            await Product.findByIdAndDelete(newProduct._id);
            console.log('Product rolled back due to stock entry failure');
            
            return res.status(500).json({
                success: false,
                message: 'Tạo sản phẩm thất bại: Không thể tạo stock entry',
                error: stockError.message,
                errorCode: 'STOCK_ENTRY_ERROR'
            });
        }
        
        console.log('=== RETURNING SUCCESS RESPONSE ===');
        
        return res.status(201).json({
            success: true,
            message: 'Sản phẩm và stock entry đã được tạo thành công',
            data: {
                product: newProduct,
                stockEntry: createdStockEntry
            }
        });
    } catch (error) {
        console.error('=== CREATE PRODUCT ERROR ===');
        console.error('Error details:', error);
        
        // Rollback: Xóa product và stock entry nếu đã tạo
        if (createdStockEntry && createdStockEntry._id) {
            try {
                console.log('=== ROLLING BACK STOCK ENTRY ===');
                await StockEntry.findByIdAndDelete(createdStockEntry._id);
                console.log('Stock entry rollback successful');
            } catch (rollbackError) {
                console.error('Stock entry rollback error:', rollbackError);
            }
        }
        
        if (createdProduct && createdProduct._id) {
            try {
                console.log('=== ROLLING BACK PRODUCT ===');
                await Product.findByIdAndDelete(createdProduct._id);
                console.log('Product rollback successful');
            } catch (rollbackError) {
                console.error('Product rollback error:', rollbackError);
            }
        }
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            // Duplicate key error
            const field = Object.keys(error.keyPattern)[0];
            const value = error.keyValue[field];
            console.error(`Duplicate ${field}: ${value}`);
            console.log('=== RETURNING DUPLICATE ERROR ===');
            return res.status(400).json({ 
                success: false,
                message: `${field === 'soDangKy' ? 'Số đăng ký' : field} "${value}" đã tồn tại`,
                error: `Duplicate ${field}`,
                errorCode: 'DUPLICATE_KEY'
            });
        }
        
        // Validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            console.error('Validation errors:', validationErrors);
            console.log('=== RETURNING VALIDATION ERROR ===');
            return res.status(400).json({ 
                success: false,
                message: 'Dữ liệu không hợp lệ: ' + validationErrors.join(', '),
                error: 'Validation failed',
                errorCode: 'VALIDATION_ERROR',
                details: validationErrors
            });
        }
        
        // Generic error
        console.error('Generic error:', error.message);
        console.log('=== RETURNING GENERIC ERROR ===');
        return res.status(500).json({ 
            success: false,
            message: 'Lỗi server khi tạo sản phẩm: ' + error.message,
            error: error.message,
            errorCode: 'SERVER_ERROR'
        });
    }
};

// Lấy sản phẩm theo category
exports.getProductsByCategoryController = async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category); 
    const { sort, limit } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Thiếu category trong request",
      });
    }

    let query = Product.find({ main_category: category });

    // sort trong MongoDB cho an toàn
    if (sort === "paid") {
      query = query.sort({ paid: -1 });
    } else if (sort === "view") {
      query = query.sort({ view: -1 });
    }

    if (limit) {
      query = query.limit(Number(limit));
    }

    const products = await query.exec();

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get product by ID
exports.getProductByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await Product.findById(id).lean();
        if (product) {
            product.category = [product.main_category, product.sub_category].filter(Boolean).join(' > ');
        }
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
};

// Get product categories (companies)
exports.getProductCategoriesController = async (req, res) => {
    try {
        const categories = await Product.aggregate([
            {
                $group: {
                    _id: '$congTy',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    name: '$_id',
                    count: 1,
                    _id: 0
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// Get main categories
exports.getMainCategoriesController = async (req, res) => {
    try {
        const mainCategories = await Product.aggregate([
            {
                $group: {
                    _id: '$main_category',
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    _id: { $ne: null }
                }
            },
            {
                $project: {
                    name: '$_id',
                    count: 1,
                    _id: 0
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        res.status(200).json({
            success: true,
            data: mainCategories
        });
    } catch (error) {
        console.error('Error fetching main categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching main categories',
            error: error.message
        });
    }
};

// Get subcategories by main category
exports.getSubcategoriesController = async (req, res) => {
    try {
        const { mainCategory } = req.params;
        
        const subcategories = await Product.aggregate([
            {
                $match: {
                    main_category: mainCategory
                }
            },
            {
                $group: {
                    _id: '$sub_category',
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    _id: { $ne: null }
                }
            },
            {
                $project: {
                    name: '$_id',
                    count: 1,
                    _id: 0
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        res.status(200).json({
            success: true,
            data: subcategories
        });
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subcategories',
            error: error.message
        });
    }
};

// Save cart data to user database
exports.saveCartToDatabase = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = req.body.cartItems;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.cart = cartItems;
    await user.save();

    res.status(200).json({ message: 'Cart saved successfully', cart: user.cart });
  } catch (error) {
    res.status(500).json({ message: 'Error saving cart', error });
  }
};

// Delete product (pharmacist/admin)
// Update product
exports.updateProductController = async (req, res) => {
  try {
    console.log('=== UPDATE PRODUCT START ===');
    console.log('Product ID:', req.params.id);
    console.log('User:', req.user?.userName, req.user?.userType);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { id } = req.params;

    // Validate product ID
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID is required',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy sản phẩm',
        errorCode: 'NOT_FOUND'
      });
    }

    console.log('Existing product found:', existingProduct.name);

    // Update product with new data
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: req.body },
      { 
        new: true, // Return updated document
        runValidators: true // Run mongoose validators
      }
    );

    console.log('Product updated successfully:', updatedProduct.name);
    console.log('=== UPDATE PRODUCT END ===');

    return res.status(200).json({ 
      success: true, 
      message: 'Cập nhật sản phẩm thành công',
      product: updatedProduct
    });

  } catch (error) {
    console.error('=== UPDATE PRODUCT ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Dữ liệu không hợp lệ',
        errorCode: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ 
        success: false, 
        message: `${field} đã tồn tại trong hệ thống`,
        errorCode: 'DUPLICATE_KEY',
        field: field
      });
    }

    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'ID sản phẩm không hợp lệ',
        errorCode: 'INVALID_ID'
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi cập nhật sản phẩm', 
      error: error.message,
      errorCode: 'SERVER_ERROR'
    });
  }
};

exports.deleteProductController = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Xóa product
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Xóa tất cả stock entries liên quan đến product này
    const deletedStockEntries = await StockEntry.deleteMany({ productId: id });
    console.log(`Deleted ${deletedStockEntries.deletedCount} stock entries for product ${id}`);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Product deleted successfully',
      deletedStockEntries: deletedStockEntries.deletedCount
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error deleting product', 
      error: error.message 
    });
  }
};

// Cập nhật lượt xem (view) của sản phẩm
exports.incrementViewCountController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    
    // Tăng view lên 1
    product.view = (product.view || 0) + 1;
    await product.save();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Đã cập nhật lượt xem',
      view: product.view
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi cập nhật lượt xem', 
      error: error.message 
    });
  }
};
  exports.searchProductsController = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ success: false, message: 'Query parameter "q" is required.' });
        }

        const products = await Product.find({
            name: { $regex: q, $options: 'i' } // Case-insensitive search
        }).limit(10); // Limit results for performance

        res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching products',
            error: error.message
        });
    }
};
