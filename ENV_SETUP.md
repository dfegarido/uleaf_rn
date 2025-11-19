# Environment Variables Setup

This project uses `.env` files to configure local development API endpoints. This allows each team member to use their own local IP address without modifying code.

## Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Update `.env` with your local IP address:**
   - For **iOS Simulator** or **Android Emulator**: Keep `localhost`
   - For **Physical Devices**: Replace `localhost` with your computer's IP address
   
   Example:
   ```env
   LOCAL_BASE_URL=http://192.168.1.6:5001/i-leaf-u/us-central1
   ```

3. **Find your IP address:**
   - **Mac/Linux**: Run `ifconfig` or `ipconfig getifaddr en0`
   - **Windows**: Run `ipconfig` and look for IPv4 Address

## Important Notes

- ✅ `.env` is **gitignored** - your personal configuration won't be committed
- ✅ `.env.example` is **committed** - serves as a template for the team
- ✅ Production builds **always use production API** - no need to change anything
- ✅ The app automatically detects development vs production mode

## Troubleshooting

If you're having connection issues with a physical device:

1. Make sure your computer and device are on the same WiFi network
2. Make sure your firewall allows connections on port 5001
3. Verify your IP address hasn't changed (it can change when reconnecting to WiFi)
4. Check that Firebase Functions Emulator is running on your computer

## For Team Members

When you clone the repository:

1. Copy `.env.example` to `.env`
2. Update `LOCAL_BASE_URL` with your local IP if using a physical device
3. You're all set! 🎉

