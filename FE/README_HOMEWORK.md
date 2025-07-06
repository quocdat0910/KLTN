# Trang Học Tập (Homework Page) - Hướng Dẫn Sử Dụng

## Tổng Quan
Trang Homework là trang học tập chính dành cho học viên đã đăng ký khóa học. Trang này cung cấp giao diện học tập hoàn chỉnh với video lessons, bài tập, ghi chú và theo dõi tiến độ.

## Tính Năng Chính

### 1. Kiểm Tra Đăng Ký Khóa Học
- Tự động kiểm tra xem người dùng đã đăng ký khóa học chưa
- Nếu chưa đăng ký, hiển thị thông báo và nút "Mua khóa học"
- Chuyển hướng đến trang chi tiết khóa học để mua

### 2. Hiển Thị Nội Dung Khóa Học
- **Chapters (Chương)**: Hiển thị danh sách các chương của khóa học
- **Lessons (Bài học)**: Video lessons với thời lượng và trạng thái hoàn thành
- **Exercises (Bài tập)**: Bài tập trắc nghiệm với điểm số

### 3. Video Player
- Tích hợp YouTube player
- Hiển thị thời gian hiện tại của video
- Tự động đánh dấu hoàn thành khi xem hết video
- Tự động chuyển bài tiếp theo sau khi hoàn thành

### 4. Hệ Thống Ghi Chú
- Thêm ghi chú tại thời điểm cụ thể trong video
- Xem danh sách ghi chú đã tạo
- Ghi chú được lưu theo từng bài học

### 5. Theo Dõi Tiến Độ
- Hiển thị phần trăm hoàn thành khóa học
- Thanh tiến độ trực quan
- Đếm số bài học đã hoàn thành
- Badge hoàn thành cho từng bài học và chương

### 6. Bài Tập (Exercises)
- Bài tập trắc nghiệm với nhiều lựa chọn
- Hiển thị kết quả ngay lập tức
- Tính điểm và đánh dấu hoàn thành
- Tự động chuyển bài tiếp theo nếu đạt điểm

## API Endpoints Sử Dụng

### 1. Kiểm Tra Đăng Ký
```
GET /api/v1/enrollments
```

### 2. Lấy Thông Tin Khóa Học
```
GET /api/v1/courses/:courseId
```

### 3. Lấy Danh Sách Lessons
```
GET /api/v1/courses/:courseId/chapters/:chapterId/lessons
```

### 4. Lấy Danh Sách Exercises
```
GET /api/v1/courses/:courseId/chapters/:chapterId/exercises
```

### 5. Lấy Chi Tiết Exercise
```
GET /api/v1/courses/:courseId/chapters/:chapterId/exercises/:exerciseId
```

### 6. Cập Nhật Tiến Độ Bài Học
```
PUT /api/v1/progress/lesson/:lessonId
```

### 7. Lấy Tiến Độ Khóa Học
```
GET /api/v1/progress/course/:courseId
```

### 8. Quản Lý Ghi Chú
```
GET /api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId/notes
POST /api/v1/courses/:courseId/chapters/:chapterId/lessons/:lessonId/notes
```

## Cách Sử Dụng

### 1. Truy Cập Trang Học
- Đăng nhập vào hệ thống
- Vào trang chi tiết khóa học (`/course/:id`)
- Nếu đã mua khóa học, nhấn nút "Bắt đầu học"
- Hoặc truy cập trực tiếp `/learn/:courseId`

### 2. Học Video Lessons
- Chọn bài học video từ sidebar
- Xem video và thêm ghi chú nếu cần
- Video sẽ tự động đánh dấu hoàn thành khi xem hết
- Tự động chuyển bài tiếp theo

### 3. Làm Bài Tập
- Chọn bài tập từ sidebar
- Trả lời các câu hỏi trắc nghiệm
- Xem kết quả và điểm số
- Tự động chuyển bài tiếp theo nếu đạt điểm

### 4. Quản Lý Ghi Chú
- Nhấn nút "📝 Ghi chú" để xem danh sách ghi chú
- Nhấn "+ Thêm ghi chú" để tạo ghi chú mới
- Ghi chú được lưu theo thời điểm trong video

### 5. Điều Hướng
- Sử dụng nút "Bài trước" và "Bài tiếp theo"
- Hoặc chọn trực tiếp từ sidebar
- Theo dõi tiến độ qua thanh progress bar

## Cấu Trúc Dữ Liệu

### Course Data
```javascript
{
  id: string,
  title: string,
  chapters: [
    {
      id: string,
      title: string,
      order: number,
      isLocked: boolean,
      lessons: [
        {
          id: string,
          name: string,
          type: 'video' | 'exercise',
          videoId?: string,
          videoUrl?: string,
          videoDuration?: number,
          exerciseId?: string,
          order: number,
          isCompleted: boolean,
          score?: number
        }
      ]
    }
  ]
}
```

### User Progress
```javascript
{
  courseId: string,
  completionPercentage: number,
  totalWatchTime: number,
  isCourseCompleted: boolean,
  chapterProgress: [
    {
      chapterId: string,
      isCompleted: boolean,
      lessonProgress: [
        {
          lessonId: string,
          isCompleted: boolean,
          watchTime: number,
          completedAt: Date
        }
      ],
      exerciseResults: [
        {
          exerciseId: string,
          score: number,
          isPassed: boolean,
          completedAt: Date
        }
      ]
    }
  ]
}
```

## Tính Năng Nâng Cao

### 1. Auto-Navigation
- Tự động chuyển bài tiếp theo sau khi hoàn thành
- Chuyển chương tiếp theo nếu đã hoàn thành chương hiện tại

### 2. Progress Tracking
- Theo dõi thời gian xem video
- Lưu điểm số bài tập
- Tính toán phần trăm hoàn thành

### 3. Responsive Design
- Giao diện tương thích với nhiều kích thước màn hình
- Sidebar có thể thu gọn trên mobile

### 4. Error Handling
- Xử lý lỗi khi tải dữ liệu
- Fallback về dữ liệu mẫu nếu API không khả dụng
- Thông báo lỗi thân thiện với người dùng

## Lưu Ý Kỹ Thuật

1. **Authentication**: Tất cả API calls đều yêu cầu token authentication
2. **Error Handling**: Có fallback cho các trường hợp API không khả dụng
3. **Performance**: Lazy loading cho chapters và lessons
4. **State Management**: Sử dụng React hooks để quản lý state
5. **Real-time Updates**: Cập nhật tiến độ real-time khi hoàn thành bài học

## Troubleshooting

### Lỗi Thường Gặp

1. **"Bạn chưa đăng ký khóa học này"**
   - Kiểm tra xem đã đăng nhập chưa
   - Kiểm tra xem đã mua khóa học chưa
   - Thử refresh trang

2. **Video không load**
   - Kiểm tra kết nối internet
   - Kiểm tra URL video có hợp lệ không
   - Thử chuyển bài học khác

3. **Bài tập không hiển thị**
   - Kiểm tra API endpoint
   - Thử refresh trang
   - Kiểm tra console để xem lỗi

4. **Ghi chú không lưu được**
   - Kiểm tra kết nối internet
   - Kiểm tra token authentication
   - Thử tạo ghi chú khác

## Tương Lai

- Thêm tính năng bookmark bài học
- Thêm tính năng download tài liệu
- Thêm tính năng chat với giáo viên
- Thêm tính năng học nhóm
- Thêm tính năng đánh giá khóa học 