

# 🌾 KisanMitra — AI Farm Advisory Platform

An AI-powered farm advisory web app for Indian rural farmers, featuring real-time voice conversations, crop disease diagnosis from photos, and multilingual support.

---

## Page 1: Home & Language Selection

- **Welcome screen** with the app name/logo and a simple tagline
- **Language selector** prominently displayed — Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, English
- Selected language persists across sessions
- Large, clear "Start Advisory" and "Scan Crop" action buttons
- Clean, standard UI with good contrast and readable fonts

## Page 2: Voice Advisory Chat

- **Real-time voice conversation** with the AI advisor using OpenAI Realtime API
- Farmer taps a microphone button to start speaking in their language
- AI responds with voice in the same language
- Visual indicators showing when AI is listening vs. speaking
- Text transcript displayed alongside for reference
- AI is prompted as an agricultural expert with knowledge of Indian crops, seasons, soil types, pest management, and government schemes
- Chat history persisted for the session

## Page 3: Text Chat (Alternative)

- Standard text-based chat interface for farmers who prefer typing
- Supports the selected language
- Markdown-rendered AI responses with clear formatting
- Quick-action suggestion chips (e.g., "Pest on my tomatoes", "Best time to sow wheat", "Weather forecast")

## Page 4: Crop Disease Scanner

- **Camera/upload interface** — farmer takes a photo of a diseased leaf or crop
- Image sent to AI vision model (Gemini) with specialized agricultural prompting
- Returns: identified disease/issue, severity assessment, recommended treatment, and preventive measures
- Results displayed in the farmer's selected language
- Option to continue discussing the diagnosis in voice or text chat

## Page 5: Weather & Seasonal Advisory

- Location-based weather information (using browser geolocation)
- Seasonal crop calendar and planting recommendations
- Weather risk alerts relevant to current crops
- Data sourced via weather APIs

## Page 6: Knowledge Base / FAQ

- Common farming questions organized by category (pest control, soil health, irrigation, seeds, government schemes)
- Searchable in the selected language
- Curated content that works offline when cached

## Backend & Infrastructure

- **Lovable Cloud** for backend edge functions
- **Lovable AI Gateway** (Gemini) for text chat and crop image analysis
- **OpenAI Realtime API** for voice-to-voice conversations
- **PWA setup** for home screen installation and basic offline caching
- **Supabase database** to store chat history and usage analytics

## Technical Notes

- The crop disease scanner uses Gemini's vision model with expert agricultural system prompts — a custom-trained model can be swapped in later via API endpoint
- Offline mode will cache the knowledge base and allow queued queries that sync when online
- The app is a web-based PWA, installable on any smartphone from the browser

