import React, { useState, useContext, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { Context } from '../../main';
import CreateExerciseForm from "../../components/CreateExerciseForm";
import CreateLessonForm from "../../components/CreateLessonForm";
import "../../Component.css";
import * as XLSX from 'xlsx'; // Vẫn cần xlsx để parse dữ liệu từ CSV/TSV

function AddChapter() {
    const navigate = useNavigate();
    const { courseId, chapterId } = useParams();
    const { isAuthenticated, user, loading: contextLoading } = useContext(Context);

    const [chapterName, setChapterName] = useState('');
    const [order, setOrder] = useState('');
    const [isPublished, setIsPublished] = useState(false);

    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [exercises, setExercises] = useState([]); // Vẫn cần state này để tính suggestedOrder và quản lý ID cho chapter.exercises

    const [showLessonForm, setShowLessonForm] = useState(false);
    const [lessons, setLessons] = useState([]);
    const [editingLesson, setEditingLesson] = useState(null);

    // State for Google Sheet URL input
    const [googleSheetUrl, setGoogleSheetUrl] = useState('');
    // State for the exercise title when importing from Google Sheet
    const [excelExerciseTitle, setExcelExerciseTitle] = useState('');
    const [excelExerciseIsPublished, setExcelExerciseIsPublished] = useState(false);

    // Hàm chuẩn hóa link Google Sheet sang export CSV
    function normalizeGoogleSheetUrl(url) {
        const match = url.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
            return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
        }
        return url;
    }

    const handleUpdateExerciseFromSheet = async (exercise) => {
        const normalizedUrl = normalizeGoogleSheetUrl(exercise.googleSheetUrl || '');
        if (!normalizedUrl || !normalizedUrl.includes("export?format=csv")) {
            toast.error(`Bài tập "${exercise.title}" chưa có URL Google Sheet hợp lệ.`);
            console.log("exercise.googleSheetUrl:", exercise.googleSheetUrl);
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Vui lòng đăng nhập lại.");
                navigate("/login");
                return;
            }
            // Fetch CSV content from Google Sheet
            const response = await axios.get(normalizedUrl, {
                responseType: 'arraybuffer', // Important for binary CSV
            });

            const data = new Uint8Array(response.data); // Convert to binary format
            const workbook = XLSX.read(data, { type: 'array' }); // Parse workbook
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            // Transform data into your expected question format
            const transformed = transformExcelDataToQuestions(json);
            const updatedData = {
                title: exercise.title,
                type: transformed.inferredType,
                questions: transformed.questions,
                googleSheetUrl: normalizedUrl,
                isPublished: exercise.isPublished !== undefined ? exercise.isPublished : false,
            };

            // Log dữ liệu trước khi gửi lên backend
            console.log('Exercise data gửi lên backend:', updatedData);

            // Update to backend
            try {
                const res = await axios.put(
                    `http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapterId}/exercises/${exercise._id}`,
                    updatedData,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        withCredentials: true,
                    }
                );
                // Log toàn bộ response
                console.log('Full response:', res);
                // Log response exercise sau khi cập nhật thành công
                console.log('Exercise data SAU KHI SAVE (response):', res.data.exercise);
                // Update local state
                setExercises((prev) =>
                    prev.map((ex) => (ex._id === exercise._id ? res.data.exercise : ex))
                );
                toast.success(`Cập nhật bài tập "${exercise.title}" từ Google Sheet thành công!`);
            } catch (err) {
                // Log lỗi chi tiết
                console.error('Lỗi khi cập nhật exercise:', err, err?.response);
            }

        } catch (error) {
            console.error("Lỗi cập nhật bài tập:", error, error.stack);
            toast.error("Không thể cập nhật bài tập từ Google Sheet.");
        } finally {
            setLoading(false);
        }
    };

    // Handle "Delete Exercise" click
    const handleDeleteExercise = useCallback(async (exerciseId, exerciseTitle) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa bài tập "${exerciseTitle}"?`)) {
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                navigate("/login");
                return;
            }

            if (!chapterId || chapterId === 'new') {
                toast.error("Không thể xóa bài tập: Chương chưa được lưu.");
                setLoading(false);
                return;
            }

            await axios.delete(`http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapterId}/exercises/${exerciseId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });

            setExercises(prevExercises => prevExercises.filter(exercise => exercise._id !== exerciseId));
            toast.success("Xóa bài tập thành công!");
        } catch (error) {
            console.error("Lỗi khi xóa bài tập:", error.response?.data?.message || error.message);
            toast.error("Không thể xóa bài tập: " + (error.response?.data?.message || "Lỗi không xác định"));
        } finally {
            setLoading(false);
        }
    }, [chapterId, navigate, courseId]);

    // Callback when a lesson is created/updated from CreateLessonForm
    const handleLessonCreated = useCallback((newLesson) => {
        setLessons(prevLessons => {
            if (editingLesson) {
                return prevLessons.map(lesson =>
                    lesson._id === newLesson._id ? newLesson : lesson
                );
            } else {
                return [...prevLessons, newLesson];
            }
        });
        setShowLessonForm(false);
        setEditingLesson(null);
        toast.success("Bài học đã được " + (editingLesson ? "cập nhật" : "thêm") + " vào danh sách chương!");
    }, [editingLesson]);

    // Handle "Edit Lesson" click
    const handleEditLesson = useCallback((lessonToEdit) => {
        setEditingLesson(lessonToEdit);
        setShowLessonForm(true);
    }, []);

    // Handle "Delete Lesson" click
    const handleDeleteLesson = useCallback(async (lessonId, lessonTitle) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa bài học "${lessonTitle}"?`)) {
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                navigate("/login");
                return;
            }

            if (!chapterId || chapterId === 'new') {
                toast.error("Không thể xóa bài học: Chương chưa được lưu.");
                setLoading(false);
                return;
            }

            await axios.delete(`http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });

            setLessons(prevLessons => prevLessons.filter(lesson => lesson._id !== lessonId));
            toast.success("Xóa bài học thành công!");
        } catch (error) {
            console.error("Lỗi khi xóa bài học:", error.response?.data?.message || error.message);
            toast.error("Không thể xóa bài học: " + (error.response?.data?.message || "Lỗi không xác định"));
        } finally {
            setLoading(false);
        }
    }, [chapterId, navigate, courseId]);

    // Function to fetch chapter details, exercises, and lessons
    const fetchChapterDetails = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                navigate("/login");
                return;
            }

            const chapterRes = await axios.get(
                `http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapterId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                }
            );
            const chapterData = chapterRes.data.chapter;
            setChapterName(chapterData.title || '');
            setOrder(chapterData.order || '');
            setIsPublished(chapterData.isPublished !== undefined ? chapterData.isPublished : false);
            setGoogleSheetUrl(chapterData.googleSheetUrl || '');

            // Fetch exercises to correctly calculate suggestedOrder for new exercises
            const exercisesRes = await axios.get(
                `http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapterId}/exercises`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                }
            );
            console.log('exercises:', exercisesRes.data.exercises); // kiểm tra giá trị isPublished
            if (Array.isArray(exercisesRes.data.exercises)) {
                setExercises((prevExercises) =>
                    exercisesRes.data.exercises.map((ex, idx) => ({
                        ...ex,
                        googleSheetUrl: ex.googleSheetUrl || (prevExercises && prevExercises[idx] && prevExercises[idx].googleSheetUrl) || '',
                    }))
                );
            } else {
                setExercises([]);
            }

            const lessonsRes = await axios.get(
                `http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapterId}/lessons`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                }
            );
            if (Array.isArray(lessonsRes.data.lessons)) {
                setLessons(lessonsRes.data.lessons);
            } else {
                setLessons([]);
            }

        } catch (error) {
            console.error("Lỗi khi tải thông tin chương hoặc bài tập/bài học:", error.response?.data?.message || error.message);
            toast.error("Không thể tải thông tin chương hoặc bài tập/bài học: " + (error.response?.data?.message || "Lỗi không xác định"));
            navigate(`/admin/courses/${courseId}`);
        } finally {
            setLoading(false);
        }
    }, [courseId, chapterId, navigate]);

    useEffect(() => {
        if (contextLoading) {
            return;
        }
        if (!isAuthenticated) {
            toast.error("Bạn cần đăng nhập để truy cập trang này.");
            navigate("/login");
            return;
        } else if (user && user.role !== "admin") {
            toast.error("Bạn không có quyền truy cập trang này.");
            navigate("/");
            return;
        }

        if (!courseId) {
            toast.error("Không tìm thấy ID khóa học trong URL. Vui lòng quay lại trang quản lý khóa học.");
            navigate(`/admin/course`);
            return;
        }

        if (chapterId && chapterId !== 'new') {
            setIsEditMode(true);
            fetchChapterDetails();
        } else {
            setIsEditMode(false);
            setChapterName('');
            setOrder(1);
            setIsPublished(false);
            setExercises([]);
            setLessons([]);
            setEditingLesson(null);
            setLoading(false);
            // Clear Google Sheet import related states on new chapter
            setGoogleSheetUrl('');
            setExcelExerciseTitle(''); // Reset title for new chapter
            setExcelExerciseIsPublished(false);
        }

    }, [courseId, chapterId, isAuthenticated, user, contextLoading, navigate, fetchChapterDetails]);

    const handleSubmitChapter = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!chapterName.trim() || chapterName.trim().length < 3 || chapterName.trim().length > 100) {
            toast.error("Tiêu đề chương phải từ 3 đến 100 ký tự.");
            setLoading(false);
            return;
        }
        const parsedOrder = parseInt(order);
        if (isNaN(parsedOrder) || parsedOrder < 1) {
            toast.error("Thứ tự chương phải là một số nguyên dương.");
            setLoading(false);
            return;
        }
        if (!courseId) {
            toast.error("Không tìm thấy ID khóa học. Vui lòng quay lại trang chỉnh sửa khóa học.");
            setLoading(false);
            return;
        }

        const exerciseIds = exercises.map(ex => ex._id).filter(Boolean);
        const lessonIds = lessons.map(les => les._id).filter(Boolean);

        const chapterData = {
            title: chapterName.trim(),
            order: parsedOrder,
            isPublished: isPublished,
            exercises: exerciseIds,
            lessons: lessonIds,
        };

        if (googleSheetUrl.trim()) {
            chapterData.googleSheetUrl = normalizeGoogleSheetUrl(googleSheetUrl.trim());
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                setLoading(false);
                navigate("/login");
                return;
            }

            let res;
            if (isEditMode) {
                res = await axios.put(
                    `http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapterId}`,
                    chapterData,
                    {
                        headers: { "Authorization": `Bearer ${token}` },
                        withCredentials: true,
                    }
                );
                toast.success(res.data.message || "Cập nhật chương thành công!");
                navigate(`/admin/courses/${courseId}`, { state: { chapterModified: true } });
            } else {
                res = await axios.post(
                    `http://localhost:4000/api/v1/courses/${courseId}/chapters`,
                    chapterData,
                    {
                        headers: { "Authorization": `Bearer ${token}` },
                        withCredentials: true,
                    }
                );
                toast.success(res.data.message || "Thêm chương mới thành công!");
                navigate(`/admin/courses/${courseId}`, { state: { chapterModified: true } });
            }
        } catch (error) {
            console.error("Lỗi khi gửi form chương:", error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || "Thao tác thất bại.");
        } finally {
            setLoading(false);
        }
    };

    const handleCloseLessonForm = useCallback(() => {
        setShowLessonForm(false);
        setEditingLesson(null);
    }, []);

    // Handle Google Sheet URL change
    const handleGoogleSheetUrlChange = (e) => {
        let url = e.target.value;
        url = normalizeGoogleSheetUrl(url);
        setGoogleSheetUrl(url);
    };

    // Function to parse Google Sheet and directly create/update Exercise
    const handleProcessGoogleSheet = async () => {
        if (!googleSheetUrl.trim()) {
            toast.error("Vui lòng nhập URL Google Sheet.");
            return;
        }
        // Basic URL validation
        if (!googleSheetUrl.startsWith('http://') && !googleSheetUrl.startsWith('https://')) {
            toast.error("URL Google Sheet không hợp lệ. Vui lòng nhập URL đầy đủ (ví dụ: https://...).");
            return;
        }
        if (!excelExerciseTitle.trim() || excelExerciseTitle.trim().length < 3 || excelExerciseTitle.trim().length > 100) {
            toast.error("Tiêu đề bài tập phải từ 3 đến 100 ký tự.");
            return;
        }

        setLoading(true);
        try {
            // Fetch data from Google Sheet URL
            const response = await axios.get(normalizeGoogleSheetUrl(googleSheetUrl), { responseType: 'arraybuffer' });
            const sheetData = response.data; // Assuming the URL points to a published CSV/TSV

            // Use XLSX to parse the fetched data (it can handle CSV/TSV strings)
            const workbook = XLSX.read(sheetData, { type: 'string' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            if (!json || json.length === 0) {
                toast.error("Google Sheet trống hoặc không có dữ liệu hợp lệ.");
                setLoading(false);
                return;
            }

            const transformedData = transformExcelDataToQuestions(json);
            const questionsFromSheet = transformedData.questions;
            const typeFromSheet = transformedData.inferredType;

            if (questionsFromSheet.length === 0) {
                toast.error("Không tìm thấy câu hỏi hợp lệ.");
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                setLoading(false);
                navigate("/login");
                return;
            }
            // Try to find an existing exercise by title within this chapter
            const generatedOrder = exercises.length + 1;

            const newExerciseData = {
                title: excelExerciseTitle.trim(),
                type: typeFromSheet,
                order: generatedOrder,
                passingScore: 0,
                timeLimit: null,
                isPublished: excelExerciseIsPublished,
                questions: questionsFromSheet,
                googleSheetUrl: normalizeGoogleSheetUrl(googleSheetUrl.trim()),
            };

            console.log("Dữ liệu gửi lên update:", newExerciseData);

            const res = await axios.post(
                `http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapterId}/exercises`,
                newExerciseData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                }
            );

            setExercises(prevExercises => [...prevExercises, res.data.exercise]);
            toast.success(res.data.message || `Tạo bài tập "${excelExerciseTitle}" từ Google Sheet thành công!`);

            // Clear form fields after successful operation
            setGoogleSheetUrl('');
            setExcelExerciseTitle('');
            setExcelExerciseIsPublished(false);

        } catch (error) {
            console.error("Lỗi khi đọc, xử lý Google Sheet hoặc tạo/cập nhật bài tập:", error.response?.data?.message || error.message);
            toast.error("Lỗi: " + (error.response?.data?.message || "Không thể xử lý bài tập từ Google Sheet."));
        } finally {
            setLoading(false);
        }
    };

    // Helper function to transform sheet data (now from Google Sheet)
    const transformExcelDataToQuestions = (sheetData) => {
        const transformedQuestions = [];
        let inferredType = 'multiple-choice'; // Default inference

        if (sheetData.length > 0) {
            const firstRow = sheetData[0];
            // Infer type: if no 'option1' and correctAnswer is 'true'/'false', then True/False
            if (!firstRow.option1 && (String(firstRow.correctAnswer || '').toLowerCase() === 'true' || String(firstRow.correctAnswer || '').toLowerCase() === 'false')) {
                inferredType = 'true-false';
            }
        }

        for (const row of sheetData) {
            const q = {
                questionText: String(row.questionText || ''),
                questionAudio: String(row.questionAudio || ''),
                questionImage: String(row.questionImage || ''),
                points: Number(row.points) || 0,
            };

            if (inferredType === "multiple-choice") {
                q.options = [];
                for (let i = 1; i <= 4; i++) { // Assuming up to 4 options (option1, option2, ...)
                    if (row[`option${i}`] !== undefined && row[`option${i}`] !== null) {
                        q.options.push(String(row[`option${i}`]));
                    }
                }
                q.correctAnswer = Number(row.correctAnswer); // correct answer is 0-based index

            } else if (inferredType === "true-false") {
                q.correctAnswer = String(row.correctAnswer || '').toLowerCase(); // correct answer is "true" or "false" string
            }
            transformedQuestions.push(q);
        }
        return { questions: transformedQuestions, inferredType };
    };

    if (contextLoading) {
        return (
            <div className="dashboard-container">
                <p>Đang kiểm tra quyền truy cập...</p>
            </div>
        );
    }
    if (!isAuthenticated || (user && user.role !== "admin")) {
        return null;
    }

    if (loading && isEditMode && chapterId && chapterId !== 'new' && !chapterName) {
        return (
            <div className="dashboard-container">
                <p>Đang tải thông tin chương...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2 className="h2">{isEditMode ? 'Chỉnh sửa chương' : 'Thêm chương mới'}</h2>
            </div>
            <form onSubmit={handleSubmitChapter}>
                <div className="add-chapter-grid">
                    <div className="chapter-upload">
                        <div className="excel-exercise-import-box upload-box mt-4">
                            <div className="upload-header">
                                <h3>Import câu hỏi bài tập từ Google Sheet</h3>
                            </div>
                            <div className="form-fields">
                                <div className="chapter-form-group">
                                    <label htmlFor="chapter-toggle-label">Tiêu đề bài tập</label>
                                    <input
                                        id="excelExerciseTitle"
                                        type="text"
                                        className="input"
                                        placeholder="Nhập tiêu đề bài tập (để tạo mới hoặc cập nhật)"
                                        value={excelExerciseTitle}
                                        onChange={(e) => setExcelExerciseTitle(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="chapter-form-group">
                                    <label htmlFor="chapter-toggle-label">URL bài tập    </label>
                                    <input
                                        id="googleSheetUrl"
                                        type="text"
                                        className="input"
                                        placeholder="Ví dụ: https://docs.google.com/spreadsheets/d/.../export?format=csv"
                                        value={googleSheetUrl}
                                        onChange={handleGoogleSheetUrlChange}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="chapter-form-group">
                                    <label htmlFor="isPublishedImportExercise" className="chapter-toggle-label">
                                        <input
                                            type="checkbox"
                                            id="isPublishedImportExercise"
                                            checked={excelExerciseIsPublished}
                                            onChange={e => setExcelExerciseIsPublished(e.target.checked)}
                                            disabled={loading}
                                        />
                                        <span className="chapter-toggle-slider"></span>
                                        Xuất bản bài tập này?
                                    </label>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="create-btn"
                                onClick={handleProcessGoogleSheet}
                                disabled={loading || !googleSheetUrl.trim() || !excelExerciseTitle.trim()}
                            >
                                Xử lý Google Sheet và tạo bài tập
                            </button>
                        </div>
                    </div>
                    <div className="chapter-fields">
                        <div className="form-fields">
                            <div className="form-group">
                                <label htmlFor="chapterName">Tiêu đề chương</label>
                                <input
                                    id="chapterName"
                                    type="text"
                                    className="input"
                                    placeholder="Nhập tiêu đề chương"
                                    value={chapterName}
                                    onChange={(e) => setChapterName(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="chapterOrder">Thứ tự chương</label>
                                <input
                                    id="chapterOrder"
                                    type="number"
                                    className="input"
                                    placeholder="Thứ tự hiển thị"
                                    value={order}
                                    onChange={(e) => setOrder(e.target.value)}
                                    required
                                    min="1"
                                    disabled={loading}
                                />
                            </div>
                            <div className="chapter-form-group">
                                <label htmlFor="isPublished" className="chapter-toggle-label">
                                    <input
                                        type="checkbox"
                                        id="isPublished"
                                        checked={isPublished}
                                        onChange={(e) => setIsPublished(e.target.checked)}
                                        disabled={loading}
                                    />
                                    <span className="chapter-toggle-slider"></span>
                                    Xuất bản chương này?
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Các phần còn lại: nút, danh sách bài học, bài tập... */}
                {chapterId && chapterId !== 'new' && (
                    <div className="d-flex justify-content-between align-items-center mt-4">
                        <button
                            type="button"
                            className="create-btn2"
                            onClick={() => {
                                setEditingLesson(null);
                                setShowLessonForm(true);
                            }}
                            disabled={loading}
                        >
                            + Thêm bài học
                        </button>
                    </div>
                )}
                {lessons.length > 0 && (
                    <div className="ex-list-container">
                        <h4>Danh sách bài học:</h4>
                        <ul className="ex-items-list">
                            {lessons
                                .sort((a, b) => a.order - b.order)
                                .map((lesson) => (
                                    <li key={lesson._id} className="ex-item-display">
                                        <div className="ex-info">
                                            <span className="ex-order">Bài học {lesson.order}:</span>
                                            <span className="ex-title">{lesson.title}</span>
                                        </div>
                                        <div className="ex-actions">
                                            <button
                                                type="button"
                                                className="lesson-icon-btn lesson-edit-icon"
                                                onClick={() => handleEditLesson(lesson)}
                                                title="Sửa bài học"
                                                disabled={loading}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                type="button"
                                                className="lesson-icon-btn lesson-delete-icon"
                                                onClick={() => handleDeleteLesson(lesson._id, lesson.title)}
                                                title="Xóa bài học"
                                                disabled={loading}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}
                {exercises.length > 0 && (
                    <div className="ex-list-container">
                        <h4>Danh sách bài tập:</h4>
                        <ul className="ex-items-list">
                        {exercises
                            .filter(ex => ex._id)
                            .sort((a, b) => a.order - b.order)
                            .map((ex) => (
                                <li key={ex._id} className="ex-item-display">
                                    <div className="ex-info">
                                        <span className="ex-order">Bài tập {ex.order}:</span>
                                        <span className="ex-title">{ex.title}</span>
                                    </div>
                                    <div className="ex-actions">
                                        <label className="chapter-toggle-label" style={{marginRight: 8}}>
                                            <input
                                                type="checkbox"
                                                checked={ex.isPublished === true}
                                                onChange={async (e) => {
                                                    if (!ex._id) return;
                                                    try {
                                                        setLoading(true);
                                                        const token = localStorage.getItem('token');
                                                        await axios.put(
                                                            `http://localhost:4000/api/v1/courses/${courseId}/chapters/${chapterId}/exercises/${ex._id}`,
                                                            { isPublished: e.target.checked },
                                                            {
                                                                headers: { Authorization: `Bearer ${token}` },
                                                                withCredentials: true,
                                                            }
                                                        );
                                                        await fetchChapterDetails();
                                                        toast.success("Cập nhật trạng thái xuất bản thành công!");
                                                    } catch {
                                                        toast.error("Cập nhật trạng thái xuất bản thất bại!");
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                                disabled={loading}
                                            />
                                            <span className="chapter-toggle-slider"></span>
                                        </label>
                                        <button
                                            type="button"
                                            className="lesson-icon-btn lesson-edit-icon"
                                            onClick={() => handleUpdateExerciseFromSheet(ex)}
                                            title="Cập nhật bài tập từ Google Sheet"
                                            disabled={loading}
                                        >
                                            🔄
                                        </button>
                                        <button
                                            type="button"
                                            className="lesson-icon-btn lesson-delete-icon"
                                            onClick={() => handleDeleteExercise(ex._id, ex.title)}
                                            title="Xóa bài tập"
                                            disabled={loading}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </li>
                            ))}
                            </ul>
                    </div>
                )}
                <div className="action-buttons">
                    <button
                        type="submit"
                        className="create-btn"
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : (isEditMode ? 'Cập nhật chương' : 'Tạo chương')}
                    </button>
                    <button
                        type="button"
                        className="back-btn"
                        onClick={() => navigate(`/admin/courses/${courseId}`)}
                        disabled={loading}
                    >
                        Trở lại khóa học
                    </button>
                </div>
            </form>

            {/* Form tạo/sửa bài học (modal) */}
            {showLessonForm && (
                <CreateLessonForm
                    onClose={handleCloseLessonForm}
                    courseId={courseId}
                    chapterId={chapterId}
                    suggestedOrder={lessons.length + 1}
                    onLessonCreated={handleLessonCreated}
                    editingLesson={editingLesson}
                />
            )}
        </div>
    );
}

export default AddChapter;