import React from 'react';
import '../main.css';

const ProductCard = ({ top, left, mainImg, iconImg }) => {
  return (
    <div className="productCat-card" style={{ top: `${top}px`, left: `${left}px`, position: 'absolute' }}>
      <div className="productCat-cardInner">
        <img className="productCat-mainImage" src={mainImg} alt="main" />
        <img className="productCat-iconImage" src={iconImg} alt="icon" />
        <div className="productCat-title">Các yếu tố cần thiết để điểm cao</div>
        <div className="productCat-subtitle">Sơ cấp - Khóa học</div>
      </div>
    </div>
  );
};

const ProductCatComponent = () => {
  return (
    <div className="productCat-wrapper">
      <div className="productCat-background"></div>

      {/* Top Banner Image */}
      <img className="productCat-topBanner" src="toeicBanner.png" alt="banner" />

      {/* Product Cards */}
      <ProductCard top={1027} left={154} mainImg="Component4a.jpg" iconImg="Component4b.jpg" />
      <ProductCard top={1027} left={450} mainImg="Component4a.jpg" iconImg="Component4b.jpg" />
      <ProductCard top={1027} left={746} mainImg="Component4a.jpg" iconImg="Component4b.jpg" />
      <ProductCard top={1027} left={1042} mainImg="Component4a.jpg" iconImg="Component4b.jpg" />
      
      <ProductCard top={1364} left={154} mainImg="Component4a.jpg" iconImg="Component4b.jpg" />
      <ProductCard top={1364} left={450} mainImg="Component4a.jpg" iconImg="Component4b.jpg" />
      <ProductCard top={1364} left={746} mainImg="Component4a.jpg" iconImg="Component4b.jpg" />
      <ProductCard top={1364} left={1042} mainImg="Component4a.jpg" iconImg="Component4b.jpg" />

      {/* Load More Button */}
      <div className="productCat-loadMoreBox">
        <div className="productCat-loadMoreText">Hiển thị thêm 6</div>
      </div>
    </div>
  );
};

export default ProductCatComponent;
