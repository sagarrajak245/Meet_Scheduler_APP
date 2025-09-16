#!/bin/bash

# Define the name of the log file
LOG_FILE="build_errors.log"

# --- Script Start ---
echo "🚀 Starting production build..."
echo "Full output (including any errors) will be logged to: $LOG_FILE"
echo "This may take a few minutes..."

# Run the build command and redirect all output (stdout and stderr)
# to the specified log file. The file will be overwritten on each run.
npm run build > "$LOG_FILE" 2>&1

# Check the exit code of the last command (npm run build)
if [ $? -eq 0 ]; then
  # If the exit code is 0, it means the command was successful
  echo ""
  echo "✅ Build completed successfully!"
  echo "No critical build errors found. You are ready to deploy."
else
  # If the exit code is anything other than 0, it means there was an error
  echo ""
  echo "❌ Build failed. Please check the log file for detailed errors."
  echo "👉 Here is a summary of the errors found in '$LOG_FILE':"
  echo "--------------------------------------------------------"
  # Use 'grep' to quickly filter and show the most important error lines
  grep -i -E "error|failed" "$LOG_FILE"
  echo "--------------------------------------------------------"
  echo "For the full context, please open the complete log file: $LOG_FILE"
fi
```

### How to Use the Script

You only need to do this once.

**Step 1: Make the Script Executable**
Open your terminal (like Git Bash on Windows, which it looks like you are using) and run this command:
```bash
chmod +x build_and_log.sh
```
This command gives your computer permission to run the file as a program.

**Step 2: Run the Script**
Now, instead of running `npm run build`, you will run your new script:
```bash
./build_and_log.sh
 