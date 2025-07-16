import Component4 from "../components/Component4";
import { useLocation } from "react-router-dom";

const ProductCat = () => {
  // Lấy courseType từ query string
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const courseType = queryParams.get("courseType") || "TOEIC"; // Mặc định TOEIC nếu không có

  return (
    <div style={{marginTop: 80}}>
      <Component4 courseType={courseType} />
    </div>
  );
};

export default ProductCat;
