# Hoor - Veterinary Consultation Recording & Transcription App

## Product Overview

Hoor is a web application designed for veterinarians to record patient consultations and automatically transcribe them into structured text, filtering out non-essential conversation elements like smalltalk.

## Problem Statement

Veterinarians need to maintain detailed records of patient consultations but often struggle to:

- Take comprehensive notes while focusing on the patient
- Remember all details discussed during consultations
- Distinguish between important medical information and casual conversation
- Efficiently document multi-speaker conversations

## Solution

A simple, intuitive web application that allows veterinarians to:

1. Record consultations with visual audio feedback
2. Set customizable recording timers to prevent infinite recording
3. Transcribe audio using AI-powered speech-to-text
4. Automatically separate and identify different speakers
5. Filter out non-essential conversation elements

## Target Users

- **Primary**: Individual veterinarians and veterinary clinic staff
- **Secondary**: Veterinary students and researchers

## Core Features

### 1. Recording Interface

- **Record Button**: Large, prominent button to start/stop recording
- **Pause/Resume**: Ability to pause and resume recording during consultation
- **Audio Input Visualizer**: Real-time audio level bar showing input is working
- **Audio Input Selector**: Dropdown to choose microphone/audio input device
- **Timer Setting**: Pre-recording timer configuration (default: 20 minutes, presets: 15min, 20min, 30min)
- **Timer Alert**: Visual and audio alarm when timer elapses
- **Continue/Stop Options**: Clear buttons to either continue or stop recording after timer

### 2. Transcription Engine

- **Speech-to-Text**: Powered by ElevenLabs API
- **Language Selection**: UI dropdown for language selection (default: Dutch)
- **Speaker Separation**: Automatic identification with "Veterinarian" and "Speaker 1", "Speaker 2" labels
- **Content Filtering**: OpenAI o3-mini model filtering to remove smalltalk and non-essential content
- **Transcription Editing**: Ability to edit and refine transcriptions after generation

### 3. User Interface

- **Design System**: shadcn/ui components for professional, accessible interface
- **Simple Layout**: Clean, distraction-free interface with consistent styling
- **Visual Feedback**: Clear recording status indicators using shadcn components
- **Responsive Design**: Works on desktop and tablet devices
- **Component Library**: Buttons, dropdowns, progress bars, and form elements from shadcn

## Technical Requirements

### Frontend

- **Framework**: Next.js (already configured)
- **UI Components**: shadcn/ui for consistent, accessible design system
- **Audio Recording**: Web Audio API for recording functionality
- **Audio Visualization**: Canvas-based audio level visualization
- **State Management**: React hooks for recording state

### Backend Integration

- **ElevenLabs API**: Speech-to-text transcription service
- **OpenAI API**: Content filtering and text processing using o3-mini model
- **Vercel AI SDK**: Integration with `@ai-sdk/openai` for text generation
- **API Key Management**: Secure storage and usage of ElevenLabs and OpenAI API keys
- **Cloud Storage**: Cloudflare R2 for persistent audio file storage
- **File Management**: Upload to R2, temporary local processing, cleanup

### Browser Compatibility

- Modern browsers with Web Audio API support
- Chrome, Firefox, Safari, Edge (latest versions)

## User Flow

1. **Setup**

   - User opens the application
   - Selects audio input device from dropdown
   - Optionally sets recording timer (default: 30 minutes)

2. **Recording**

   - User clicks "Start Recording" button
   - Audio input visualizer shows real-time levels
   - Timer counts down (if set)
   - When timer elapses: alarm sounds and continue/stop options appear

3. **Transcription**

   - User clicks "Stop Recording"
   - Audio file automatically uploads to R2 storage
   - "Transcribe" button becomes available
   - User selects language (default: Dutch)
   - User clicks "Transcribe" to process audio from R2
   - Transcription appears with speaker separation

4. **Review & Edit**
   - User can review transcription with speaker labels
   - User can edit transcription text directly
   - User can copy transcription
   - Option to start new recording

## Success Metrics

- **Usability**: Recording can be started within 10 seconds of page load
- **Accuracy**: Transcription accuracy > 90% for clear speech
- **Performance**: Transcription completes within 2x real-time duration
- **Reliability**: 99% uptime for recording functionality

## Future Enhancements (V2)

- Export transcriptions to PDF/text files
- Patient/pet information association
- User accounts and login system
- Multi-user clinic support
- Mobile app version
- Integration with veterinary practice management systems
- Advanced speaker recognition and learning

## Technical Implementation Notes

### ElevenLabs Integration

- Use `@elevenlabs/elevenlabs-js` npm package
- API endpoint: `https://api.elevenlabs.io/v1/speech-to-text`
- Required parameters: `model_id`, `file`, `language_code`
- Optional parameters: `diarize` (for speaker separation), `tag_audio_events`

### OpenAI Content Filtering

- Use `@ai-sdk/openai` and `ai` packages
- Model: `o3-mini` for content filtering
- Process raw transcription to remove smalltalk and non-essential content
- Maintain speaker labels during filtering process

### Audio Recording

- Web Audio API for recording
- Support for common audio formats (WAV, MP3)
- File size limit: < 3GB (ElevenLabs limit)
- Automatic upload to Cloudflare R2 for persistence

### Security Considerations

- API key protection (ElevenLabs, OpenAI, and R2 credentials)
- Secure R2 bucket configuration
- Temporary file cleanup after R2 upload
- Audio files retained permanently (no auto-deletion)
- No user authentication required for V1

## Development Phases

### Phase 1: Core Recording (Week 1-2)

- shadcn/ui setup and component integration
- Basic recording interface with shadcn components
- Audio input selection dropdown
- Timer functionality with progress indicators
- Audio visualization

### Phase 2: Transcription Integration (Week 3)

- R2 storage integration
- ElevenLabs API integration
- OpenAI content filtering integration
- Language selection
- Basic transcription display with speaker labels

### Phase 3: Speaker Separation & Polish (Week 4)

- Speaker diarization with shadcn card components
- Transcription editing interface with shadcn form components
- UI/UX improvements and accessibility enhancements
- Error handling with shadcn alert components
- Testing and optimization

## Questions for Refinement

1. What specific "non-important parts" should be filtered out?
2. How many speakers typically participate in consultations?
3. Should transcriptions be editable after generation?
4. Do you need export functionality in V1?
5. Any specific design preferences or brand guidelines?
6. What's the expected consultation length for timer defaults?
