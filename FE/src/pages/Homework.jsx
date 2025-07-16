// Homework.jsx
import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import { useParams, useNavigate } from 'react-router-dom';
import '../main2.css';
import AddNoteForm from '../components/AddNoteForm'
import NoteList from '../components/NoteList';
import Exercise from '../components/Exercise';

const Homework = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [courseData, setCourseData] = useState(null);
  const [expandedChapter, setExpandedChapter] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showNoteList, setShowNoteList] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState('00:00');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const playerRef = useRef(null);

  // Check enrollment status and load course data
  useEffect(() => {
    const checkEnrollmentAndLoadCourse = async () => {
      try {
        setLoading(true);
        
        // Check if user is enrolled in this course
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const enrollmentResponse = await fetch(`/api/v1/enrollments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (enrollmentResponse.ok) {
          const enrollmentData = await enrollmentResponse.json();
          const userEnrollment = enrollmentData.enrollments.find(
            enrollment => enrollment.courseId._id === courseId
          );
          
          if (!userEnrollment) {
            setError('Bạn chưa đăng ký khóa học này. Vui lòng mua khóa học trước khi học.');
            setIsEnrolled(false);
            return;
          }
          
          setIsEnrolled(true);
          
          // Load course data with chapters using the existing API
          const courseResponse = await fetch(`/api/v1/courses/${courseId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (courseResponse.ok) {
            const courseData = await courseResponse.json();
            
            // Transform course data to match our component structure
            const transformedCourseData = courseData.course.chapters.map(chapter => ({
              id: chapter._id,
              title: chapter.title,
              order: chapter.order,
              isLocked: chapter.isLocked,
              lessons: []
            })).sort((a, b) => a.order - b.order);

            // Load lessons and exercises for each chapter
            for (let chapter of transformedCourseData) {
              // Load lessons for this chapter
              const lessonsResponse = await fetch(`/api/v1/courses/${courseId}/chapters/${chapter.id}/lessons`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (lessonsResponse.ok) {
                const lessonsData = await lessonsResponse.json();
                const lessons = lessonsData.lessons.map(lesson => ({
                  id: lesson._id,
                  name: lesson.title,
                  type: 'video',
                  videoId: extractVideoId(lesson.videoUrl),
                  videoUrl: lesson.videoUrl,
                  videoDuration: lesson.videoDuration,
                  order: lesson.order,
                  isCompleted: false
                }));

                // Load exercises for this chapter
                const exercisesResponse = await fetch(`/api/v1/courses/${courseId}/chapters/${chapter.id}/exercises`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });

                if (exercisesResponse.ok) {
                  const exercisesData = await exercisesResponse.json();
                  console.log('exercisesData:', exercisesData);
                  const exercises = exercisesData.exercises.map(exercise => ({
                    id: exercise._id,
                    name: exercise.title,
                    type: 'exercise',
                    exerciseId: exercise._id,
                    order: exercise.order,
                    isCompleted: false
                  }));

                  // Combine lessons and exercises, sort by order
                  chapter.lessons = [...lessons, ...exercises].sort((a, b) => a.order - b.order);
                }
              }
            }

            setCourseData(transformedCourseData);
            
            // Load user progress using the existing API
            const progressResponse = await fetch(`/api/v1/progress/course/${courseId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              
              // Update completion status in courseData
              updateCompletionStatus(transformedCourseData, progressData.userProgress);
            }
            
            // Set initial selected lesson
            if (transformedCourseData.length > 0 && transformedCourseData[0].lessons.length > 0) {
              setSelectedLesson(transformedCourseData[0].lessons[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading course data:', error);
        setError('Có lỗi xảy ra khi tải dữ liệu khóa học');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      checkEnrollmentAndLoadCourse();
    }
  }, [courseId, navigate]);

  // Helper function to extract YouTube video ID
  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Update completion status based on user progress
  const updateCompletionStatus = (courseData, userProgress) => {
    if (!userProgress || !userProgress.chapterProgress) return;

    const updatedCourseData = courseData.map(chapter => ({
      ...chapter,
      lessons: chapter.lessons.map(lesson => {
        const chapterProgress = userProgress.chapterProgress.find(
          cp => cp.chapterId === chapter.id
        );
        
        if (!chapterProgress) return lesson;

        if (lesson.type === 'video') {
          const lessonProgress = chapterProgress.lessonProgress.find(
            lp => lp.lessonId === lesson.id
          );
          return {
            ...lesson,
            isCompleted: lessonProgress ? lessonProgress.isCompleted : false,
            watchTime: lessonProgress ? lessonProgress.watchTime : 0
          };
        } else {
          const exerciseResult = chapterProgress.exerciseResults.find(
            er => er.exerciseId === lesson.exerciseId
          );
          return {
            ...lesson,
            isCompleted: exerciseResult ? exerciseResult.isPassed : false,
            score: exerciseResult ? exerciseResult.score : 0
          };
        }
      })
    }));

    setCourseData(updatedCourseData);
  };

  // Calculate completion percentage
  const calculateCompletionPercentage = () => {
    if (!courseData) return 0;
    
    let totalLessons = 0;
    let completedLessons = 0;
    
    courseData.forEach(chapter => {
      chapter.lessons.forEach(lesson => {
        totalLessons++;
        if (lesson.isCompleted) completedLessons++;
      });
    });
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  // Update lesson completion status
  const updateLessonCompletion = async (lessonId, isCompleted, additionalData = {}) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/progress/lesson/${lessonId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isCompleted,
          ...additionalData
        })
      });

      if (response.ok) {
        // Update local state
        setCourseData(prevData => 
          prevData.map(chapter => ({
            ...chapter,
            lessons: chapter.lessons.map(lesson => 
              lesson.id === lessonId 
                ? { ...lesson, isCompleted, ...additionalData }
                : lesson
            )
          }))
        );
      }
    } catch (error) {
      console.error('Error updating lesson completion:', error);
    }
  };

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
          
          // Update watch time in backend
          if (selectedLesson && selectedLesson.type === 'video') {
            updateLessonCompletion(selectedLesson.id, false, { watchTime: time });
          }
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

  const handleSaveNote = async (noteContent, timestamp) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/courses/${courseId}/chapters/${courseData[expandedChapter].id}/lessons/${selectedLesson.id}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: noteContent,
          timestamp: Math.floor(timestamp) // Convert to seconds if needed
        })
      });

      if (response.ok) {
        const newNote = {
          id: Date.now(),
          content: noteContent,
          timestamp: timestamp,
          chapter: courseData[expandedChapter].title,
          lesson: selectedLesson.name
        };
        setNotes((prevNotes) => [...prevNotes, newNote]);
        console.log(`Ghi chú: "${noteContent}" tại thời điểm: ${timestamp}`);
        handleCloseNoteForm();
      } else {
        console.error('Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleOpenNoteList = async () => {
    try {
      if (selectedLesson && selectedLesson.type === 'video') {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/v1/courses/${courseId}/chapters/${courseData[expandedChapter].id}/lessons/${selectedLesson.id}/notes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const transformedNotes = data.notes.map(note => ({
            id: note._id,
            content: note.content,
            timestamp: note.timestamp,
            chapter: courseData[expandedChapter].title,
            lesson: selectedLesson.name
          }));
          setNotes(transformedNotes);
        }
      }
      setShowNoteList(true);
    } catch (error) {
      console.error('Error loading notes:', error);
      setShowNoteList(true);
    }
  };

  const handleCloseNoteList = () => {
    setShowNoteList(false);
  };

  const handleLessonSelect = async (lesson) => {
    setSelectedLesson(lesson);
    
    // Mark lesson as started if it's a video
    if (lesson.type === 'video' && !lesson.isCompleted) {
      updateLessonCompletion(lesson.id, false, { lastWatchedAt: new Date() });
    }

    // Load notes for video lessons
    if (lesson.type === 'video') {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/v1/courses/${courseId}/chapters/${courseData[expandedChapter].id}/lessons/${lesson.id}/notes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const transformedNotes = data.notes.map(note => ({
            id: note._id,
            content: note.content,
            timestamp: note.timestamp,
            chapter: courseData[expandedChapter].title,
            lesson: lesson.name
          }));
          setNotes(transformedNotes);
        }
      } catch (error) {
        console.error('Error loading notes:', error);
        setNotes([]);
      }
    } else {
      setNotes([]); // Clear notes for exercises
    }
  };

  const handleVideoEnd = () => {
    if (selectedLesson && selectedLesson.type === 'video' && !selectedLesson.isCompleted) {
      updateLessonCompletion(selectedLesson.id, true, { 
        completedAt: new Date(),
        watchTime: selectedLesson.videoDuration || 0
      });
      
      // Auto-select next lesson if available
      const currentChapterIndex = expandedChapter;
      const currentLessonIndex = courseData[currentChapterIndex].lessons.findIndex(
        lesson => lesson.id === selectedLesson.id
      );
      
      if (currentLessonIndex < courseData[currentChapterIndex].lessons.length - 1) {
        // Next lesson in same chapter
        const nextLesson = courseData[currentChapterIndex].lessons[currentLessonIndex + 1];
        setTimeout(() => {
          handleLessonSelect(nextLesson);
        }, 2000); // Wait 2 seconds before auto-selecting
      } else if (currentChapterIndex < courseData.length - 1) {
        // Next chapter
        const nextChapter = currentChapterIndex + 1;
        if (courseData[nextChapter].lessons.length > 0) {
          setTimeout(() => {
            setExpandedChapter(nextChapter);
            handleLessonSelect(courseData[nextChapter].lessons[0]);
          }, 2);
        }
      }
    }
  };

  const handleExerciseComplete = (exerciseId, score, isPassed) => {
    updateLessonCompletion(exerciseId, isPassed, { score });
    
    // Auto-select next lesson if exercise is passed
    if (isPassed) {
      const currentChapterIndex = expandedChapter;
      const currentLessonIndex = courseData[currentChapterIndex].lessons.findIndex(
        lesson => lesson.id === exerciseId
      );
      
      if (currentLessonIndex < courseData[currentChapterIndex].lessons.length - 1) {
        // Next lesson in same chapter
        const nextLesson = courseData[currentChapterIndex].lessons[currentLessonIndex + 1];
        setTimeout(() => {
          handleLessonSelect(nextLesson);
        }, 2000); // Wait 2 seconds before auto-selecting
      } else if (currentChapterIndex < courseData.length - 1) {
        // Next chapter
        const nextChapter = currentChapterIndex + 1;
        if (courseData[nextChapter].lessons.length > 0) {
          setTimeout(() => {
            setExpandedChapter(nextChapter);
            handleLessonSelect(courseData[nextChapter].lessons[0]);
          }, 2000);
        }
      }
    }
  };

  // Navigation functions
  const goToNextLesson = () => {
    if (!courseData) return;
    
    let foundCurrent = false;
    
    for (let chapterIndex = 0; chapterIndex < courseData.length; chapterIndex++) {
      const chapter = courseData[chapterIndex];
      for (let lessonIndex = 0; lessonIndex < chapter.lessons.length; lessonIndex++) {
        const lesson = chapter.lessons[lessonIndex];
        
        if (foundCurrent) {
          setSelectedLesson(lesson);
          setExpandedChapter(chapterIndex);
          return;
        }
        
        if (lesson.id === selectedLesson?.id) {
          foundCurrent = true;
        }
      }
    }
  };

  const goToPreviousLesson = () => {
    if (!courseData) return;
    
    let foundCurrent = false;
    
    for (let chapterIndex = courseData.length - 1; chapterIndex >= 0; chapterIndex--) {
      const chapter = courseData[chapterIndex];
      for (let lessonIndex = chapter.lessons.length - 1; lessonIndex >= 0; lessonIndex--) {
        const lesson = chapter.lessons[lessonIndex];
        
        if (foundCurrent) {
          setSelectedLesson(lesson);
          setExpandedChapter(chapterIndex);
          return;
        }
        
        if (lesson.id === selectedLesson?.id) {
          foundCurrent = true;
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="homework-page-wrapper">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="homework-page-wrapper">
        <div className="error-container">
          <h2>Lỗi</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/courses')}>Quay lại danh sách khóa học</button>
        </div>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="homework-page-wrapper">
        <div className="not-enrolled-container">
          <h2>Bạn chưa đăng ký khóa học này</h2>
          <p>Vui lòng mua khóa học để có thể truy cập nội dung học tập.</p>
          <button onClick={() => navigate(`/course/${courseId}`)}>Mua khóa học</button>
        </div>
      </div>
    );
  }

  if (!courseData || !selectedLesson) {
    return (
      <div className="homework-page-wrapper">
        <div className="error-container">
          <h2>Không tìm thấy dữ liệu khóa học</h2>
        </div>
      </div>
    );
  }

  const currentChapterTitle = courseData[expandedChapter].title;
  const currentVideoId = selectedLesson.type === 'video' ? selectedLesson.videoId : '';
  const completionPercentage = calculateCompletionPercentage();

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
        <div className="homework-course-title">{courseData[0]?.title || 'Khóa học TOEIC 600+'}</div>
        <div className="homework-progress">
          <span className="homework-progress-text">{completionPercentage}%</span>
          <div className="homework-progress-bar-container">
            <div className="homework-progress-bar" style={{ width: `${completionPercentage}%` }}></div>
          </div>
          <span className="homework-progress-count">
            {courseData.reduce((total, chapter) => total + chapter.lessons.filter(l => l.isCompleted).length, 0)}/
            {courseData.reduce((total, chapter) => total + chapter.lessons.length, 0)} bài học
          </span>
        </div>
        <button className="homework-notes-btn" onClick={handleOpenNoteList}>Ghi chú</button>
      </div>

      {/* Content Area */}
      <div className="homework-content-area">
        {/* Video / Exercise Section */}
        <div className="homework-video-section">
          {selectedLesson.type === 'video' ? (
            <>
              <div className="homework-video-player-container">
                <YouTube
                  videoId={currentVideoId}
                  opts={youtubeOpts}
                  onReady={onPlayerReady}
                  onStateChange={onPlayerStateChange}
                  onEnd={handleVideoEnd}
                />
              </div>
              <h2 className="homework-video-title">
                Chương {expandedChapter + 1}: {currentChapterTitle}
                {selectedLesson.isCompleted && <span className="completed-badge">✓ Hoàn thành</span>}
              </h2>
              <p className="homework-video-note-link" onClick={handleOpenNoteForm}>
                + Thêm ghi chú tại <span className="current-video-time">{currentVideoTime}</span>
              </p>
            </>
          ) : (
            <Exercise 
              exerciseId={selectedLesson.exerciseId}
              courseId={courseId}
              chapterId={courseData[expandedChapter].id}
              onComplete={handleExerciseComplete}
              isCompleted={selectedLesson.isCompleted}
            />
          )}

          {showNoteForm && (
            <div className="note-form-overlay">
              <AddNoteForm
                timestamp={currentVideoTime}
                onSave={handleSaveNote}
                onCancel={handleCloseNoteForm}
                currentTimeInSeconds={playerRef.current ? playerRef.current.getCurrentTime() : 0}
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
                {chapter.lessons.every(lesson => lesson.isCompleted) && (
                  <span className="chapter-completed-badge">✓</span>
                )}
              </div>
              {expandedChapter === chapterIndex && chapter.lessons.length > 0 && (
                <ul className="homework-lesson-list">
                  {chapter.lessons.map((lesson, lessonIndex) => (
                    <li
                      key={lessonIndex}
                      className={`homework-lesson-item ${selectedLesson.id === lesson.id ? 'active' : ''} ${lesson.isCompleted ? 'completed' : ''}`}
                      onClick={() => handleLessonSelect(lesson)}
                    >
                      <span className="homework-lesson-icon">
                        {lesson.type === 'video' ? '▶' : '📝'}
                      </span>
                      {lesson.name}
                      {lesson.isCompleted && <span className="lesson-completed-badge">✓</span>}
                      {lesson.type === 'exercise' && lesson.score > 0 && (
                        <span className="lesson-score">({lesson.score}%)</span>
                      )}
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
        <button 
          className="homework-btn homework-btn-outline"
          onClick={goToPreviousLesson}
        >
          ◀ Bài trước
        </button>
        <button 
          className="homework-btn homework-btn-primary"
          onClick={goToNextLesson}
        >
          Bài tiếp theo ▶
        </button>
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