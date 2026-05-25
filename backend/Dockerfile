# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Install system dependencies, including Tesseract OCR and its English, Hindi, and Bengali packages
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-hin \
    tesseract-ocr-ben \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port (Render sets PORT env variable automatically)
EXPOSE 10000

# Run the app with Uvicorn inside Gunicorn
CMD ["gunicorn", "app.main:app", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:10000", "--timeout", "120", "--graceful-timeout", "30"]
