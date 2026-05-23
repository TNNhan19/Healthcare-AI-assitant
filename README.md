# Healthcare App with AI/RAG Assistant

A cleaned portfolio version of a healthcare web application that combines healthcare e-commerce features with an AI-powered assistant for product and FAQ-based question answering.

The original system includes core healthcare platform features such as product browsing, authentication, cart and order management, admin/pharmacist workflows, and health-related services.

This version highlights the technical components related to:

- Healthcare product data management
- AI chatbot integration
- Retrieval-Augmented Generation (RAG)
- Product and FAQ-based question answering
- Chatbot UI and backend API integration
- Basic medical safety guardrails

## Project Overview

The application is designed as a healthcare web platform where users can browse healthcare products, manage orders, and interact with an AI assistant for product-related questions.

The AI assistant uses product and FAQ data as knowledge sources to retrieve relevant context before generating responses. This helps make the chatbot more grounded in the available project data instead of relying only on general model knowledge.

## Key Features

- Healthcare product browsing and product detail pages
- User authentication and role-based access
- Cart and order management
- Admin and pharmacist-related workflows
- Health news and healthcare-related content
- AI chatbot interface
- Product/FAQ-based retrieval flow
- Conversation and chat-related backend services
- Basic guardrails for healthcare-related responses

## AI and Data Focus

This repository emphasizes the data and AI-related parts of the system, including:

- Structured healthcare product data
- Product category data
- FAQ knowledge source
- Data import and parsing scripts
- AI chatbot backend API
- RAG-related service structure
- Chatbot UI components
- Medical response safety handling

## Tech Stack

- React
- TypeScript
- Node.js
- Express.js
- MongoDB / Mongoose
- Python
- Streamlit
- Docker
- RAG-related chatbot services

## Project Structure

```txt
.
├── ai-service/              # AI assistant and guardrail-related service
├── chatbot-service/         # Chatbot backend, Python chatbot service, and RAG-related modules
├── controllers/             # Main backend controllers
├── routes/                  # API routes
├── models/                  # MongoDB/Mongoose models
├── middlewares/             # Authentication and role-based middleware
├── services/                # Backend services
├── data/                    # Healthcare product/category data
├── frontend/                # Extracted chatbot UI components
├── src/                     # Main React frontend source
├── config/                  # Database configuration
└── docs / *.md              # Project documentation
```
