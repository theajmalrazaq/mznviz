# mznviz

> **A smarter way to track your expenses**

**mznviz** is a professional, privacy-first Progressive Web App (PWA) for visualizing Meezan Bank statements. Built with React, TypeScript, and Tailwind CSS, it provides clinical precision in analyzing your financial data—all processed locally on your device.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://theajmalrazaq.github.io/mznviz/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ Features

- **📊 Interactive Visualizations**: Beautiful charts and graphs to understand your spending patterns
- **📅 Calendar View**: Navigate transactions by date with an intuitive calendar interface
- **🔍 Smart Search & Filters**: Quickly find transactions with real-time search and category filters
- **📱 Progressive Web App**: Install on any device for a native app-like experience
- **🎨 Dark/Light Mode**: Seamless theme switching for comfortable viewing
- **📂 File Handling**: Open CSV and XLSX files directly from your device's file manager
- **🔒 Privacy First**: All data processing happens locally—nothing ever leaves your device
- **⚡ Lightning Fast**: Sub-millisecond compute with optimized performance
- **📈 Smart Categorization**: Automatic transaction categorization with visual indicators

---

## 🚀 Live Demo

Visit the live application: **[theajmalrazaq.github.io/mznviz](https://theajmalrazaq.github.io/mznviz/)**

---

## 📦 Installation

### As a PWA (Recommended)

1. Visit [theajmalrazaq.github.io/mznviz](https://theajmalrazaq.github.io/mznviz/)
2. Click the **Install** icon in your browser's address bar
3. The app will be added to your home screen/app drawer

### Local Development

```bash
# Clone the repository
git clone https://github.com/theajmalrazaq/mznviz.git
cd mznviz

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

---

## 🎯 Usage

### Importing Your Statement

1. **Export your statement** from Meezan Bank as CSV or XLSX
2. **Import in mznviz** using one of these methods:
   - Click the **"Import your statement"** button
   - Use the upload icon in the header
   - **Open directly** from your file manager (PWA only)
3. **Explore your data** with interactive charts, calendar views, and detailed transaction insights

### File Handling (PWA)

Once installed, mznviz registers as a system file handler for `.csv` and `.xlsx` files. Simply:
- Tap any Meezan Bank statement file on your device
- Select **"Meezan Statement"** (mznviz) from the "Open with" menu
- The app launches automatically and imports your data

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) with TypeScript
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Excel Parsing**: [SheetJS](https://sheetjs.com/)
- **PWA**: Service Worker + Web App Manifest

---

## 🏗️ Project Structure

```
mznviz/
├── public/
│   ├── favicon.svg          # App icon with black background
│   ├── manifest.json        # PWA manifest with file handlers
│   └── sw.js               # Service worker for offline support
├── src/
│   ├── components/
│   │   └── MeezanDashboard.tsx  # Main dashboard component
│   ├── lib/
│   │   └── utils.ts        # Utility functions
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── package.json
├── vite.config.ts          # Vite configuration
└── tailwind.config.js      # Tailwind configuration
```

---

## 🔐 Privacy & Security

- **100% Local Processing**: All data stays on your device
- **No Server Communication**: Zero network requests for data processing
- **No Analytics**: We don't track you
- **No Data Collection**: Your financial data is yours alone
- **Open Source**: Full transparency—review the code yourself

---

## 🌟 Key Highlights

### Smart Features
- **Auto-categorization** of transactions (Dining, Shopping, Transfers, Utilities, etc.)
- **Balance tracking** with opening and closing balance display
- **Monthly summaries** with income vs. expense breakdown
- **Transaction details** with comprehensive information

### Modern UX
- **Minimalist design** with premium aesthetics
- **Smooth animations** and micro-interactions
- **Responsive layout** optimized for all screen sizes
- **Accessible** with proper ARIA labels and keyboard navigation

---

## 📄 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

## 👨‍💻 Author

**Ajmal Razaq**
- GitHub: [@theajmalrazaq](https://github.com/theajmalrazaq)

---

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the need for privacy-first financial tools
- Designed for Meezan Bank customers

---

**Made with ❤️ for financial clarity**
