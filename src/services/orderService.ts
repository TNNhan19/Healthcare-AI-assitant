import axios from "axios";
import { Order, OrdersResponse } from "../types/order";

/**
 * ✅ Cấu hình linh hoạt cho API:
 * - Nếu bạn chạy frontend riêng với backend local, để full URL (http://localhost:8080/...)
 * - Nếu chạy chung domain (proxy trong Vite), để relative path '/api/v1/orders'
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") + "/api/v1/orders" ||
  "http://localhost:8080/api/v1/orders";

/**
 * ✅ Helper: lấy token phù hợp với role
 * Ưu tiên thứ tự: pharmacist → admin → user → token
 */
const getToken = (): string | null => {
  return (
    localStorage.getItem("pharmacist_token") ||
    localStorage.getItem("admin_token") ||
    localStorage.getItem("user_token") ||
    localStorage.getItem("token")
  );
};

class OrderService {
  /**
   * 🛒 Tạo đơn hàng mới
   */
  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/create`, orderData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  }

  /**
   * 📦 Lấy danh sách đơn hàng
   * - Hỗ trợ cả phân trang (page, limit)
   * - Tự động fallback sang `/admin/all` nếu không có page/limit
   */
  async getOrders(page?: number, limit?: number): Promise<OrdersResponse | Order[]> {
    const token = getToken();

    if (typeof page === "number" && typeof limit === "number") {
      const response = await axios.get(`${API_BASE_URL}/admin/all?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data as OrdersResponse;
    }

    // Backwards-compatible: trả về array nếu không truyền phân trang
    const response = await axios.get(`${API_BASE_URL}/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data as Order[];
  }

  /**
   * ❌ Hủy đơn hàng
   */
  async cancelOrder(id: string): Promise<Order> {
    const token = getToken();
    // Một số API dùng PUT, một số dùng PATCH → thử PATCH trước, fallback PUT
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (err) {
      const response = await axios.put(
        `${API_BASE_URL}/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    }
  }

  /**
   * 🔄 Cập nhật trạng thái đơn hàng
   */
  async updateStatus(id: string, status: string): Promise<Order> {
    const token = getToken();
    const response = await axios.patch(
      `${API_BASE_URL}/${id}/status`,
      { orderStatus: status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  }
}

export const orderService = new OrderService();
