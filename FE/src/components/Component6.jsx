import React from 'react';
import '../main.css';

const comments = [
  {
    name: 'Nguyễn Văn A',
    avatar: '/public/avatar.jpg',
    content: 'Dự án này thực sự hữu ích, giao diện đẹp và dễ sử dụng! Tôi đã học được rất nhiều.',
  },
  {
    name: 'Trần Thị B',
    avatar: '/public/avatar2.jpg',
    content: 'Các khoá học rất chất lượng, đội ngũ hỗ trợ nhiệt tình. Rất đáng để trải nghiệm!',
  },
  {
    name: 'Lê Minh C',
    avatar: '/public/user.png',
    content: 'Tôi thích cách trình bày bài học, rõ ràng và dễ hiểu. Sẽ giới thiệu cho bạn bè!',
  },
  {
    name: 'Phạm Thảo D',
    avatar: '/public/avatar.jpg',
    content: 'Nội dung phong phú, phù hợp với nhiều trình độ. Cảm ơn đội ngũ phát triển!',
  },
  {
    name: 'Hoàng Văn E',
    avatar: '/public/avatar2.jpg',
    content: 'Tôi đã tiến bộ rõ rệt sau khi học ở đây. Cảm ơn dự án rất nhiều!',
  },
];

function getRandomComments(arr, n) {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

const Component6 = () => {
  const randomComments = getRandomComments(comments, 3);

  return (
    <div className="component6-comments-container" style={{padding: '32px 0', textAlign: 'center'}}>
      <h2 style={{marginBottom: 24}}>Cảm nhận của học viên về dự án</h2>
      <div style={{display: 'flex', justifyContent: 'left', gap: 32, marginLeft: 204}}>
        {randomComments.map((c, idx) => (
          <div key={idx} className="component6-comment-card" style={{background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 24, width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <img src={c.avatar} alt={c.name} style={{width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 12}} />
            <div style={{fontWeight: 600, fontSize: 18, marginBottom: 8}}>{c.name}</div>
            <div style={{fontSize: 15, color: '#333'}}>{c.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Component6;
