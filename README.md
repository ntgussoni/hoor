# Hoor - Veterinary Consultation Recording & Transcription

A web application for veterinarians to record patient consultations and automatically transcribe them with AI-powered content filtering.

## Features

- 🎤 **Audio Recording**: Record consultations with pause/resume functionality
- ⏱️ **Timer Controls**: Set recording timers (15, 20, or 30 minutes) with alarms
- 📊 **Audio Visualization**: Real-time audio level monitoring
- 🎯 **Speaker Separation**: Automatic identification of Veterinarian and other speakers
- 🤖 **AI Transcription**: Powered by ElevenLabs speech-to-text
- 🧹 **Content Filtering**: OpenAI-powered filtering to remove smalltalk and non-essential content
- ☁️ **Cloud Storage**: Automatic upload to Cloudflare R2
- 📝 **Transcription Editing**: Edit and refine transcriptions after generation
- 📤 **Export Options**: Copy to clipboard or download as text file

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Audio Processing**: Web Audio API
- **Speech-to-Text**: ElevenLabs API via Vercel AI SDK
- **Content Filtering**: OpenAI o3-mini via Vercel AI SDK
- **Storage**: Cloudflare R2
- **Deployment**: Vercel (recommended)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd hoor
npm install
```

### 2. Environment Variables

Copy the environment template and fill in your API keys:

```bash
cp env.template .env.local
```

Required environment variables:

```env
# ElevenLabs API
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Cloudflare R2 Storage
R2_ACCESS_KEY_ID=your_r2_access_key_id_here
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key_here
R2_BUCKET_NAME=your_r2_bucket_name_here
R2_ENDPOINT_URL=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-public-domain.com
```

### 3. API Keys Setup

#### ElevenLabs API

1. Sign up at [ElevenLabs](https://elevenlabs.io)
2. Get your API key from the dashboard
3. Add to `ELEVENLABS_API_KEY`
4. Note: We use the Vercel AI SDK integration for better performance and consistency

#### OpenAI API

1. Sign up at [OpenAI](https://platform.openai.com)
2. Create an API key
3. Add to `OPENAI_API_KEY`

#### Cloudflare R2

1. Sign up at [Cloudflare](https://cloudflare.com)
2. Go to R2 Object Storage
3. Create a bucket
4. Create API tokens with R2 permissions
5. Set up a custom domain for public access (optional)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Select Audio Input**: Choose your microphone from the dropdown
2. **Set Timer**: Select recording duration (15, 20, or 30 minutes)
3. **Choose Language**: Select the consultation language (default: Dutch)
4. **Start Recording**: Click "Start Recording" to begin
5. **Monitor Audio**: Watch the audio level bar to ensure recording is working
6. **Pause/Resume**: Use pause/resume controls as needed
7. **Stop Recording**: Click stop when consultation is complete
8. **Transcribe**: Click "Transcribe Audio" to process the recording
9. **Review & Edit**: Edit the transcription as needed
10. **Export**: Copy to clipboard or download as text file

## API Endpoints

### POST /api/transcribe

Transcribes audio files using ElevenLabs and filters content with OpenAI.

**Request:**

- `audio`: Audio file (FormData)
- `language`: Language code (optional, default: "nl")

**Response:**

```json
{
  "success": true,
  "transcription": "Filtered transcription text...",
  "originalTranscription": "Raw transcription text...",
  "language": "nl",
  "languageProbability": 0.98,
  "audioUrl": "https://r2-url/recording.webm"
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Browser Compatibility

- Chrome 66+
- Firefox 60+
- Safari 14+
- Edge 79+

Requires Web Audio API and MediaRecorder support.

## Security Considerations

- API keys are stored securely in environment variables
- Audio files are temporarily processed and uploaded to R2
- No user authentication required for V1
- Audio files are retained permanently in R2

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

1. Check the GitHub issues
2. Create a new issue with detailed description
3. Include browser version and error messages

## Roadmap

- [ ] User authentication and accounts
- [ ] Multi-user clinic support
- [ ] Mobile app version
- [ ] Integration with veterinary practice management systems
- [ ] Advanced speaker recognition and learning
- [ ] Export to PDF format
- [ ] Patient/pet information association
