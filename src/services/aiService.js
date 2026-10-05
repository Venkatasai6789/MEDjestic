/**
 * MEDjestic AI Service Client
 * 
 * Centralized API client for the AI inference service.
 * All AI communication goes through this module — no hardcoded URLs elsewhere.
 * 
 * The AI endpoint URL is configured via VITE_AI_API_URL environment variable.
 * Defaults to localhost:7860 for local development.
 */

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:7860';

/**
 * Check if the AI service is healthy and model is loaded.
 */
export async function healthCheck() {
  const response = await fetch(`${AI_API_URL}/health`, {
    method: 'GET',
    signal: AbortSignal.timeout(10000),
  });
  return response.json();
}

/**
 * Get model metadata and capabilities.
 */
export async function getModelInfo() {
  const response = await fetch(`${AI_API_URL}/model/info`, {
    method: 'GET',
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`Model info failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Classify a medical waste image.
 * 
 * @param {File|Blob} file - Image file to classify
 * @returns {Promise<Object>} - Classification result matching CameraScanner schema
 */
export async function predictImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`${AI_API_URL}/predict`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || errData.error || `AI service error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    // If cloud endpoint fails or times out, attempt local AI service fallback
    if (AI_API_URL.includes('hf.space')) {
      console.warn("Cloud AI endpoint timed out or failed. Attempting local fallback...", err);
      try {
        const localForm = new FormData();
        localForm.append('image', file);
        const localUrl = 'http://127.0.0.1:7860/predict';
        const localResp = await fetch(localUrl, {
          method: 'POST',
          body: localForm,
          signal: AbortSignal.timeout(15000),
        });
        if (localResp.ok) {
          return await localResp.json();
        }
      } catch (localErr) {
        console.warn("Local fallback also unavailable:", localErr);
      }
    }
    throw err;
  }
}

/**
 * Classify a webcam frame with temporal stabilization.
 * 
 * @param {Blob} blob - JPEG blob from canvas capture
 * @returns {Promise<Object>} - Stabilized classification result
 */
export async function predictFrame(blob) {
  const formData = new FormData();
  formData.append('image', new File([blob], 'webcam_frame.jpg', { type: 'image/jpeg' }));

  try {
    const response = await fetch(`${AI_API_URL}/predict/frame`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || errData.error || `Frame inference error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    if (AI_API_URL.includes('hf.space')) {
      try {
        const localForm = new FormData();
        localForm.append('image', new File([blob], 'webcam_frame.jpg', { type: 'image/jpeg' }));
        const localResp = await fetch('http://localhost:7860/predict/frame', {
          method: 'POST',
          body: localForm,
          signal: AbortSignal.timeout(10000),
        });
        if (localResp.ok) {
          return await localResp.json();
        }
      } catch (localErr) {
        // Ignore fallback error
      }
    }
    throw err;
  }
}

/**
 * Upload a video for background processing.
 * 
 * @param {File} file - Video file
 * @returns {Promise<{job_id: string, status: string}>}
 */
export async function uploadVideo(file) {
  const formData = new FormData();
  formData.append('video', file);

  const response = await fetch(`${AI_API_URL}/video/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || errData.error || `Video upload error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get video processing job status.
 * 
 * @param {string} jobId
 * @returns {Promise<{id: string, status: string, progress: number}>}
 */
export async function getVideoStatus(jobId) {
  const response = await fetch(`${AI_API_URL}/video/${jobId}/status`);
  if (!response.ok) {
    throw new Error(`Job status error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get video processing job result.
 * 
 * @param {string} jobId
 * @returns {Promise<Object>}
 */
export async function getVideoResult(jobId) {
  const response = await fetch(`${AI_API_URL}/video/${jobId}/result`);
  if (!response.ok) {
    throw new Error(`Job result error: ${response.status}`);
  }
  return response.json();
}

export { AI_API_URL };
