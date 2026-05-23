// src/components/MiniProductCard.tsx
import React, { useEffect, useState } from "react";

interface MiniProduct {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface Props {
  productId: string;
}

const cache = new Map<string, MiniProduct | null>();

const MiniProductCard: React.FC<Props> = ({ productId }) => {
  const [product, setProduct] = useState<MiniProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    

    const fetchProduct = async () => {
      if (cache.has(productId)) {
        setProduct(cache.get(productId)!);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/v1/products/${productId}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        const p = data.data || data.product || data;
        const mini: MiniProduct = {
          _id: typeof p._id === "object" && p._id.$oid ? p._id.$oid : p._id,
          name: p.name || "Không rõ tên",
          price: Number(p.price) || 0,
          imageUrl: p.imageUrl || p.image || "/placeholder.png",
        };
        cache.set(productId, mini);
        if (mounted) setProduct(mini);
      } catch (err) {
        console.error("❌ Error fetching product:", err);
        cache.set(productId, null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      console.log("🔴 useEffect unmounted:", productId);
    };
  }, [productId]);

  if (loading) return <div className="text-gray-500 text-sm">Đang tải sản phẩm...</div>;
  if (!product)
    return (
      <a href={`/product/${productId}`} className="text-blue-500 hover:underline">
        Xem sản phẩm
      </a>
    );

  return (
    <a
      href={`/product/${product._id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-2 border rounded-lg shadow-sm hover:shadow-md transition-all w-56 bg-white"
    >
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-14 h-14 object-cover rounded-md"
      />
      <div className="overflow-hidden">
        <div className="font-semibold text-gray-900 truncate">{product.name}</div>
        <div className="text-green-600 font-medium text-sm mt-1">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(product.price)}
        </div>
      </div>
    </a>
  );
};

export default MiniProductCard;
