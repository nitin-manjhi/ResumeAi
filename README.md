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

### 🎨 Premium Aesthetics
- **Dark Mode Support**: Fully adaptive UI including specialized drag-and-drop components.
- **Glassmorphism**: Modern UI elements with blurred backgrounds and high-end gradients.
- **Micro-animations**: Smooth transitions and hover effects for a premium feel.

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
- `AtsResultComponent`: Displays detailed dashboard of the AI analysis.

---

## 👤 Author
**Nitin Manjhi**
*Full-Stack & AI Integration Engineer*
