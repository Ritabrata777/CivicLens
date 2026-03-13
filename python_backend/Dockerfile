# Use Python 3.10
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for OpenCV and EasyOCR
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user (Security best practice & Fixes permissions)
RUN useradd -m -u 1000 user

# Copy requirements first to leverage cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application AND set ownership to 'user'
COPY --chown=user . .

# Switch to the user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Expose port (Hugging Face Spaces default is 7860)
EXPOSE 7860

# Command to run the app
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
