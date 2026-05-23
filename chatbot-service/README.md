# Healthcare AI Chatbot Service

This is a standalone microservice for the Healthcare AI Chatbot. It includes both frontend and backend components.

## Structure
```
chatbot-service/
├── backend/              # Python FastAPI backend
│   ├── src/             # Source code
│   │   ├── main.py      # Main application file
│   │   ├── rag_system.py
│   │   └── medical_guardrails.py
│   └── requirements.txt  # Python dependencies
├── frontend/            # React frontend
│   ├── src/            # Source code
│   ├── package.json    # Frontend dependencies
│   └── vite.config.ts  # Vite configuration
└── package.json        # Root package.json for managing both services
```

## Prerequisites
- Node.js >= 16
- Python >= 3.8
- pip (Python package manager)

## Installation

1. Clone the repository
2. Install all dependencies:
```bash
npm run install:all
```

This will:
- Install root dependencies
- Install frontend dependencies
- Install Python backend dependencies

## Environment Variables

Create a `.env` file in the backend directory:
```env
HUGGINGFACE_API_KEY=your_key_here
PORT=8000
```

## Running the Service

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The service will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## API Endpoints

### Chat Endpoint
POST /chat
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, I have a question about..."
    }
  ]
}
```