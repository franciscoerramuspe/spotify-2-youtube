# Spotify to YouTube Playlist Migrator

A Next.js application that allows you to migrate your Spotify playlists to YouTube Music. Select specific playlists, choose the number of latest tracks to migrate, and automatically create YouTube playlists with matched songs.

## ✨ Features

- 🎵 **Spotify Integration**: Connect your Spotify account and browse your playlists
- 🎬 **YouTube Music Integration**: Automatically create playlists on YouTube
- 🎯 **Smart Matching**: Find YouTube videos that match your Spotify tracks
- 📊 **Latest Songs Filter**: Migrate only the latest N songs from each playlist
- 🔄 **Batch Processing**: Migrate multiple playlists at once
- 📈 **Migration Reports**: See what was successfully migrated and what wasn't found
- 🚦 **Rate Limiting**: Respects YouTube API quotas with intelligent rate limiting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for local database)
- Spotify Developer Account
- Google Cloud Platform Account (for YouTube Data API)
- PostgreSQL database (Docker Compose setup provided, or Supabase recommended for cloud)

### 1. Clone the Repository

```bash
git clone http://github.com/franciscoerramuspe/spotify-2-youtube
cd spotify-2-youtube/client
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the `client` directory:

```bash
cp env.example .env.local
```

Fill in the required environment variables (see [Environment Setup](#environment-setup) below).

### 4. Set Up Database

#### Option A: Using Docker Compose (Recommended for Local Development)

```bash
# Start PostgreSQL database with Docker Compose
docker-compose up -d postgres

# Wait for database to be ready, then generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push
```

#### Option B: Using External Database (Supabase/Other)

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push
```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env.local` file with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Spotify API Credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Google/YouTube API Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database
DATABASE_URL=your_postgresql_database_url
```

### Setting Up Spotify API

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`
4. Copy Client ID and Client Secret to your `.env.local`

### Setting Up Google/YouTube API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the YouTube Data API v3
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Client Secret to your `.env.local`

### Database Setup

#### Option A: Docker Compose (Local Development)

1. Make sure Docker and Docker Compose are installed
2. Run `docker-compose up -d postgres` from the project root
3. The database will be available at `localhost:5432`
4. Use the default connection string in `.env.local`:
   ```
   DATABASE_URL=postgresql://admin%40example.com:admin@localhost:5432/spotify_youtube_db
   ```
5. Run `cd client && npx prisma db push` to create tables

#### Option B: Supabase (Cloud Database)

1. Create account at [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string to `DATABASE_URL` in your `.env.local`
5. Run `npx prisma db push` to create tables

## 📁 Project Structure

```
client/
├── src/
│   ├── app/                   # Next.js 13+ App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth configuration
│   │   │   ├── migrate/       # Migration endpoint
│   │   │   ├── spotify/       # Spotify API integration
│   │   │   └── disconnect/    # Account disconnection
│   │   ├── select-playlists/  # Playlist selection page
│   │   ├── migrate-config/    # Migration configuration
│   │   ├── migration-results/ # Results display
│   │   └── page.tsx           # Home page
│   ├── lib/                   # Utility libraries
│   │   ├── spotify.ts         # Spotify API functions
│   │   └── youtube.ts         # YouTube API functions
│   └── types/                 # TypeScript type definitions
├── prisma/
│   └── schema.prisma          # Database schema
└── public/                    # Static assets
```

## 🎯 How to Use

1. **Connect Accounts**: Sign in with both Spotify and YouTube (Google) accounts
2. **Select Playlists**: Browse your Spotify playlists and select ones to migrate
3. **Configure Migration**: 
   - Choose playlist name for YouTube
   - Select "All tracks" or "Latest N tracks" per playlist
4. **Start Migration**: The app will:
   - Fetch tracks from selected Spotify playlists
   - Search for matching videos on YouTube
   - Create a new YouTube playlist
   - Add found videos to the playlist
5. **Review Results**: See migration summary with matched/unmatched tracks

## ⚠️ Important Notes

### YouTube API Quotas

- YouTube Data API has a daily quota limit (10,000 units by default)
- Each track search consumes 100 quota units
- Plan accordingly: ~100 tracks = 10,000 units (full daily quota)
- The app includes rate limiting (1.1 seconds between searches)

### Track Matching

- Matching is based on track name + artist name
- Not all Spotify tracks may have YouTube equivalents
- Results depend on YouTube's search algorithm
- Local files and region-restricted content may not match

## 🔧 Development

### Docker Commands

```bash
# Start database service
docker-compose up -d

# Stop database service
docker-compose down

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Management

```bash
npx prisma studio             # Open Prisma Studio (database GUI)
npx prisma generate           # Regenerate Prisma client
npx prisma db push            # Push schema changes to database
npx prisma migrate dev        # Create and apply migration
```

## 🐛 Troubleshooting

### Common Issues

**"Database connection failed"**
- Verify `DATABASE_URL` is correct
- Check if database server is accessible
- Ensure Prisma client is generated: `npx prisma generate`

**"YouTube quota exceeded"**
- Wait 24 hours for quota reset
- Consider migrating fewer tracks at once
- Check [Google Cloud Console](https://console.cloud.google.com) quota usage

**"Spotify/Google authentication failed"**
- Verify API credentials in `.env.local`
- Check redirect URIs in developer consoles match exactly
- Ensure `NEXTAUTH_SECRET` is set

**"No tracks found" or matching issues**
- Some tracks may not be available on YouTube
- Try migrating smaller batches
- Check if tracks are region-restricted

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit: `git commit -m "Add feature"`
6. Push: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚖️ Disclaimer

This tool is for personal use only. Ensure you have the right to migrate content and comply with both Spotify and YouTube's terms of service. The app does not store or redistribute copyrighted content - it only creates playlists with links to existing content on YouTube.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Prisma](https://prisma.io/) - Database ORM
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) - Music data
- [YouTube Data API](https://developers.google.com/youtube/v3) - Video platform integration 