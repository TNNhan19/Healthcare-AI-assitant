# Base image Python 3.11 slim
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Upgrade pip, setuptools, wheel
RUN pip install --upgrade pip setuptools wheel \
    && pip install numpy==1.25.2 cython==3.0.10 \
    && pip install scikit-learn==1.3.0 pandas==2.0.3 \
    && pip install torch==2.2.0 transformers==4.35.2 sentence-transformers==3.0.1 accelerate==0.24.1 bitsandbytes==0.41.1 \
    && pip install langgraph \
    && pip install -r requirements.txt

# Copy toàn bộ code
COPY . .

# Expose port
EXPOSE 8003

# Command chạy server
CMD ["python", "src/services/chat_runner.py"]
