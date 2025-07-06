import ProductCatComponent from "../components/ProductCatComponent";
import { useLocation } from "react-router-dom";

const ProductCat = () => {
  // Lấy courseType từ query string
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const courseType = queryParams.get("courseType") || "TOEIC"; // Mặc định TOEIC nếu không có

  return (
    <div>
      <ProductCatComponent courseType={courseType} />
    </div>
  );
};

export default ProductCat;
