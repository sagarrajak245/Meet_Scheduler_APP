#!/bin/bash

# This script sets up the directory and file structure for the Next.js Scheduler App.
# It adapts the original plan to use the modern Next.js App Router structure.

echo "🚀 Starting project setup..."

# --- Create Component Directories ---
echo "📁 Creating component directories..."
mkdir -p src/components/ui
mkdir -p src/components/auth
mkdir -p src/components/seller
mkdir -p src/components/buyer
mkdir -p src/components/shared
mkdir -p src/components/layout

# --- Create Component Files ---
echo "📄 Creating component files..."
touch src/components/auth/SignInButton.tsx
touch src/components/auth/RoleSelector.tsx

touch src/components/seller/SellerDashboard.tsx
touch src/components/seller/CalendarView.tsx
touch src/components/seller/AnalyticsCharts.tsx
touch src/components/seller/BookingsList.tsx
touch src/components/seller/AvailabilityEditor.tsx

touch src/components/buyer/SellerBrowser.tsx
touch src/components/buyer/TimeSlotPicker.tsx
touch src/components/buyer/BookingForm.tsx

touch src/components/shared/BookingCard.tsx
touch src/components/shared/AppointmentsList.tsx
touch src/components/shared/LoadingSpinner.tsx

touch src/components/layout/Layout.tsx

# --- Create Lib Directory and Files ---
echo "📚 Creating lib directory and files..."
mkdir -p src/lib
touch src/lib/mongodb.ts
touch src/lib/models.ts # For Mongoose Schemas
touch src/lib/google-calendar.ts
touch src/lib/encryption.ts
touch src/lib/email-service.ts
touch src/lib/analytics-service.ts

# --- Create Hooks and Types Directories ---
echo "훅 Creating hooks and types directories..."
mkdir -p src/hooks
mkdir -p src/types

# --- Create Styles Directory and Move Globals ---
echo "🎨 Setting up styles..."
mkdir -p src/styles
if [ -f "src/app/globals.css" ]; then
    mv src/app/globals.css src/styles/globals.css
    echo "Moved globals.css to src/styles/"
else
    touch src/styles/globals.css
fi

# --- Create App Router Page Structure ---
echo "📄 Creating app page routes..."
mkdir -p src/app/dashboard/seller
mkdir -p src/app/dashboard/buyer
mkdir -p src/app/book/[sellerId]
mkdir -p src/app/appointments
mkdir -p src/app/auth/signin

touch src/app/dashboard/seller/page.tsx
touch src/app/dashboard/buyer/page.tsx
touch src/app/book/[sellerId]/page.tsx
touch src/app/appointments/page.tsx
touch src/app/auth/signin/page.tsx

# --- Create App Router API Structure ---
echo "🔌 Creating API routes..."
mkdir -p src/app/api/auth/[...nextauth]
mkdir -p src/app/api/auth/setup-role
mkdir -p src/app/api/users/preferences
mkdir -p src/app/api/users/me
mkdir -p src/app/api/sellers
mkdir -p src/app/api/sellers/[id]/availability
mkdir -p src/app/api/calendar/save-tokens
mkdir -p src/app/api/bookings
mkdir -p src/app/api/bookings/[id]
mkdir -p src/app/api/analytics/seller/[id]
mkdir -p src/app/api/analytics/track
mkdir -p src/app/api/cron/send-reminders

touch src/app/api/auth/[...nextauth]/route.ts
touch src/app/api/auth/setup-role/route.ts
touch src/app/api/users/preferences/route.ts
touch src/app/api/users/me/route.ts
touch src/app/api/sellers/route.ts
touch src/app/api/sellers/[id]/availability/route.ts
touch src/app/api/calendar/save-tokens/route.ts
touch src/app/api/bookings/route.ts
touch src/app/api/bookings/[id]/route.ts
touch src/app/api/analytics/seller/[id]/route.ts
touch src/app/api/analytics/track/route.ts
touch src/app/api/cron/send-reminders/route.ts

# --- Create Root Files ---
echo "📄 Creating root config files..."
touch vercel.json

echo "✅ All directories and files created successfully!"
echo "➡️ Next steps: Start filling in the code for each file, beginning with the lib/ and API routes."
