# ResumeAi - Smart Resume Intelligence Frontend

**ResumeAi** is a premium, modern Angular application designed to help job seekers bypass ATS filters and build professional, AI-optimized resumes. It features a stunning UI/UX with real-time feedback and advanced layout customization.

---

## ✨ Key Features

### 🔍 AI Resume Analysis & Optimization
- **Tiered Intelligence**: Choose between **Standard** (`minimax-m2.5`), **Advanced Pro** (`nemotron-3-nano`), and **Elite Deep** (`gemini-2.5-flash-lite`) AI models.
- **Smart Suggestions**: Real-time identification of missing skills with one-click "Smart Add" functionality.
- **Progress Tracking**: Visual progress bar showing the step-by-step document generation (CL, Email, Score).

### 📝 Pro Resume Generator
- **Live Interactive Preview**: See your resume change instantly as you type.
- **Drag-and-Drop Layout**: Reorder sections (Education, Skills, Experience) easily using Angular CDK.
- **Density Control**: Three layout modes (**Compact**, **Normal**, **Spacious**) to fit content perfectly on one page.
- **Professional Templates**: ATS-readable designs that prioritize clean typography and structure.

### 📊 Strategic Analytics Dashboard
- **Executive KPI Cards**: Premium cards for total applications, 7-day velocity, and analysis counts.
- **Visual Status Grid**: Color-coded distribution cards showing your standing in the hiring pipeline.
- **Conversion Insights**: Data-driven tips to optimize your "Applied" to "Interviewing" ratio.

### 🎨 Premium Aesthetics
- **Dark Mode Support**: Deep slate/emerald themes with specialized contrast for form fields.
- **Glassmorphism**: High-end UI elements with blurred backgrounds and semi-transparent layers.
- **Micro-animations**: Dynamic hover effects on KPI cards and smooth tab transitions.

---

## 🛠️ Technology Stack

- **Framework**: Angular 19+
- **Styling**: PrimeNG 19 (Component Library) + Vanilla CSS/SCSS
- **State Management**: Angular Signals (For high-performance reactive UI)
- **Document Generation**: 
  - **jsPDF**: Clean text-based PDF generation.
  - **html2canvas**: High-fidelity visual previews.
- **Interactions**: Angular CDK Drag & Drop.
- **Icons**: PrimeIcons

---

## 🚀 Workflow Highlights

1. **Analyze**: Upload PDF -> Select AI Model -> Get ATS Score & Skill Gap Analysis.
2. **Generate**: Click "Optimized Resume" -> High-fidelity resume builder opens with AI suggestions pre-filled.
3. **Customize**: Adjust density, reorder sections, and refine content using the live preview.
4. **Download**: Export a professional, ATS-readable PDF.

---

## 📁 Key Components

- `AnalyseResumeComponent`: Handles file upload, model selection, and progress monitoring.
- `GenerateResumeComponent`: Comprehensive multi-step form with live preview and layout settings.
- `JobTrackerComponent`: Advanced lifecycle tracking and the Strategic Stats Dashboard.
- `AtsResultComponent`: Displays the detailed AI-driven alignment report.

---

## 👤 Author
**Nitin Manjhi**
*Full-Stack & AI Integration Engineer*
