import React from 'react';
import '../main.css';

const Component5 = () => {
  return (
    <div className="component5-container">
      <div className="component5-title">
        Tìm kiếm 10,000+ chương trình học
      </div>

      <div className="component5-search-bar">
        <input
          type="text"
          placeholder="ví dụ:  TOEIC"
          className="component5-input"
        />
        <img className='component5-icon' src="search.png" alt="" />
      </div>

      <div className="component5-label" style={{ left: 45 }}>Phổ biến</div>

      {/* Tag Buttons */}
      {[
        { left: 113, label: 'Toeic' },
        { left: 187, label: 'Ielts' },
        { left: 261, label: 'Toeic' },
        { left: 335, label: 'Toeic' },
        { left: 409, label: 'Toeic' },
        { left: 483, label: 'Toeic' },
        { left: 557, label: 'Toeic' },
        { left: 631, label: 'Toeic' },
        { left: 705, label: 'Toeic' },
      ].map((tag, index) => (
        <React.Fragment key={index}>
          <div className="component5-tag-bg" style={{ left: tag.left }}></div>
          <div className="component5-tag-text" style={{ left: tag.left + 13 }}>
            {tag.label}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Component5;
