// Homework.jsx
import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import '../main2.css';
import AddNoteForm from '../components/AddNoteForm'
import NoteList from '../components/NoteList';
import Exercise from '../components/Exercise';

const courseData = [
  // ... (Sử dụng cấu trúc courseData mới như ở Bước 1)
  {
    title: 'Giới thiệu',
    lessons: [
      { id: 'intro-video', name: 'Giới thiệu', type: 'video', videoId: 'dQw4w9WgXcQ' },
      { id: 'intro-exercise', name: 'Bài tập', type: 'exercise', exerciseId: 'intro-quiz-1' }
    ]
  },
  {
    title: 'Tên chương 2',
    lessons: [
      { id: 'chapter2-video1', name: 'Bài học 2.1: Ngữ pháp cơ bản', type: 'video', videoId: 'another-video-id' },
      { id: 'chapter2-exercise1', name: 'Bài tập 2.1: Luyện tập ngữ pháp', type: 'exercise', exerciseId: 'grammar-quiz-1' }
    ]
  },
  {
    title: 'Tên chương 3',
    lessons: [
      { id: 'chapter3-video1', name: 'Bài học 3.1: Từ vựng TOEIC', type: 'video', videoId: 'vocab-video-id' },
      { id: 'chapter3-exercise1', name: 'Bài tập 3.1: Ghép từ', type: 'exercise', exerciseId: 'matching-quiz-1' }
    ]
  },
  {
    title: 'Tên chương 4',
    lessons: [
      { id: 'chapter4-video1', name: 'Bài học 4.1: Chiến lược đọc hiểu', type: 'video', videoId: 'reading-video-id' },
      { id: 'chapter4-exercise1', name: 'Bài tập 4.1: Đọc hiểu chuyên sâu', type: 'exercise', exerciseId: 'reading-quiz-1' }
    ]
  },
  {
    title: 'Tên chương 5',
    lessons: [
      { id: 'chapter5-video1', name: 'Bài học 5.1: Kỹ năng nghe TOEIC', type: 'video', videoId: 'listening-video-id' },
      { id: 'chapter5-exercise1', name: 'Bài tập 5.1: Luyện nghe Part 1', type: 'exercise', exerciseId: 'listening-quiz-1' }
    ]
  },
  {
    title: 'Tên chương 6',
    lessons: [
      { id: 'chapter6-video1', name: 'Bài học 6.1: Thi thử toàn diện', type: 'video', videoId: 'mocktest-video-id' },
      { id: 'chapter6-exercise1', name: 'Bài tập 6.1: Phân tích lỗi sai', type: 'exercise', exerciseId: 'error-analysis-quiz-1' }
    ]
  }
];

const Homework = () => {
  const [expandedChapter, setExpandedChapter] = useState(0);
  // selectedLesson bây giờ là một đối tượng bài học
  const [selectedLesson, setSelectedLesson] = useState(courseData[0].lessons[0]);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showNoteList, setShowNoteList] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState('00:00');
  const [notes, setNotes] = useState([]);

  const playerRef = useRef(null);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange = (event) => {
    if (event.data === 1 || event.data === 2) {
      if (playerRef.current && !window.updateTimeInterval) {
        window.updateTimeInterval = setInterval(() => {
          const time = playerRef.current.getCurrentTime();
          setCurrentVideoTime(formatTime(time));
        }, 1000);
      }
    } else {
      clearInterval(window.updateTimeInterval);
      window.updateTimeInterval = null;
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(window.updateTimeInterval);
      window.updateTimeInterval = null;
    };
  }, []);


  const handleOpenNoteForm = () => {
    if (playerRef.current) {
      const timeInSeconds = playerRef.current.getCurrentTime();
      setCurrentVideoTime(formatTime(timeInSeconds));
    }
    setShowNoteForm(true);
  };

  const handleCloseNoteForm = () => {
    setShowNoteForm(false);
  };

  const handleSaveNote = (noteContent, timestamp) => {
    const newNote = {
      id: Date.now(),
      content: noteContent,
      timestamp: timestamp,
      chapter: courseData[expandedChapter].title,
      lesson: selectedLesson.name // Lấy tên bài học
    };
    setNotes((prevNotes) => [...prevNotes, newNote]);
    console.log(`Ghi chú: "${noteContent}" tại thời điểm: ${timestamp}`);
    handleCloseNoteForm();
  };

  const handleOpenNoteList = () => {
    setShowNoteList(true);
  };

  const handleCloseNoteList = () => {
    setShowNoteList(false);
  };

  const currentChapterTitle = courseData[expandedChapter].title;
  // Lấy videoId từ selectedLesson
  const currentVideoId = selectedLesson.type === 'video' ? selectedLesson.videoId : '';

  const youtubeOpts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className="homework-page-wrapper">
      {/* Header Section */}
      <div className="homework-header">
        <div className="homework-logo">DA</div>
        <div className="homework-course-title">Khóa học TOEIC 600+</div>
        <div className="homework-progress">
          <span className="homework-progress-text">1%</span>
          <div className="homework-progress-bar-container">
            <div className="homework-progress-bar" style={{ width: '1%' }}></div>
          </div>
          <span className="homework-progress-count">1/4 bài học</span>
        </div>
        <button className="homework-notes-btn" onClick={handleOpenNoteList}>📝 Ghi chú</button>
      </div>

      {/* Content Area */}
      <div className="homework-content-area">
        {/* Video / Exercise Section */}
        <div className="homework-video-section">
          {selectedLesson.type === 'video' ? (
            // Hiển thị Video Player nếu là bài học video
            <>
              <div className="homework-video-player-container">
                <YouTube
                  videoId={currentVideoId} // Sử dụng videoId từ selectedLesson
                  opts={youtubeOpts}
                  onReady={onPlayerReady}
                  onStateChange={onPlayerStateChange}
                />
              </div>
              <h2 className="homework-video-title">Chương {expandedChapter + 1}: {currentChapterTitle}</h2>
              <p className="homework-video-note-link" onClick={handleOpenNoteForm}>
                + Thêm ghi chú tại <span className="current-video-time">{currentVideoTime}</span>
              </p>
            </>
          ) : (
            // Hiển thị Bài tập nếu là bài tập
            <Exercise exerciseId={selectedLesson.exerciseId} /> // Truyền ID bài tập
          )}

          {showNoteForm && (
            <div className="note-form-overlay">
              <AddNoteForm
                timestamp={currentVideoTime}
                onSave={handleSaveNote}
                onCancel={handleCloseNoteForm}
              />
            </div>
          )}
        </div>

        {/* Sidebar Section (Table of Contents) */}
        <div className="homework-sidebar-section">
          {courseData.map((chapter, chapterIndex) => (
            <div key={chapterIndex} className="homework-chapter-item">
              <div
                className={`homework-chapter-title ${expandedChapter === chapterIndex ? 'expanded' : ''}`}
                onClick={() => setExpandedChapter(chapterIndex)}
              >
                <span className="homework-chapter-toggle">
                  {expandedChapter === chapterIndex ? '–' : '+'}
                </span>
                {chapter.title}
              </div>
              {expandedChapter === chapterIndex && chapter.lessons.length > 0 && (
                <ul className="homework-lesson-list">
                  {chapter.lessons.map((lesson, lessonIndex) => (
                    <li
                      key={lessonIndex}
                      // So sánh bằng ID thay vì toàn bộ đối tượng hoặc tên
                      className={`homework-lesson-item ${selectedLesson.id === lesson.id ? 'active' : ''}`}
                      onClick={() => setSelectedLesson(lesson)} // Truyền toàn bộ đối tượng lesson
                    >
                      <span className="homework-lesson-icon">
                        {lesson.type === 'video' ? '▶' : '📝'} {/* Icon động */}
                      </span>
                      {lesson.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div className="homework-footer">
        <button className="homework-btn homework-btn-outline">◀ Bài trước</button>
        <button className="homework-btn homework-btn-primary">Bài tiếp theo ▶</button>
        <div className="homework-chapter-status">
          Chương {expandedChapter + 1}: {currentChapterTitle}
        </div>
      </div>

      {showNoteList && (
        <div className="note-list-overlay" onClick={handleCloseNoteList}>
          <div className={`note-list-modal-content ${showNoteList ? '' : 'slide-out-right'}`} onClick={(e) => e.stopPropagation()}>
            <NoteList notes={notes} onClose={handleCloseNoteList} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Homework;