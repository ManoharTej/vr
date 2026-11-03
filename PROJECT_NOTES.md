# Project Notes — StyleSpeak

## Project title
Voice-Controlled Augmented Reality Virtual Outfit Try-On and Fashion Assistance System

## System type
Browser-based web application prototype.

## Four modules
### 1. User Input and Capture
Captures a live webcam stream or accepts a user-selected image. The browser handles the preview locally.

### 2. Virtual Outfit Try-On
Displays a garment SVG over the preview. The user can select a garment category, change its colour, and adjust position and size. This is a visual demonstration layer, not physical cloth simulation.

### 3. Voice-Controlled Interaction
Uses browser speech recognition to convert spoken commands into text. A built-in intent matcher maps words such as colours and garment categories to UI actions.

### 4. Smart Fashion Assistant
Uses a local rule-based recommendation dataset. Occasion and preference selections produce garment and colour suggestions. The user can apply a suggestion to the Virtual Studio.

## Architecture
Browser UI (HTML/CSS/JS)
- Capture: getUserMedia + File API
- Visualization: inline SVG + CSS
- Voice: Web Speech API + local intent matching
- Recommendations: local JavaScript rule engine
- Persistence: localStorage

## Why no API/backend in this deadline build?
The four core demonstration flows can run entirely in the browser. This removes API key setup, server configuration, network dependencies and paid inference. A backend can be added later for AI model inference and persistent multi-user data.

## Limitations and future work
- Automatic body pose detection using MediaPipe Pose.
- Person segmentation using MediaPipe Image Segmentation.
- Realistic garment synthesis using a pretrained virtual try-on model.
- Backend inference service using FastAPI.
- User accounts and cloud storage.
- More advanced NLP intent classification.
- Expanded garment dataset and product metadata.

## Suggested live demonstration
1. Open Virtual Studio and start webcam.
2. Upload an image as an alternative input demonstration.
3. Select Dress and choose Rose colour.
4. Use voice command “change to navy” or “show a jacket”.
5. Open Outfit Catalogue and load a sample garment.
6. Open Fashion Assistant, choose Job Interview and generate an idea.
7. Click Try this outfit to send the recommendation to Virtual Studio.
8. Explain the limitations honestly: overlay-based preview now; pose-aware AI try-on is the next development phase.
