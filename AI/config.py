import os
from dotenv import load_dotenv

load_dotenv()

# Cloudinary Configuration (cho audio upload)
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', 'dzwszwkvd')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '721343782453358')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', 'cqQDFgoAc7FFk97YTPj3sRut1zM')

# MongoDB Configuration (cho việc lưu câu hỏi)
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://thaihoangan0842:thaihoangan0842@cluster0.fm3uque.mongodb.net/DA_ENGLISH?retryWrites=true')

# Backend API Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:4000')

# Local Model Configuration
MODEL_PATH = os.getenv('MODEL_PATH', 'C:/Users/ADMIN/Desktop/KLTN/8_7/KLTN/AI/gemma-3-1b-it')

# Server Configuration
PORT = int(os.getenv('PORT', 5000))
FLASK_ENV = os.getenv('FLASK_ENV', 'development')

# Model Performance Configuration
MAX_QUESTIONS_PER_REQUEST = int(os.getenv('MAX_QUESTIONS_PER_REQUEST', 5))
MODEL_MAX_LENGTH = int(os.getenv('MODEL_MAX_LENGTH', 512))
MODEL_TEMPERATURE = float(os.getenv('MODEL_TEMPERATURE', 0.7))