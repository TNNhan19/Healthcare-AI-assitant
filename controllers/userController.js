const userModel = require("../models/userModel");
const bcryptjs = require("bcryptjs");
const { validationResult } = require("express-validator");
const getUserController= async (req,res)=>{
  try {
      const user = await userModel.findById(req.user.id).select("-password");
      //validate user
      if(!user){
          return res.status(404).send({
              success: false,
              message: "User not found"
          });
      }
      //hide password
      user.password = undefined;  
      res.status(200).send({
          success: true,
          message: "User fetched successfully",
          user
      })

  } catch (error) {
      console.log(error);
      res.status(500).send({
          success: false,
          message:"Eror in getting user",
          error: error.message
      })
  }

};
// RESET PASSWORD
const resetPasswordController = async (req, res) => {
  try {
      const { email,answer, newPassword } = req.body;
      if (!answer || !newPassword ||! email) {
          return res.status(400).send({
              success: false,
              message: "All fields are required"
          });
      }
      const user = await userModel.findOne({ email, answer });
      if (!user) {
          return res.status(404).send({
              success: false,
              message: "User not found or answer is incorrect"
          });
      }
      var salt = bcryptjs.genSaltSync(10);
      const hashedPassword = await bcryptjs.hash(newPassword, salt);
      user.password = hashedPassword; // Assuming password is hashed in the model
      await user.save();
      res.status(200).send({
          success: true,
          message: "Password reset successfully"
      });
  } catch (error) {
      console.log(error);
      res.status(500).send({
          success: false,
          message: "Error in resetting password",
          error: error.message
      });
  }
};
const updatePasswordController = async (req, res) => {
  try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
          return res.status(400).send({
              success: false,
              message: "All fields are required"
          });
      }
      const user = await userModel.findById(req.user.id);
      if (!user) {
          return res.status(404).send({
              success: false,
              message: "User not found"
          });
      }
      // Check if old password matches
      const isMatch = await bcryptjs.compare(oldPassword,user.password); // Assuming comparePassword is a method
      if (!isMatch) {
          return res.status(400).send({
              success: false,
              message: "Old password is incorrect"
          });
      }
      var salt=bcryptjs.genSaltSync(10);
      const hashedPassword = await bcryptjs.hash(newPassword, salt);
      user.password = hashedPassword; // Assuming password is hashed in the model
      await user.save();
      res.status(200).send({
          success: true,
          message: "Password updated successfully"
      });
  } catch (error) {
      console.log(error);
      res.status(500).send({
          success: false,
          message: "Error in updating password",
          error: error.message
      });
  }
};
const deleteAccountController = async (req, res) => {
try {
  // Nếu xác thực bằng token, dùng id từ req.user
  const user = await userModel.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).send({
      success: false,
      message: "User not found"
    });
  }
  res.status(200).send({
    success: true,
    message: "User deleted successfully"
  });
} catch (error) {
  console.log(error);
  res.status(500).send({
    success: false,
    message: "Error in deleting user",
    error: error.message
  });
}
};
const updateUserController = async (req, res) => {
try {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const userId = req.user.id;
  const updatedData = req.body;

  // Handle profile picture update
  // If a file is uploaded, construct the URL for it
  if (req.file) {
    updatedData.profile = `/uploads/${req.file.filename}`;
  }
  // If a profile URL is provided in the body and no file is uploaded, it's used directly
  // The validation in the route ensures it's a valid URL format

  if (updatedData.dob) {
    updatedData.dob = new Date(updatedData.dob);
  }

  // Find the user by ID and update their data
  const user = await userModel.findByIdAndUpdate(userId, updatedData, { new: true });

  // If the user is not found, return a 404 error
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Hide the password from the returned user object
  user.password = undefined;

  // Return a success response with the updated user data
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user
  });
} catch (error) {
  // Log any errors and return a 500 server error
  console.error('Error updating profile:', error);
  res.status(500).json({
    success: false,
    message: 'Error updating profile',
    error: error.message
  });
}
};

// Admin Update User Controller
const adminUpdateUserController = async (req, res) => {
try {
  console.log('=== ADMIN UPDATE USER START ===');
  console.log('Admin ID:', req.user.id);
  console.log('User ID to update:', req.params.id);
  console.log('Update data:', req.body);

  // Check if user is admin
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ admin mới có quyền cập nhật người dùng',
      errorCode: 'ADMIN_REQUIRED'
    });
  }

  const { userName, email, phone, userType, isActive, addresses, address } = req.body;
  const userId = req.params.id;

  console.log('Extracted address field:', address);
  console.log('Extracted addresses field:', addresses);

  // Validate required fields
  if (!userName || !email) {
    return res.status(400).json({
      success: false,
      message: 'Tên người dùng và email là bắt buộc',
      errorCode: 'VALIDATION_ERROR'
    });
  }

  // Validate phone format if provided
  if (phone && !/^0\d{9}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 số',
      errorCode: 'VALIDATION_ERROR'
    });
  }

  // Check if user exists
  const existingUser = await userModel.findById(userId);
  if (!existingUser) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy người dùng',
      errorCode: 'USER_NOT_FOUND'
    });
  }

  // Check for duplicate email (exclude current user)
  const duplicateEmailUser = await userModel.findOne({ 
    email: email, 
    _id: { $ne: userId } 
  });
  if (duplicateEmailUser) {
    return res.status(409).json({
      success: false,
      message: 'Email đã tồn tại trong hệ thống',
      errorCode: 'DUPLICATE_EMAIL'
    });
  }

  // Prepare update data
  const updateData = {
    userName,
    email,
    phone: phone || '',
    userType: userType || 'client',
    isActive: isActive !== undefined ? isActive : true
  };

  // Handle address update - lưu vào field address hiện có
  if (address !== undefined) {
    if (address && address.trim()) {
      // Lưu address như string trực tiếp vào array address[0]
      updateData.address = [address.trim()];
      console.log('Saving address string to address array:', address.trim());
    } else {
      // Nếu address trống thì xóa array
      updateData.address = [];
    }
  }

  console.log('Final update data:', JSON.stringify(updateData, null, 2));

  // Update user
  const updatedUser = await userModel.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  );

  console.log('User updated successfully:', updatedUser.userName);
  console.log('=== ADMIN UPDATE USER END ===');

  // Remove password from response
  const userResponse = updatedUser.toObject();
  delete userResponse.password;

  return res.status(200).json({
    success: true,
    message: 'Cập nhật người dùng thành công',
    user: userResponse
  });

} catch (error) {
  console.error('=== ADMIN UPDATE USER ERROR ===');
  console.error('Error:', error);

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

  return res.status(500).json({
    success: false,
    message: 'Lỗi server khi cập nhật người dùng',
    error: error.message,
    errorCode: 'SERVER_ERROR'
  });
}
};

const addAddressController = async (req, res) => {
try {
  const userId = req.user.id;
  const newAddress = req.body; // { fullName, phone, address, city, district, ward, lat, lng }

  const user = await userModel.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  user.address.push(newAddress);

  // Nếu chưa có defaultAddress thì set luôn
  if (!user.defaultAddress) {
    user.defaultAddress = user.address[user.address.length - 1]._id;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Address added successfully",
    address: user.address,
    defaultAddress: user.defaultAddress
  });
} catch (error) {
  console.error("Error adding address:", error);
  res.status(500).json({ success: false, message: "Server error", error: error.message });
}
};
const setDefaultAddressController = async (req, res) => {
try {
  const userId = req.user.id;
  const { addressId } = req.body;

  const user = await userModel.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const exists = user.address.id(addressId);
  if (!exists) {
    return res.status(400).json({ success: false, message: "Address not found" });
  }

  user.defaultAddress = addressId;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Default address updated successfully",
    defaultAddress: user.defaultAddress
  });
} catch (error) {
  console.error("Error updating default address:", error);
  res.status(500).json({ success: false, message: "Server error", error: error.message });
}
};
const getAllUsersController = async (req, res) => {
try {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const { q, type, active } = req.query;

  const query = {};

  // 🔍 filter theo tên hoặc email
  if (q) {
    query.$or = [
      { userName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  // filter theo userType
  if (type) {
    query.userType = type;
  }

  // filter theo trạng thái active
  if (active !== undefined) {
    query.isActive = active === "true";
  }

  const totalItems = await userModel.countDocuments(query);
  const users = await userModel.find(query)
    .select("-password")
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: users,
    pagination: {
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      itemsPerPage: limit,
    },
  });
} catch (error) {
  console.error("Error fetching users:", error);
  res.status(500).json({
    success: false,
    message: "Error fetching users",
    error: error.message,
  });
}
};

// CREATE USER (Admin only)
const createUserController = async (req, res) => {
try {
  console.log('=== CREATE USER START ===');
  console.log('Request user:', req.user?.userName, req.user?.userType);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  // Check if user is admin
  if (req.user?.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ admin mới có thể tạo người dùng mới',
      errorCode: 'FORBIDDEN'
    });
  }

  const { userName, email, phone, userType, isActive, password, addresses } = req.body;

  // Validation
  if (!userName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Tên người dùng, email và mật khẩu là bắt buộc',
      errorCode: 'VALIDATION_ERROR'
    });
  }

  // Check if user already exists
  const existingUser = await userModel.findOne({ 
    $or: [{ email }, { userName }] 
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: existingUser.email === email ? 'Email đã tồn tại' : 'Tên người dùng đã tồn tại',
      errorCode: 'USER_EXISTS'
    });
  }

  // Hash password
  const salt = bcryptjs.genSaltSync(10);
  const hashedPassword = await bcryptjs.hash(password, salt);

  // Create new user
  const newUser = new userModel({
    userName,
    email,
    phone: phone || '',
    userType: userType || 'client',
    isActive: isActive !== undefined ? isActive : true,
    password: hashedPassword,
    addresses: addresses || []
  });

  await newUser.save();

  console.log('User created successfully:', newUser.userName);
  console.log('=== CREATE USER END ===');

  // Remove password from response
  const userResponse = newUser.toObject();
  delete userResponse.password;

  return res.status(201).json({
    success: true,
    message: 'Tạo người dùng thành công',
    user: userResponse
  });

} catch (error) {
  console.error('=== CREATE USER ERROR ===');
  console.error('Error:', error);
  console.error('Error message:', error.message);

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

  return res.status(500).json({
    success: false,
    message: 'Lỗi server khi tạo người dùng',
    error: error.message,
    errorCode: 'SERVER_ERROR'
  });
}
};

// Save a web-push subscription for the authenticated user
const pushSubscribeController = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription object' });
    }
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.pushSubscriptions = user.pushSubscriptions || [];
    const exists = user.pushSubscriptions.some(s => s.endpoint === subscription.endpoint);
    if (!exists) user.pushSubscriptions.push(subscription);
    await user.save();
    res.json({ success: true });
  } catch (e) {
    console.error('Push subscribe error', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// Remove a push subscription for the authenticated user
const pushUnsubscribeController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ success: false, message: 'endpoint required' });
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.pushSubscriptions = (user.pushSubscriptions || []).filter(s => s.endpoint !== endpoint);
    await user.save();
    res.json({ success: true });
  } catch (e) {
    console.error('Push unsubscribe error', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// Export new controllers
module.exports.pushSubscribeController = pushSubscribeController;
module.exports.pushUnsubscribeController = pushUnsubscribeController;

module.exports = {
  getUserController,
  resetPasswordController,
  updatePasswordController,
  deleteAccountController,
  updateUserController,
  addAddressController,
  adminUpdateUserController,
  createUserController,
  setDefaultAddressController,
  getAllUsersController
};